import { checkAndRedirect } from "./js/session.js";
import { loginUser, registerUser, logoutUser } from "./js/auth.js";
import { loadFriends, addFriend, selectFriend, loadPendingRequests, loadSentRequests } from "./js/chat.js";

document.addEventListener("DOMContentLoaded", async function () {
  await checkAndRedirect();

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", loginUser);
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", registerUser);
  }

  if (window.location.pathname.endsWith("chat.html")) {
    await loadFriends();
    await loadPendingRequests();  // Load pending friend requests
    await loadSentRequests();      // Load sent friend requests
    document.getElementById("logoutBtn").addEventListener("click", logoutUser);
    document.getElementById("addFriendForm").addEventListener("submit", addFriend);
  }
});
