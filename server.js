const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const dbFile = './chat.db';
const db = new sqlite3.Database(dbFile);

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware configuration
app.use(session({
    secret: 'your_secret_key', // replace with a secure key in production
    resave: false,
    saveUninitialized: false
}));

// Serve static files from the /public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Database Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         username TEXT UNIQUE NOT NULL,
         password TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS friends (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         user_id INTEGER NOT NULL,
         friend_id INTEGER NOT NULL,
         status TEXT DEFAULT 'accepted',
         UNIQUE(user_id, friend_id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS messages (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         sender_id INTEGER NOT NULL,
         receiver_id INTEGER NOT NULL,
         content TEXT NOT NULL,
         timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// -------------------------
// API Endpoints (under /api)
// -------------------------

// Register a new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) {
                return res.status(400).json({ error: "Username already exists" });
            }
            return res.json({ message: "Registration successful" });
        });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Login an existing user
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
    }
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "Invalid username or password" });
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user.id;
            req.session.username = user.username;
            return res.json({ message: "Login successful" });
        } else {
            return res.status(400).json({ error: "Invalid username or password" });
        }
    });
});

// Logout the current user
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

// Get the current session user information
app.get('/api/me', (req, res) => {
    if (req.session.userId) {
        res.json({ userId: req.session.userId, username: req.session.username });
    } else {
        res.status(401).json({ error: "Not logged in" });
    }
});

// Retrieve the friend list for the logged-in user
app.get('/api/friends', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }
    const sql = `
      SELECT u.id, u.username FROM users u
      JOIN friends f ON u.id = f.friend_id 
      WHERE f.user_id = ? AND f.status = 'accepted'
      UNION
      SELECT u.id, u.username FROM users u
      JOIN friends f ON u.id = f.user_id 
      WHERE f.friend_id = ? AND f.status = 'accepted'
    `;
    db.all(sql, [req.session.userId, req.session.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Could not retrieve friends" });
        }
        res.json(rows);
    });
});

// Add a friend (auto-accepted for simplicity)
app.post('/api/add_friend', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }
    const { friend_username } = req.body;
    if (!friend_username) {
        return res.status(400).json({ error: "Friend username required" });
    }
    db.get(`SELECT * FROM users WHERE username = ?`, [friend_username], (err, friend) => {
        if (err || !friend) {
            return res.status(400).json({ error: "User not found" });
        }
        db.run(`INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')`, [req.session.userId, friend.id], function(err) {
            if (err) {
                return res.status(500).json({ error: "Could not add friend" });
            }
            res.json({ message: "Friend added" });
        });
    });
});

// Send a message to a friend
app.post('/api/send_message', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content) {
        return res.status(400).json({ error: "Receiver and message content required" });
    }
    db.run(`INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`, [req.session.userId, receiver_id, content], function(err) {
        if (err) {
            return res.status(500).json({ error: "Could not send message" });
        }
        res.json({ message: "Message sent" });
    });
});

// Retrieve messages exchanged between the logged-in user and a friend
app.get('/api/get_messages', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }
    const friendId = req.query.friend_id;
    if (!friendId) {
        return res.status(400).json({ error: "Friend ID required" });
    }
    const sql = `
      SELECT m.*, u.username as sender_name FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.timestamp ASC
    `;
    db.all(sql, [req.session.userId, friendId, friendId, req.session.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Could not retrieve messages" });
        }
        res.json(rows);
    });
});

// Start the Node.js server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
