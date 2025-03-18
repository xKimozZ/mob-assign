document.addEventListener("DOMContentLoaded", function() {
    // Login functionality
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    document.getElementById("error").textContent = data.error;
                } else {
                    // Redirect to chat page on successful login
                    window.location.href = "chat.html";
                }
            })
            .catch(err => console.error(err));
        });
    }

    // Registration functionality
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    document.getElementById("error").textContent = data.error;
                } else {
                    // Redirect to login page after successful registration
                    window.location.href = "login.html";
                }
            })
            .catch(err => console.error(err));
        });
    }

    // Chat page functionality
    if (window.location.pathname.endsWith("chat.html")) {
        // Check if the user is logged in
        fetch('/api/me')
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                window.location.href = "login.html";
            } else {
                document.getElementById("welcome").textContent = "Welcome, " + data.username;
                loadFriends();
            }
        })
        .catch(err => console.error(err));

        // Logout functionality
        document.getElementById("logoutBtn").addEventListener("click", function() {
            fetch('/api/logout')
            .then(res => res.json())
            .then(data => {
                window.location.href = "login.html";
            })
            .catch(err => console.error(err));
        });

        // Add friend functionality
        document.getElementById("addFriendForm").addEventListener("submit", function(e) {
            e.preventDefault();
            const friend_username = document.getElementById("friend_username").value;
            fetch('/api/add_friend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friend_username })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    loadFriends();
                }
            })
            .catch(err => console.error(err));
        });

        // Load friend list from the server
        function loadFriends() {
            fetch('/api/friends')
            .then(res => res.json())
            .then(friends => {
                const friendsList = document.getElementById("friends");
                friendsList.innerHTML = "";
                friends.forEach(friend => {
                    const li = document.createElement("li");
                    li.textContent = friend.username;
                    li.setAttribute("data-id", friend.id);
                    li.style.cursor = "pointer";
                    li.addEventListener("click", function() {
                        selectFriend(friend.id, friend.username);
                    });
                    friendsList.appendChild(li);
                });
            })
            .catch(err => console.error(err));
        }

        let pollingInterval;
        // Function to handle friend selection for chatting
        function selectFriend(friendId, friendName) {
            document.getElementById("chat-with").textContent = "Chat with " + friendName;
            document.getElementById("receiver_id").value = friendId;
            const chatMessages = document.getElementById("chat-messages");
            chatMessages.innerHTML = "";
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
            fetchMessages(friendId);
            pollingInterval = setInterval(function() {
                fetchMessages(friendId);
            }, 3000);
        }

        // Send message functionality
        document.getElementById("messageForm").addEventListener("submit", function(e) {
            e.preventDefault();
            const receiver_id = document.getElementById("receiver_id").value;
            const message = document.getElementById("message").value;
            if (!receiver_id) {
                alert("Please select a friend to chat with.");
                return;
            }
            fetch('/api/send_message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiver_id, content: message })
            })
            .then(res => res.json())
            .then(data => {
                document.getElementById("message").value = "";
                fetchMessages(receiver_id);
            })
            .catch(err => console.error(err));
        });

        // Poll for new messages between the logged-in user and the selected friend
        function fetchMessages(friendId) {
            fetch('/api/get_messages?friend_id=' + friendId)
            .then(res => res.json())
            .then(messages => {
                const chatMessages = document.getElementById("chat-messages");
                let messagesHtml = "";
                messages.forEach(msg => {
                    messagesHtml += "<p><strong>" + msg.sender_name + ":</strong> " + msg.content + " <small>(" + msg.timestamp + ")</small></p>";
                });
                chatMessages.innerHTML = messagesHtml;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            })
            .catch(err => console.error(err));
        }
    }
});
