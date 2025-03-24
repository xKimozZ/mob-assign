// server.js
const fs = require('fs');
const https = require('https');
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Load route modules
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const dbFile = './chat.db';
const db = new sqlite3.Database(dbFile);

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


// Load SSL Certificates (make sure the file and passphrase are correct)
const httpsOptions = {
    pfx: fs.readFileSync('localhost.pfx'),
    passphrase: '1'
};

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Secure session configuration with unset: 'destroy'
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
    cookie: { 
        secure: true,
        httpOnly: true,
        sameSite: 'None'
    }
}));

// Global headers to prevent caching
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
});

// Mount routes under /api
app.use('/api', authRoutes(db));     // Pass the db instance if needed
app.use('/api', friendRoutes(db));
app.use('/api', messageRoutes(db));

// Start the HTTPS server
const PORT = process.env.PORT || 3000;
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS Server started on port ${PORT}`);
});
