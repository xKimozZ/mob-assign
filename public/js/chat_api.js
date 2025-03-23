async function noCacheFetch(url, options = {}) {
    const noCacheUrl = `${url}?_=${Date.now()}`;
    const defaultHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache" };

    if (!options.headers) options.headers = {};
    options.headers = { ...options.headers, ...defaultHeaders };

    return fetch(noCacheUrl, options).then(res => res.json());
}

export async function sendMessage(receiverId, content) {
    return noCacheFetch("/api/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: receiverId, content })
    });
}

export async function getPendingRequests() {
    return noCacheFetch("/api/pending_friend_requests", { credentials: "include" });
}

export async function respondFriendRequest(requesterId, responseValue) {
    return noCacheFetch("/api/respond_friend_request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester_id: requesterId, response: responseValue })
    });
}

export async function getFriends() {
    return noCacheFetch("/api/friends", { credentials: "include" });
}

export async function addFriendRequest(friendUsername) {
    return noCacheFetch("/api/add_friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_username: friendUsername })
    });
}

export async function getMessages(friendId, afterTimestamp = 0) {
    return noCacheFetch(`/api/get_messages?friend_id=${friendId}&after=${encodeURIComponent(afterTimestamp)}`);
}

export async function getSentRequests() {
    return noCacheFetch("/api/sent_friend_requests", { credentials: "include" });
}

export async function cancelFriendRequest(friendId) {
    return noCacheFetch("/api/cancel_friend_request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: friendId })
    });
}
