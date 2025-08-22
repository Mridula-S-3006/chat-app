let stompClient = null;
let currentUser = null;     // logged-in user (TODO: set this from backend auth/session)
let activeChatUser = null;  // person we are chatting with

// connect to WebSocket
function connectWebSocket() {
    const socket = new SockJS("/chat-websocket");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log("Connected: " + frame);
    });
}

// search bar event
document.getElementById("searchUser").addEventListener("input", function () {
    let query = this.value.trim();

    if (query.length > 1) {
        fetch(`/users?query=${query}`)
            .then(res => res.json())
            .then(users => {
                const chatList = document.getElementById("chatList");
                chatList.innerHTML = "";

                users.forEach(u => {
                    const div = document.createElement("div");
                    div.classList.add("chat-list-item");
                    div.textContent = u.username;
                    div.onclick = () => openChat(u.username);
                    chatList.appendChild(div);
                });
            })
            .catch(err => console.error("Error fetching users:", err));
    }
});

// open chat with a specific user
function openChat(username) {
    activeChatUser = username;
    document.getElementById("userDisplayName").textContent = username;
    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendBtn").disabled = false;

    // clear old messages
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "";

    // fetch chat history
    fetch(`/messages/${currentUser}/${activeChatUser}`)
        .then(res => res.json())
        .then(messages => {
            messages.forEach(m => showMessage(m.sender, m.content));
        });

    // unsubscribe old topic if any
    if (stompClient && stompClient.subscriptions) {
        Object.keys(stompClient.subscriptions).forEach(id => {
            stompClient.unsubscribe(id);
        });
    }

    // subscribe to private topic
    stompClient.subscribe(`/topic/messages/${currentUser}.${activeChatUser}`, function (msg) {
        const m = JSON.parse(msg.body);
        showMessage(m.sender, m.content);
    });
}

// send message
document.getElementById("sendBtn").addEventListener("click", function () {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (text && stompClient && activeChatUser) {
        stompClient.send(`/app/chat/${activeChatUser}`, {}, JSON.stringify({
            sender: currentUser,
            content: text
        }));

        input.value = "";
    }
});

// show message in UI
function showMessage(sender, content) {
    const chatMessages = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `<strong>${sender}:</strong> ${content}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// start WebSocket connection on page load
window.onload = () => {
    connectWebSocket();
};
