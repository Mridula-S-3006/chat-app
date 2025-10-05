let stompClient = null;
let activeChatUser = null;
let currentUser = null;

// --- RemindBot Config ---
const REMIND_BOT_NAME = "RemindBot";

// --- Show current logged in user ---
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

// --- Request Notification Permission ---
function requestNotificationPermission() {
    return new Promise((resolve) => {
        if (!("Notification" in window)) {
            console.log("Notifications not supported");
            return resolve(false);
        }
        if (Notification.permission === "granted") {
            console.log("Notification permission already granted");
            return resolve(true);
        }
        if (Notification.permission === "denied") {
            console.log("Notification permission denied");
            return resolve(false);
        }
        console.log("Requesting notification permission...");
        Notification.requestPermission().then(permission => {
            console.log("Permission result:", permission);
            resolve(permission === "granted");
        });
    });
}

// --- Trigger Notification ---
function triggerNotification(title, body) {
    console.log("Attempting to send notification:", title, body);
    
    if (!("Notification" in window)) {
        console.log("Browser doesn't support notifications");
        alert(`${title}: ${body}`);
        return;
    }
    
    if (Notification.permission === "granted") {
        console.log("Sending notification...");
        const notification = new Notification(title, { 
            body: body
            // Removed icon to avoid 404 errors
        });
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
    } else if (Notification.permission === "denied") {
        console.log("Notifications are blocked");
        alert(`${title}: ${body}`);
    } else {
        console.log("Requesting permission then sending notification");
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                const notification = new Notification(title, { 
                    body: body
                });
                notification.onclick = function() {
                    window.focus();
                    notification.close();
                };
            } else {
                alert(`${title}: ${body}`);
            }
        });
    }
}

// --- Connect WebSocket ---
function connectWebSocket() {
    const socket = new SockJS("/chat-websocket");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log("Connected: " + frame);
    });
}

// --- Window on load ---
window.onload = () => {
    console.log("=== Page loaded ===");
    console.log("Notification support:", "Notification" in window);
    console.log("Notification permission:", Notification.permission);
    
    fetch("/api/auth/current-user")
        .then(res => {
            if (!res.ok) throw new Error("Not logged in");
            return res.json();
        })
        .then(data => {
            console.log("User data received:", data);
            currentUser = data.username;
            showCurrentUser();
            connectWebSocket();
            
            // Request notification permission immediately and show result
            console.log("About to request notification permission...");
            requestNotificationPermission().then(granted => {
                console.log("Permission granted:", granted);
                if (granted) {
                    console.log("✓ Notifications enabled!");
                    // Test notification
                    console.log("Sending test notification in 1 second...");
                    setTimeout(() => {
                        console.log("NOW sending test notification");
                        triggerNotification("Notifications Ready", "You will now receive chat notifications!");
                    }, 1000);
                } else {
                    console.warn("✗ Notifications not enabled. Please allow notifications in your browser.");
                    alert("Please enable notifications for this site to receive message alerts!");
                }
            });

            // --- Open RemindBot by default ---
            activeChatUser = REMIND_BOT_NAME;
            openChat(REMIND_BOT_NAME);
        })
        .catch(err => console.error("Error fetching current user:", err));
};

// --- Search Users ---
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

// --- Open Chat ---
function openChat(username) {
    activeChatUser = username;
    document.getElementById("userDisplayName").textContent = username;
    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendBtn").disabled = false;

    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "";

    // Don't fetch messages for RemindBot (it's client-side only)
    if (username !== REMIND_BOT_NAME) {
        fetch(`/messages/${currentUser}/${activeChatUser}`)
            .then(res => res.json())
            .then(messages => {
                if (Array.isArray(messages)) {
                    messages.forEach(m => {
                        const cls = m.sender.username === currentUser ? "my-message" : "other-message";
                        const time = new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        showMessage(m.sender.username, m.messageText, cls, time);
                    });
                }
            })
            .catch(err => console.error("Error fetching messages:", err));

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
            
            // Send notification for incoming messages (not from current user)
            if (m.sender.username !== currentUser) {
                triggerNotification(`New message from ${m.sender.username}`, m.messageText);
            }
        });
    } else {
        // For RemindBot, just show a welcome message
        showMessage(REMIND_BOT_NAME, "Hi! I can remind you about things. Try: 'remind me in 10 seconds to check the oven'", "other-message",
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
}

// --- Send Message ---
document.getElementById("sendBtn").addEventListener("click", function () {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (text && activeChatUser) {
        if (activeChatUser === REMIND_BOT_NAME) {
            handleRemindBotMessage(text);
        } else if (stompClient) {
            stompClient.send(`/app/chat/${activeChatUser}`, {}, JSON.stringify({
                sender: currentUser,
                content: text
            }));
        }
        input.value = "";
    }
});

// --- Show Message ---
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

// --- RemindBot Logic ---
function handleRemindBotMessage(msg) {
    console.log("=== RemindBot message received:", msg);
    const regex = /remind me in (\d+)\s*(seconds|minutes|hours)\s+(.+)/i;
    const match = msg.match(regex);
    console.log("Regex match:", match);
    
    if (match) {
        let [, amount, unit, text] = match;
        console.log(`Parsed: ${amount} ${unit} - "${text}"`);
        
        let multiplier = unit.startsWith("second") ? 1000 :
                         unit.startsWith("minute") ? 60000 :
                         unit.startsWith("hour") ? 3600000 : 0;
        const delay = parseInt(amount) * multiplier;
        console.log(`Delay calculated: ${delay}ms`);

        showMessage(REMIND_BOT_NAME, `Okay! I will remind you in ${amount} ${unit}.`, "other-message",
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        // Schedule reminder
        console.log(`Setting timeout for ${delay}ms`);
        setTimeout(() => {
            console.log("=== TIMEOUT TRIGGERED - Showing reminder ===");
            showMessage(REMIND_BOT_NAME, text, "other-message",
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            console.log("About to trigger notification for reminder");
            triggerNotification(REMIND_BOT_NAME, text);
        }, delay);
    } else {
        console.log("Message didn't match regex pattern");
        showMessage(REMIND_BOT_NAME, "Sorry, I didn't understand. Use: remind me in [time] [text]", "other-message",
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
}