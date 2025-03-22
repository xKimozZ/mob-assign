let pollingInterval;

// Guard: Attach the event listener to the message form if it exists.
const messageForm = document.getElementById("messageForm");
if (messageForm) {
  messageForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent default form submission (which reloads the page)

    const receiverElem = document.getElementById("receiver_id");
    const messageElem = document.getElementById("message");
    if (!receiverElem || !messageElem) {
      console.error("Required form elements not found.");
      return;
    }
    const receiverId = receiverElem.value;
    const messageContent = messageElem.value;

    // Check that a friend is selected
    if (!receiverId) {
      alert("Please select a friend to chat with.");
      return;
    }

    try {
      let response = await fetch("/api/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: receiverId, content: messageContent })
      });
      let data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        // Clear the message input field after successful send
        messageElem.value = "";
        // Optionally, update the chat by fetching new messages
        await fetchMessages(receiverId);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  });
}

/**
 * Loads pending friend requests for the logged-in user and displays them in the UI.
 */
export async function loadPendingRequests() {
  try {
    let response = await fetch("/api/pending_friend_requests");
    let requests = await response.json();

    const container = document.getElementById("pendingRequests");
    if (!container) {
      console.warn("Pending requests container not found.");
      return;
    }
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
    let response = await fetch("/api/respond_friend_request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

/**
 * Loads the friend list for the logged-in user.
 */
export async function loadFriends() {
  try {
    let response = await fetch("/api/friends");
    let friends = await response.json();

    const friendsList = document.getElementById("friends");
    if (!friendsList) {
      console.warn("Friends list element not found.");
      return;
    }
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

/**
 * Adds a friend request by username.
 */
export async function addFriend(event) {
  event.preventDefault();

  const friendInput = document.getElementById("friend_username");
  if (!friendInput) {
    console.warn("Friend username input not found.");
    return;
  }
  const friend_username = friendInput.value;

  try {
    let response = await fetch("/api/add_friend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

/**
 * Selects a friend for chatting.
 * @param {string} friendId - The friend's ID.
 * @param {string} friendName - The friend's username.
 */
export async function selectFriend(friendId, friendName) {
  const chatWithElem = document.getElementById("chat-with");
  const receiverIdElem = document.getElementById("receiver_id");
  if (!chatWithElem || !receiverIdElem) {
    console.warn("Required chat elements not found; retrying...");
    return setTimeout(() => selectFriend(friendId, friendName), 100);
  }
  chatWithElem.textContent = "Chat with " + friendName;
  receiverIdElem.value = friendId;

  const chatMessages = document.getElementById("chat-messages");
  if (chatMessages) {
    chatMessages.innerHTML = ""; // Clear chat
  }

  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  await fetchMessages(friendId);
  pollingInterval = setInterval(async function () {
    await fetchMessages(friendId);
  }, 3000); // Poll every 3 seconds
}

/**
 * Fetches messages for a given friend.
 * Uses localStorage to cache messages and updates the UI if new messages are found.
 * @param {string} friendId - The friend's ID.
 */
export async function fetchMessages(friendId) {
  const cacheKey = `chatMessages_${friendId}`;
  let cachedMessagesStr = localStorage.getItem(cacheKey);
  let cachedMessages = [];
  let lastTimestamp = 0;
  if (cachedMessagesStr) {
    try {
      cachedMessages = JSON.parse(cachedMessagesStr);
      if (cachedMessages.length > 0) {
        lastTimestamp = cachedMessages[cachedMessages.length - 1].timestamp;
      }
      updateChatUI(cachedMessages);
    } catch (error) {
      console.error("Error parsing cached messages:", error);
      cachedMessages = [];
    }
  }

  try {
    // Fetch only new messages after the last timestamp
    let response = await fetch(`/api/get_messages?friend_id=${friendId}&after=${encodeURIComponent(lastTimestamp)}`);
    let newMessages = await response.json();

    if (newMessages.length > 0) {
      // Append new messages to cached ones
      let updatedMessages = [...cachedMessages, ...newMessages];
      localStorage.setItem(cacheKey, JSON.stringify(updatedMessages));
      updateChatUI(updatedMessages);
    }
  } catch (error) {
    console.error("Failed to fetch messages:", error);
  }
}

/**
 * Updates the chat UI with the provided messages.
 * @param {Array} messages - An array of message objects.
 */
function updateChatUI(messages) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) {
    console.warn("chat-messages element not found; retrying...");
    return setTimeout(() => updateChatUI(messages), 100);
  }
  chatMessages.innerHTML = ""; // Clear old messages

  messages.forEach(msg => {
    let p = document.createElement("p");
    p.innerHTML = `<strong>${msg.sender_name}:</strong> ${msg.content} <small>(${msg.timestamp})</small>`;
    chatMessages.appendChild(p);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to latest message
}

/**
 * Loads the sent friend requests (pending) and displays them.
 */
export async function loadSentRequests() {
  try {
    let response = await fetch("/api/sent_friend_requests");
    let requests = await response.json();

    const container = document.getElementById("sentRequests");
    if (!container) {
      console.warn("Sent requests container not found.");
      return;
    }
    container.innerHTML = ""; // Clear previous requests

    if (requests.length === 0) {
      container.innerHTML = "<p>No sent friend requests.</p>";
    } else {
      requests.forEach(req => {
        let requestDiv = document.createElement("div");
        requestDiv.className = "sent-request";
        requestDiv.innerHTML = `
          <span>${req.username}</span>
          <button class="cancelBtn" data-id="${req.id}">Cancel Request</button>
        `;
        container.appendChild(requestDiv);
      });

      // Attach event listeners to cancel buttons
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
    let response = await fetch("/api/cancel_friend_request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
