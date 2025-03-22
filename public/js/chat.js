import * as api from "./chat_api.js";
import * as ui from "./chat_ui.js";

let pollingInterval = null;

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

export async function loadFriends() {
  const friends = await api.getFriends();
  ui.updateFriendsListUI(friends, selectFriend);
}

export async function addFriend(event) {
  event.preventDefault();
  const friendInput = document.getElementById("friend_username");
  if (!friendInput) return;
  const friend_username = friendInput.value;
  const data = await api.addFriendRequest(friend_username);
  if (data.error) alert(data.error);
  else await loadFriends();
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
