import * as api from "./chat_api.js";
import * as ui from "./chat_ui.js";

let pollingInterval = null;

export async function intializeChatEvents(logoutCallback) {
  await loadFriends();
  await loadPendingRequests();
  await loadSentRequests();

  document.getElementById("logoutBtn").addEventListener("click", logoutCallback);
  //document.getElementById("addFriendForm").addEventListener("submit", addFriend);
  document.getElementById("messageForm").addEventListener("submit", sendMessageHandler);
  document.getElementById("searchFriendForm").addEventListener("submit", searchFriends);

  // Update UI every 10 seconds
  const UI_UPDATE_INTERVAL = 10000;
  setInterval(async () => {
    await loadFriends();
  }, UI_UPDATE_INTERVAL);

  setInterval(async () => {
    await loadPendingRequests();
  }, UI_UPDATE_INTERVAL);

  setInterval(async () => {
    await loadSentRequests();
  }, UI_UPDATE_INTERVAL);
  
}

export async function fetchMessages(friendId) {
    const cacheKey = `chatMessages_${friendId}`;
    let cachedMessages = [];
    let lastTimestamp = 0;
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
        try {
            cachedMessages = JSON.parse(cachedStr);
            if (cachedMessages.length > 0) {
                lastTimestamp = cachedMessages[cachedMessages.length - 1].timestamp;
            }
            ui.updateChatUI(cachedMessages);
        } catch (e) {
            cachedMessages = [];
        }
    }
    const newMessages = await api.getMessages(friendId, lastTimestamp);
    if (newMessages.length > 0) {
        const updatedMessages = [...cachedMessages, ...newMessages];
        localStorage.setItem(cacheKey, JSON.stringify(updatedMessages));
        ui.updateChatUI(updatedMessages);
    }
}

export async function selectFriend(friendId, friendName) {
    const chatWithElem = document.getElementById("chat-with");
    const receiverElem = document.getElementById("receiver_id");
    if (!chatWithElem || !receiverElem) {
        return setTimeout(() => selectFriend(friendId, friendName), 100);
    }
    chatWithElem.textContent = "Chat with " + friendName;
    receiverElem.value = friendId;
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) chatMessages.innerHTML = "";
    if (pollingInterval) clearInterval(pollingInterval);
    await fetchMessages(friendId);
    pollingInterval = setInterval(async () => {
        await fetchMessages(friendId);
    }, 3000);
}

export async function deleteFriend(friendId) {
  const res = await api.unfriend(friendId);
  if (res.error) {
      alert(res.error);
  } else {
      alert(res.message);
      await loadFriends();
  }
}

export async function loadFriends() {
    const friends = await api.getFriends();
    ui.updateFriendsListUI(friends, selectFriend, deleteFriend );
}

export async function addFriend(event) {
    event.preventDefault();
    const friendInput = document.getElementById("friend_username");
    if (!friendInput) return;
    const friend_username = friendInput.value;
    const data = await api.addFriendRequest(friend_username);
    alert(data.message || data.error);
    await loadFriends();
}

export async function sendMessageHandler(event) {
    event.preventDefault();
    const receiverElem = document.getElementById("receiver_id");
    const messageElem = document.getElementById("message");
    if (!receiverElem || !messageElem) {
        console.error("Required form elements not found.");
        return;
    }
    const receiverId = receiverElem.value;
    const messageContent = messageElem.value;
    if (!receiverId) {
        alert("Please select a friend to chat with.");
        return;
    }
    const res = await api.sendMessage(receiverId, messageContent);
    if (res.error) {
        alert(res.error);
    } else {
        messageElem.value = "";
        await fetchMessages(receiverId);
    }
}

// NEW: Search Friends - split into API call and UI update
export async function searchFriends(event) {
  event.preventDefault();
  const term = document.getElementById("searchTerm").value;
  try {
      const users = await api.searchFriends(term);
      // Pass a callback that handles adding a friend by username
      ui.updateSearchResultsUI(users, async (username) => {
          const response = await api.addFriendRequest(username);
          alert(response.message || response.error);
          await loadFriends();
      });
  } catch (error) {
      console.error("Search error:", error);
  }
}

export async function loadPendingRequests() {
    const requests = await api.getPendingRequests();
    ui.updatePendingRequestsUI(requests);
    const container = document.getElementById("pendingRequests");
    if (!container) return;
    container.querySelectorAll(".approveBtn").forEach(button => {
        button.addEventListener("click", async function () {
            const requesterId = this.getAttribute("data-id");
            const res = await api.respondFriendRequest(requesterId, "accepted");
            if (res.error) alert(res.error);
            else alert(res.message);
            await loadPendingRequests();
        });
    });
    container.querySelectorAll(".rejectBtn").forEach(button => {
        button.addEventListener("click", async function () {
            const requesterId = this.getAttribute("data-id");
            const res = await api.respondFriendRequest(requesterId, "rejected");
            if (res.error) alert(res.error);
            else alert(res.message);
            await loadPendingRequests();
        });
    });
}

export async function loadSentRequests() {
    const requests = await api.getSentRequests();
    ui.updateSentRequestsUI(requests);
    const container = document.getElementById("sentRequests");
    if (!container) return;
    container.querySelectorAll(".cancelBtn").forEach(button => {
        button.addEventListener("click", async function () {
            const friendId = this.getAttribute("data-id");
            const res = await api.cancelFriendRequest(friendId);
            if (res.error) alert(res.error);
            else alert(res.message);
            await loadSentRequests();
        });
    });
}
