// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');

module.exports = function(db) {
  const router = express.Router();

  // Register a new user
  router.post('/register', async (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) {
          return res.status(422).json({ error: "Username and password required" });
      }
      try {
          const hashedPassword = await bcrypt.hash(password, 10);
          db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
              if (err) {
                  return res.status(409).json({ error: "Username already exists" });
              }
              return res.status(201).json({ message: "Registration successful" });
          });
      } catch (err) {
          res.status(500).json({ error: "Internal server error" });
      }
  });

  // Login an existing user
  router.post('/login', (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) {
          return res.status(422).json({ error: "Username and password required" });
      }
      db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
          if (err || !user) {
              return res.status(401).json({ error: "Invalid username or password" });
          }
          const match = await bcrypt.compare(password, user.password);
          if (match) {
              req.session.userId = user.id;
              req.session.username = user.username;
              return res.status(200).json({ message: "Login successful" });
          } else {
              return res.status(401).json({ error: "Invalid username or password" });
          }
      });
  });

  // Logout the current user
  router.get('/logout', (req, res) => {
      console.log("Before logout, session:", req.session);
      req.session.destroy(err => {
          if (err) {
              console.error("Logout error:", err);
              return res.status(500).json({ error: "Could not log out" });
          }
          // Clear cookie; options must match session configuration
          res.clearCookie('connect.sid', { path: '/', secure: true, httpOnly: true, sameSite: 'None' });
          console.log("After logout, session destroyed. Cookie cleared.");
          return res.status(200).json({ message: "Logged out" });
      });
  });

  // Get the current session user information
  router.get('/me', (req, res) => {
      console.log("Session at /api/me:", req.session);
      if (req.session && req.session.userId) {
          return res.status(200).json({ userId: req.session.userId, username: req.session.username });
      } else {
          return res.status(401).json({ error: "Not logged in" });
      }
  });

  return router;
};
