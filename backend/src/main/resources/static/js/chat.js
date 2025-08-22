let stompClient = null;
let activeChatUser = null;
let currentUser = null;

function showCurrentUser() {
    let display = document.getElementById("currentUserDisplay");
    if (!display) {
        display = document.createElement("div");
        display.id = "currentUserDisplay";
        display.classList.add("current-user-display");
        document.body.appendChild(display);
    }
    display.textContent = "Logged in as: " + currentUser;
}

window.onload = () => {
    fetch("/api/auth/current-user")
        .then(res => {
            if (!res.ok) throw new Error("Not logged in");
            return res.json();
        })
        .then(data => {
            currentUser = data.username;
            showCurrentUser();
            connectWebSocket();
        })
        .catch(err => console.error("Error fetching current user:", err));
};

function connectWebSocket() {
    const socket = new SockJS("/chat-websocket");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log("Connected: " + frame);
    });
}

document.getElementById("searchUser").addEventListener("input", function () {
    let query = this.value.trim();
    const chatList = document.getElementById("chatList");
    chatList.innerHTML = "";

    if (query.length > 1) {
        fetch(`/users?query=${query}`)
            .then(res => res.json())
            .then(users => {
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

function openChat(username) {
    activeChatUser = username;
    document.getElementById("userDisplayName").textContent = username;
    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendBtn").disabled = false;

    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "";

    fetch(`/messages/${currentUser}/${activeChatUser}`)
        .then(res => res.json())
        .then(messages => {
            messages.forEach(m => {
                const cls = m.sender.username === currentUser ? "my-message" : "other-message";
                const time = new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                showMessage(m.sender.username, m.messageText, cls, time);
            });
        });


    if (stompClient && stompClient.subscriptions) {
        Object.keys(stompClient.subscriptions).forEach(id => {
            stompClient.unsubscribe(id);
        });
    }

    stompClient.subscribe(`/topic/messages/${currentUser}.${activeChatUser}`, function (msg) {
        const m = JSON.parse(msg.body);
        const cls = m.sender.username === currentUser ? "my-message" : "other-message";
        const time = new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        showMessage(m.sender.username, m.messageText, cls, time);
    });
}

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

function showMessage(sender, messageText, cls, timestamp) {
    const chatMessages = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(cls);

    div.innerHTML = `
        <div class="message-content">
            <strong>${sender}:</strong> ${messageText}
        </div>
        <div class="message-timestamp">${timestamp}</div>
    `;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
