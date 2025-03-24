// routes/messageRoutes.js
const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // Send a message to a friend
  router.post('/send_message', (req, res) => {
      if (!req.session.userId) {
          return res.status(401).json({ error: "Not logged in" });
      }
      const { receiver_id, content } = req.body;
      if (!receiver_id || !content) {
          return res.status(422).json({ error: "Receiver and message content required" });
      }
      db.run(`INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`, [req.session.userId, receiver_id, content], function(err) {
          if (err) {
              return res.status(500).json({ error: "Could not send message" });
          }
          return res.status(201).json({ message: "Message sent" });
      });
  });

  // Retrieve messages exchanged between the logged-in user and a friend
  router.get('/get_messages', (req, res) => {
      if (!req.session.userId) {
          return res.status(401).json({ error: "Not logged in" });
      }
      const friendId = req.query.friend_id;
      const afterTimestamp = req.query.after || 0; // default to 0 if not provided
      if (!friendId) {
          return res.status(422).json({ error: "Friend ID required" });
      }
      const sql = `
        SELECT m.*, u.username as sender_name FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
          AND m.timestamp > ?
        ORDER BY m.timestamp ASC
      `;
      db.all(sql, [req.session.userId, friendId, friendId, req.session.userId, afterTimestamp], (err, rows) => {
          if (err) {
              return res.status(500).json({ error: "Could not retrieve messages" });
          }
          return res.status(200).json(rows);
      });
  });

  return router;
};
