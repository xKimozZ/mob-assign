let pollingInterval;

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
