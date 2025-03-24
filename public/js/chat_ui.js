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
      li.className = "friend-item";
      li.textContent = friend.username;
      li.addEventListener("click", () => selectFriendCallback(friend.id, friend.username));
      
      // Create Unfriend button with spacing
      const unfriendBtn = document.createElement("button");
      unfriendBtn.className = "unfriend-btn";
      unfriendBtn.textContent = "Unfriend";
      unfriendBtn.addEventListener("click", (event) => {
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
      container.innerHTML = "<p>No received friend requests.</p>";
  } else {
      requests.forEach(req => {
          const div = document.createElement("div");
          div.className = "friend-request";
          div.style.display = "flex";
          div.style.justifyContent = "space-between";
          div.style.alignItems = "center";
          div.style.padding = "6px 0";
            div.innerHTML = `<span>${req.username}</span>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <button class="approveBtn" data-id="${req.id}" style="margin-right: 10px; padding: 2px 6px; font-size: 12px;">Accept</button>
              <button class="rejectBtn" data-id="${req.id}" style="padding: 2px 6px; font-size: 12px;">Reject</button>
            </div>`;
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
          div.style.display = "flex";
          div.style.justifyContent = "space-between";
          div.style.alignItems = "center";
          div.style.padding = "6px 0";
          div.innerHTML = `<span>${req.username}</span>
            <button class="cancelBtn" data-id="${req.id}">Cancel</button>`;
          container.appendChild(div);
      });
  }
}

export function updateSearchResultsUI(users, addCallback) {
  const resultsEl = document.getElementById("searchResults");
  if (!resultsEl) return;
  resultsEl.innerHTML = "";
  // Set margin and scroll properties
  resultsEl.style.marginTop = "10px";
  resultsEl.style.maxHeight = "120px";
  resultsEl.style.padding = "10px";
  resultsEl.style.overflowY = "auto";
  
  if (!users || users.length === 0) {
      resultsEl.innerHTML = `<li>No users found.</li>`;
      return;
  }
  
  users.forEach(user => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.padding = "6px 8px";
      li.textContent = user.username;
      
      // Create a blue "Add" button
      const addBtn = document.createElement("button");
      addBtn.textContent = "Add";
      addBtn.style.backgroundColor = "#3498db";
      addBtn.style.border = "none";
      addBtn.style.color = "#fff";
      addBtn.style.padding = "4px 12px";
      addBtn.style.borderRadius = "4px";
      addBtn.style.cursor = "pointer";
      addBtn.style.fontSize = "12px";
      addBtn.style.marginLeft = "10px";
      addBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          addCallback(user.username);
      });
      
      li.appendChild(addBtn);
      resultsEl.appendChild(li);
  });
}
