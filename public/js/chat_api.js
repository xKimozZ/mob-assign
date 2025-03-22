export async function sendMessage(receiverId, content) {
    const res = await fetch("/api/send_message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: receiverId, content })
    });
    return await res.json();
  }
  
  export async function getPendingRequests() {
    const res = await fetch("/api/pending_friend_requests");
    return await res.json();
  }
  
  export async function respondFriendRequest(requesterId, responseValue) {
    const res = await fetch("/api/respond_friend_request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requester_id: requesterId, response: responseValue })
    });
    return await res.json();
  }
  
  export async function getFriends() {
    const res = await fetch("/api/friends");
    return await res.json();
  }
  
  export async function addFriendRequest(friendUsername) {
    const res = await fetch("/api/add_friend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend_username: friendUsername })
    });
    return await res.json();
  }
  
  export async function getMessages(friendId, afterTimestamp = 0) {
    const res = await fetch(`/api/get_messages?friend_id=${friendId}&after=${encodeURIComponent(afterTimestamp)}`);
    return await res.json();
  }
  
  export async function getSentRequests() {
    const res = await fetch("/api/sent_friend_requests");
    return await res.json();
  }
  
  export async function cancelFriendRequest(friendId) {
    const res = await fetch("/api/cancel_friend_request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend_id: friendId })
    });
    return await res.json();
  }
  