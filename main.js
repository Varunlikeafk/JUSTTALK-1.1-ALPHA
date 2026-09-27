let chatHistory = [];
function toggleThink(id) {
    const el = document.getElementById(id);
    if (el.style.display === "none" || el.style.display === "") {
        el.style.display = "block";
    } else {
        el.style.display = "none";
    }
}

function toggleBtn() {
    const input = document.getElementById("userInput");
    const btn = document.getElementById("sendBtn");
    if (input.value.trim()) { btn.classList.add("active"); } else { btn.classList.remove("active"); }
}

async function send() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text) return;

    const chatFlow = document.getElementById("chat-flow");
    const creditDisplay = document.getElementById("creditDisplay");

    chatFlow.innerHTML += `
        <div class="chat-row user-row">
            <div class="bubble-container">
                <div class="user-bubble">${text}</div>
            </div>
            <div class="avatar user-avatar">U</div>
        </div>`;

    input.value = "";
    toggleBtn();
    chatFlow.scrollTop = chatFlow.scrollHeight;

    chatHistory.push({ role: "user", content: text });
    if (chatHistory.length > 8) chatHistory.shift();

    const thinkId = 'think-' + Date.now();

    chatFlow.innerHTML += `
        <div class="chat-row bot-row" id="loading-${thinkId}">
            <div class="avatar bot-avatar">JT</div>
            <div class="bubble-container">
                <div class="think-bar">
                    <div class="think-header" onclick="toggleThink('${thinkId}')">
                        <span>🧠 Thinking Process...</span>
                        <span>▼</span>
                    </div>
                    <div class="think-content" id="${thinkId}">Analyzing query context and verifying live sources...</div>
                </div>
            </div>
        </div>`;
    chatFlow.scrollTop = chatFlow.scrollHeight;

    try {
        const webSearchToggle = document.getElementById("webSearchToggle");
        const webSearchEnabled = webSearchToggle ? webSearchToggle.checked : true;

        const res = await fetch("https://justtalk-1-1-alpha-1.onrender.com/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: text,
                history: chatHistory,
                web_search_enabled: webSearchEnabled
            })
        });
        const data = await res.json();

        const loadEl = document.getElementById(`loading-${thinkId}`);
        if (loadEl) loadEl.remove();

        chatHistory.push({ role: "assistant", content: data.reply });

        chatFlow.innerHTML += `
            <div class="chat-row bot-row">
                <div class="avatar bot-avatar">JT</div>
                <div class="bubble-container">
                    <div class="think-bar">
                        <div class="think-header" onclick="toggleThink('${thinkId}')">
                            <span>🧠 Inner Thought Process</span>
                            <span>▼</span>
                        </div>
                        <div class="think-content" id="${thinkId}">${data.thought}</div>
                    </div>
                    <div class="bot-bubble">${data.reply}</div>
                    <div class="meta-tag">⚡ ${data.response_time}s</div>
                </div>
            </div>`;

        if (data.credits !== undefined) {
            creditDisplay.innerText = data.credits;
            creditDisplay.style.color = data.credits < 700 ? "#f43f5e" : "#10a37f";
        }

        chatFlow.scrollTop = chatFlow.scrollHeight;

    } catch (err) {
        const loadEl = document.getElementById(`loading-${thinkId}`);
        if (loadEl) loadEl.remove();

        chatFlow.innerHTML += `
            <div class="chat-row bot-row">
                <div class="avatar bot-avatar">JT</div>
                <div class="bubble-container">
                    <div class="bot-bubble" style="color: #f43f5e;">Server Connection Offline.</div>
                </div>
            </div>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const newChatBtn = document.getElementById("newChatBtn");

    userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    });

    userInput.addEventListener("input", toggleBtn);

    sendBtn.addEventListener("click", send);

    if (newChatBtn) {
        newChatBtn.addEventListener("click", () => location.reload());
    }
});
