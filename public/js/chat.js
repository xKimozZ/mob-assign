let pollingInterval;
/**
 * Loads pending friend requests for the logged-in user and displays them in the UI.
 */
export async function loadPendingRequests() {
    try {
      let response = await fetch('/api/pending_friend_requests');
      let requests = await response.json();
      
      const container = document.getElementById("pendingRequests");
      container.innerHTML = ""; // Clear any previous requests
  
      if (requests.length === 0) {
        container.innerHTML = "<p>No pending friend requests.</p>";
      } else {
        requests.forEach(req => {
          // Create a container for each request
          let requestDiv = document.createElement("div");
          requestDiv.className = "friend-request";
          requestDiv.innerHTML = `
            <span>${req.username}</span>
            <button class="approveBtn" data-id="${req.id}" data-response="accepted">Accept</button>
            <button class="rejectBtn" data-id="${req.id}" data-response="rejected">Reject</button>
          `;
          container.appendChild(requestDiv);
        });
  
        // Attach click event listeners to the newly created buttons
        const approveButtons = container.querySelectorAll(".approveBtn");
        const rejectButtons = container.querySelectorAll(".rejectBtn");
  
        approveButtons.forEach(button => {
          button.addEventListener("click", async function () {
            const requesterId = this.getAttribute("data-id");
            await respondToFriendRequest(requesterId, "accepted");
            await loadPendingRequests(); // Refresh the list after response
          });
        });
  
        rejectButtons.forEach(button => {
          button.addEventListener("click", async function () {
            const requesterId = this.getAttribute("data-id");
            await respondToFriendRequest(requesterId, "rejected");
            await loadPendingRequests(); // Refresh the list after response
          });
        });
      }
    } catch (error) {
      console.error("Failed to load pending friend requests:", error);
    }
  }
  
  /**
   * Sends a response (accept or reject) to a pending friend request.
   * @param {string} requesterId - The ID of the user who sent the friend request.
   * @param {string} responseValue - Either "accepted" or "rejected".
   */
  async function respondToFriendRequest(requesterId, responseValue) {
    try {
      let response = await fetch('/api/respond_friend_request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: requesterId, response: responseValue })
      });
      let data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to respond to friend request:", error);
    }
  }  


export async function loadFriends() {
    try {
        let response = await fetch('/api/friends');
        let friends = await response.json();

        const friendsList = document.getElementById("friends");
        friendsList.innerHTML = ""; // Clear existing list

        friends.forEach(friend => {
            let li = document.createElement("li");
            li.textContent = friend.username;
            li.setAttribute("data-id", friend.id);
            li.style.cursor = "pointer";
            li.addEventListener("click", function () {
                selectFriend(friend.id, friend.username);
            });
            friendsList.appendChild(li);
        });
    } catch (error) {
        console.error("Failed to load friends:", error);
    }
}

export async function addFriend(event) {
    event.preventDefault();

    const friend_username = document.getElementById("friend_username").value;

    try {
        let response = await fetch('/api/add_friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friend_username })
        });

        let data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            await loadFriends();
        }
    } catch (error) {
        console.error("Failed to add friend:", error);
    }
}

export async function selectFriend(friendId, friendName) {
    document.getElementById("chat-with").textContent = "Chat with " + friendName;
    document.getElementById("receiver_id").value = friendId;

    document.getElementById("chat-messages").innerHTML = ""; // Clear chat

    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    await fetchMessages(friendId);
    pollingInterval = setInterval(async function () {
        await fetchMessages(friendId);
    }, 3000); // Poll every 3 seconds
}

export async function fetchMessages(friendId) {
    try {
        let response = await fetch(`/api/get_messages?friend_id=${friendId}`);
        let messages = await response.json();

        const chatMessages = document.getElementById("chat-messages");
        chatMessages.innerHTML = ""; // Clear old messages

        messages.forEach(msg => {
            let p = document.createElement("p");
            p.innerHTML = `<strong>${msg.sender_name}:</strong> ${msg.content} <small>(${msg.timestamp})</small>`;
            chatMessages.appendChild(p);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to latest message
    } catch (error) {
        console.error("Failed to fetch messages:", error);
    }
}

/**
 * Loads the sent friend requests (pending) and displays them in the UI.
 */
export async function loadSentRequests() {
    try {
      let response = await fetch('/api/sent_friend_requests');
      let requests = await response.json();
      
      const container = document.getElementById("sentRequests");
      container.innerHTML = ""; // Clear any previous requests
  
      if (requests.length === 0) {
        container.innerHTML = "<p>No sent friend requests.</p>";
      } else {
        requests.forEach(req => {
          // Create a container for each sent request
          let requestDiv = document.createElement("div");
          requestDiv.className = "sent-request";
          requestDiv.innerHTML = `
            <span>${req.username}</span>
            <button class="cancelBtn" data-id="${req.id}">Cancel Request</button>
          `;
          container.appendChild(requestDiv);
        });
  
        // Attach click event listeners to cancel buttons
        const cancelButtons = container.querySelectorAll(".cancelBtn");
        cancelButtons.forEach(button => {
          button.addEventListener("click", async function () {
            const friendId = this.getAttribute("data-id");
            await cancelFriendRequest(friendId);
            await loadSentRequests(); // Refresh the list after cancellation
          });
        });
      }
    } catch (error) {
      console.error("Failed to load sent friend requests:", error);
    }
  }
  
  /**
   * Sends a cancellation request for a pending friend request.
   * @param {string} friendId - The ID of the friend to cancel the request for.
   */
  async function cancelFriendRequest(friendId) {
    try {
      let response = await fetch('/api/cancel_friend_request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: friendId })
      });
      let data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to cancel friend request:", error);
    }
  }
  