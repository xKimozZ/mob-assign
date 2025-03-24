// routes/friendRoutes.js
const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // Retrieve the friend list for the logged-in user
  router.get('/friends', (req, res) => {
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
          return res.status(200).json(rows);
      });
  });

  // Add friend request
  router.post('/add_friend', (req, res) => {
      if (!req.session.userId) {
          return res.status(401).json({ error: "Not logged in" });
      }
      const { friend_username } = req.body;
      if (!friend_username) {
          return res.status(422).json({ error: "Friend username required" });
      }
      
      db.get(`SELECT * FROM users WHERE username = ?`, [friend_username], (err, friend) => {
          if (err || !friend) {
              return res.status(404).json({ error: "User not found" });
          }
          
          db.get(`SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`, 
            [req.session.userId, friend.id, friend.id, req.session.userId], (err, row) => {
              if (err) return res.status(500).json({ error: "Database error" });
              
              if (row) {
                  if (row.status === "pending") {
                      if (row.user_id === req.session.userId) {
                          return res.status(409).json({ error: "Friend request already sent" });
                      } else {
                          return res.status(409).json({ error: "This user has already sent you a request. Accept or reject it first." });
                      }
                  } else if (row.status === "accepted") {
                      return res.status(409).json({ error: "You are already friends" });
                  } else if (row.status === "rejected") {
                      db.run(`DELETE FROM friends WHERE user_id = ? AND friend_id = ?`, [req.session.userId, friend.id], function(delErr) {
                          if (delErr) return res.status(500).json({ error: "Could not reset friend request" });
                          insertFriendRequest();
                      });
                      return;
                  }
              } else {
                  insertFriendRequest();
              }
          });
          
          function insertFriendRequest() {
              db.run(
                  `INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')`,
                  [req.session.userId, friend.id],
                  function (err) {
                      if (err) return res.status(500).json({ error: "Could not send friend request" });
                      return res.status(201).json({ message: "Friend request sent and pending approval" });
                  }
              );
          }
      });
  });

  // Respond to friend request
  router.post('/respond_friend_request', (req, res) => {
      if (!req.session.userId) {
          return res.status(401).json({ error: "Not logged in" });
      }
      const { requester_id, response } = req.body;
      if (!requester_id || !response || (response !== 'accepted' && response !== 'rejected')) {
          return res.status(422).json({ error: "Invalid parameters" });
      }
      
      if (response === "accepted") {
          db.run(
              `UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?`,
              [requester_id, req.session.userId],
              function (err) {
                  if (err) return res.status(500).json({ error: "Could not respond to friend request" });
                  if (this.changes === 0) return res.status(404).json({ error: "No such friend request found" });
                  return res.status(200).json({ message: "Friend request accepted" });
              }
          );
      } else {
          db.run(
              `DELETE FROM friends WHERE user_id = ? AND friend_id = ?`,
              [requester_id, req.session.userId],
              function (err) {
                  if (err) return res.status(500).json({ error: "Could not respond to friend request" });
                  if (this.changes === 0) return res.status(404).json({ error: "No such friend request found" });
                  return res.status(200).json({ message: "Friend request rejected" });
              }
          );
      }
  });

  // Get pending friend requests
  router.get('/pending_friend_requests', (req, res) => {
      if (!req.session.userId) {
          return res.status(401).json({ error: "Not logged in" });
      }
      const sql = `
        SELECT u.id, u.username FROM users u
        JOIN friends f ON u.id = f.user_id
        WHERE f.friend_id = ? AND f.status = 'pending'
      `;
      db.all(sql, [req.session.userId], (err, rows) => {
          if (err) {
              return res.status(500).json({ error: "Could not retrieve pending requests" });
          }
          return res.status(200).json(rows);
      });
  });

  // Get sent friend requests
  router.get('/sent_friend_requests', (req, res) => {
      if (!req.session.userId) {
          return res.status(401).json({ error: "Not logged in" });
      }
      const sql = `
        SELECT f.friend_id AS id, u.username 
        FROM friends f 
        JOIN users u ON f.friend_id = u.id 
        WHERE f.user_id = ? AND f.status = 'pending'
      `;
      db.all(sql, [req.session.userId], (err, rows) => {
          if (err) {
              return res.status(500).json({ error: "Could not retrieve sent friend requests" });
          }
          return res.status(200).json(rows);
      });
  });

  // Cancel friend request
  router.post('/cancel_friend_request', (req, res) => {
      if (!req.session.userId) {
          return res.status(401).json({ error: "Not logged in" });
      }
      const { friend_id } = req.body;
      if (!friend_id) {
          return res.status(422).json({ error: "Friend id is required" });
      }
      const sql = `
        DELETE FROM friends 
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
      `;
      db.run(sql, [req.session.userId, friend_id], function(err) {
          if (err) {
              return res.status(500).json({ error: "Could not cancel friend request" });
          }
          if (this.changes === 0) {
              return res.status(404).json({ error: "No pending request found to cancel" });
          }
          return res.status(200).json({ message: "Friend request canceled" });
      });
  });

  // Search friends endpoint
router.get('/search_friends', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }
    const term = req.query.term;
    console.log("Search term received:", term); // Debug log
    if (!term) {
        return res.status(422).json({ error: "Search term required" });
    }
    const sql = `
      SELECT id, username FROM users
      WHERE username LIKE ? AND id != ?
    `;
    db.all(sql, [`%${term}%`, req.session.userId], (err, rows) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error while searching" });
        }
        console.log("Search results:", rows); // Debug log
        return res.status(200).json(rows);
    });
});

    // Unfriend endpoint: Remove an accepted friend relationship
router.delete('/unfriend', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }
    const { friend_id } = req.body;
    if (!friend_id) {
        return res.status(422).json({ error: "Friend id is required" });
    }
    const sql = `
      DELETE FROM friends 
      WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
        AND status = 'accepted'
    `;
    db.run(sql, [req.session.userId, friend_id, friend_id, req.session.userId], function(err) {
        if (err) {
            return res.status(500).json({ error: "Could not unfriend" });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Friend not found" });
        }
        return res.status(200).json({ message: "Unfriended successfully" });
    });
});

  return router;
};

