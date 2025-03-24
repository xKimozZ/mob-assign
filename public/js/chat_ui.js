export function updateChatUI(messages) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) {
    return setTimeout(() => updateChatUI(messages), 100);
  }
  chatMessages.innerHTML = "";
  messages.forEach(msg => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${msg.sender_name}:</strong> ${msg.content} <small>(${msg.timestamp})</small>`;
    chatMessages.appendChild(p);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

export function updateFriendsListUI(friends, selectFriendCallback, unfriendCallback) {
  const friendsList = document.getElementById("friends");
  if (!friendsList) return;
  friendsList.innerHTML = "";
  friends.forEach(friend => {
      const li = document.createElement("li");
      li.textContent = friend.username;
      li.setAttribute("data-id", friend.id);
      li.style.cursor = "pointer";
      li.addEventListener("click", () => selectFriendCallback(friend.id, friend.username));
      
      // Create Unfriend button
      const unfriendBtn = document.createElement("button");
      unfriendBtn.textContent = "Unfriend";
      unfriendBtn.style.marginLeft = "10px";
      unfriendBtn.addEventListener("click", (event) => {
          // Prevent the li click event from firing:
          event.stopPropagation();
          if (confirm(`Are you sure you want to unfriend ${friend.username}?`)) {
              unfriendCallback(friend.id);
          }
      });
      
      li.appendChild(unfriendBtn);
      friendsList.appendChild(li);
  });
}


export function updatePendingRequestsUI(requests) {
  const container = document.getElementById("pendingRequests");
  if (!container) return;
  container.innerHTML = "";
  if (requests.length === 0) {
    container.innerHTML = "<p>No pending friend requests.</p>";
  } else {
    requests.forEach(req => {
      const div = document.createElement("div");
      div.className = "friend-request";
      div.innerHTML = `<span>${req.username}</span>
        <button class="approveBtn" data-id="${req.id}">Accept</button>
        <button class="rejectBtn" data-id="${req.id}">Reject</button>`;
      container.appendChild(div);
    });
  }
}

export function updateSentRequestsUI(requests) {
  const container = document.getElementById("sentRequests");
  if (!container) return;
  container.innerHTML = "";
  if (requests.length === 0) {
    container.innerHTML = "<p>No sent friend requests.</p>";
  } else {
    requests.forEach(req => {
      const div = document.createElement("div");
      div.className = "sent-request";
      div.innerHTML = `<span>${req.username}</span>
        <button class="cancelBtn" data-id="${req.id}">Cancel Request</button>`;
      container.appendChild(div);
    });
  }
}

// NEW: Update the search results UI
export function updateSearchResultsUI(users) {
  const resultsEl = document.getElementById("searchResults");
  if (!resultsEl) return;
  resultsEl.innerHTML = "";
  if (!users || users.length === 0) {
      resultsEl.innerHTML = `<li>No users found.</li>`;
      return;
  }
  users.forEach(user => {
      const li = document.createElement("li");
      li.textContent = user.username;
      // Optionally, add a click event to send a friend request
      li.addEventListener("click", async () => {
          const response = await import("./chat_api.js").then(api => api.addFriendRequest(user.username));
          alert(response.message || response.error);
          // Refresh friend list if needed
          await import("./chat.js").then(module => module.loadFriends());
      });
      resultsEl.appendChild(li);
  });
}
