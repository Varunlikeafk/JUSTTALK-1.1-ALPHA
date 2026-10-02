/* =========================================================================
   JUSTTALK 1.1 ALPHA — client
   Views: auth -> hub -> warp transition -> chat
   ========================================================================= */

const API_URL = "https://justtalk-1-1-alpha-1.onrender.com/chat";
const LS_ACCOUNTS = "jt_accounts";     // { username: password }  (local demo auth only)
const LS_SESSION  = "jt_session";      // { username, guest }
const LS_HISTORY  = "jt_chat_history"; // persisted chat history

// ---------------------------------------------------------------------
// Background: connected-node network (same as landing.html "netCanvas"),
// orange nodes, cursor-reactive. Paused while the chat view is open.
// ---------------------------------------------------------------------
const starCanvas = document.getElementById("starfield");
const starCtx = starCanvas.getContext("2d");
let netNodes = [];
const netMouse = { x: -9999, y: -9999 };

function initNet() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  const count = Math.min(110, Math.floor((starCanvas.width * starCanvas.height) / 18000));
  netNodes = [];
  for (let i = 0; i < count; i++) {
    netNodes.push({
      x: Math.random() * starCanvas.width,
      y: Math.random() * starCanvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25
    });
  }
}
function drawNet() {
  requestAnimationFrame(drawNet);
  const chatView = document.getElementById("view-chat");
  if (chatView && chatView.classList.contains("active")) return; // hidden behind chat, save CPU

  const w = starCanvas.width, h = starCanvas.height;
  starCtx.clearRect(0, 0, w, h);
  for (const n of netNodes) {
    n.x += n.vx; n.y += n.vy;
    if (n.x < 0 || n.x > w) n.vx *= -1;
    if (n.y < 0 || n.y > h) n.vy *= -1;
    const dx = n.x - netMouse.x, dy = n.y - netMouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 140 && dist > 0) { n.x += dx / dist * 0.6; n.y += dy / dist * 0.6; }
  }
  for (let i = 0; i < netNodes.length; i++) {
    for (let j = i + 1; j < netNodes.length; j++) {
      const a = netNodes[i], b = netNodes[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 120) {
        starCtx.strokeStyle = `rgba(255,255,255,${0.12 * (1 - d / 120)})`;
        starCtx.lineWidth = 1;
        starCtx.beginPath(); starCtx.moveTo(a.x, a.y); starCtx.lineTo(b.x, b.y); starCtx.stroke();
      }
    }
  }
  starCtx.fillStyle = "rgba(255,154,31,0.85)";
  for (const n of netNodes) {
    starCtx.beginPath(); starCtx.arc(n.x, n.y, 2, 0, Math.PI * 2); starCtx.fill();
  }
}
initNet();
drawNet();
window.addEventListener("resize", initNet);
window.addEventListener("mousemove", e => { netMouse.x = e.clientX; netMouse.y = e.clientY; });
window.addEventListener("mouseleave", () => { netMouse.x = -9999; netMouse.y = -9999; });

// ---------------------------------------------------------------------
// View router
// ---------------------------------------------------------------------
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ---------------------------------------------------------------------
// Splash view (app wordmark) -> auth
// ---------------------------------------------------------------------
const splashView = document.getElementById("view-splash");
function leaveSplash() {
  showView("view-auth");
}
splashView.addEventListener("click", leaveSplash);
window.addEventListener("keydown", (e) => {
  if (splashView.classList.contains("active") && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    leaveSplash();
  }
});

// ---------------------------------------------------------------------
// Session / mock auth
// NOTE: there is no auth backend — this app only has a /chat endpoint.
// Sign in / Sign up are a local, browser-only demo (credentials are
// stored in this browser's localStorage, not on any server).
// ---------------------------------------------------------------------
function getAccounts() {
  try { return JSON.parse(localStorage.getItem(LS_ACCOUNTS)) || {}; }
  catch { return {}; }
}
function saveAccounts(a) { localStorage.setItem(LS_ACCOUNTS, JSON.stringify(a)); }
function getSession() {
  try { return JSON.parse(localStorage.getItem(LS_SESSION)); }
  catch { return null; }
}
function setSession(s) { localStorage.setItem(LS_SESSION, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(LS_SESSION); }

let authMode = "signin"; // or "signup"

const tabSignIn = document.getElementById("tabSignIn");
const tabSignUp = document.getElementById("tabSignUp");
const authSubmit = document.getElementById("authSubmit");
const authError = document.getElementById("authError");
const authUser = document.getElementById("authUser");
const authPass = document.getElementById("authPass");

tabSignIn.addEventListener("click", () => {
  authMode = "signin";
  tabSignIn.classList.add("active");
  tabSignUp.classList.remove("active");
  authSubmit.textContent = "Sign in";
  authError.textContent = "";
});
tabSignUp.addEventListener("click", () => {
  authMode = "signup";
  tabSignUp.classList.add("active");
  tabSignIn.classList.remove("active");
  authSubmit.textContent = "Create account";
  authError.textContent = "";
});

authSubmit.addEventListener("click", () => {
  const u = authUser.value.trim();
  const p = authPass.value;
  authError.textContent = "";

  if (!u || !p) { authError.textContent = "Enter a username and password."; return; }

  const accounts = getAccounts();

  if (authMode === "signup") {
    if (accounts[u]) { authError.textContent = "That username is already taken."; return; }
    accounts[u] = p;
    saveAccounts(accounts);
    setSession({ username: u, guest: false });
    enterHub();
  } else {
    if (!accounts[u] || accounts[u] !== p) {
      authError.textContent = "Incorrect username or password.";
      return;
    }
    setSession({ username: u, guest: false });
    enterHub();
  }
});

document.getElementById("guestBtn").addEventListener("click", () => {
  setSession({ username: "Guest", guest: true });
  enterHub();
});

[authUser, authPass].forEach(el => {
  el.addEventListener("keydown", e => { if (e.key === "Enter") authSubmit.click(); });
});

// ---------------------------------------------------------------------
// Hub view
// ---------------------------------------------------------------------
function enterHub() {
  const s = getSession();
  document.getElementById("hubUserLabel").textContent = s ? s.username : "Guest";
  showView("view-hub");
}

document.getElementById("hubLogout").addEventListener("click", doLogout);
document.getElementById("logoutBtn").addEventListener("click", doLogout);

function doLogout() {
  clearSession();
  authUser.value = "";
  authPass.value = "";
  showView("view-auth");
}

document.getElementById("cardAlpha").addEventListener("click", () => runWarpThenChat());
// Regen Adaptive card is inert on purpose (coming soon).

// Cursor-follow spotlight highlight on the model cards.
document.querySelectorAll(".model-card").forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    card.style.setProperty("--my", `${e.clientY - rect.top}px`);
  });
});

// ---------------------------------------------------------------------
// Warp transition (canvas starfield "piercing" through space)
// ---------------------------------------------------------------------
const warpCanvas = document.getElementById("warp-canvas");
const warpCtx = warpCanvas.getContext("2d");
let warpStars = [];
let warpRAF = null;
let warpStartTime = 0;
const WARP_DURATION = 2600; // ms, matches the CSS flash/caption timing

function initWarp() {
  warpCanvas.width = window.innerWidth;
  warpCanvas.height = window.innerHeight;
  warpStars = [];
  for (let i = 0; i < 700; i++) {
    warpStars.push({
      x: (Math.random() - 0.5) * warpCanvas.width,
      y: (Math.random() - 0.5) * warpCanvas.height,
      z: Math.random() * warpCanvas.width,
      c: Math.floor(Math.random() * 3)
    });
  }
  warpCtx.fillStyle = "#07070a";
  warpCtx.fillRect(0, 0, warpCanvas.width, warpCanvas.height);
}

// Classic "jump to lightspeed" look: points near the centre barely move at
// first, then accelerate outward into long white streaks as speed ramps up,
// exactly like looking straight out the front window of a ship. No shapes,
// no icons — just stars stretching into lines.
function drawWarp(now) {
  if (!warpStartTime) warpStartTime = now;
  const elapsed = now - warpStartTime;
  const progress = Math.min(1, elapsed / WARP_DURATION);
  // ease-in acceleration curve: slow at first, screaming fast by the end
  const speed = 4 + Math.pow(progress, 2.4) * 90;

  const cx = warpCanvas.width / 2, cy = warpCanvas.height / 2;

  // Lower alpha trail = longer streak lines as speed increases
  const trailAlpha = 0.5 - progress * 0.35;
  warpCtx.fillStyle = `rgba(7,7,10,${Math.max(0.12, trailAlpha)})`;
  warpCtx.fillRect(0, 0, warpCanvas.width, warpCanvas.height);

  for (const s of warpStars) {
    const prevZ = s.z;
    s.z -= speed;
    if (s.z <= 1) {
      s.x = (Math.random() - 0.5) * warpCanvas.width;
      s.y = (Math.random() - 0.5) * warpCanvas.height;
      s.z = warpCanvas.width;
    }
    const k = 128 / s.z;
    const px = s.x * k + cx, py = s.y * k + cy;
    const pk = 128 / prevZ;
    const ppx = s.x * pk + cx, ppy = s.y * pk + cy;

    const depthFactor = 1 - s.z / warpCanvas.width;
    const size = Math.max(0.6, depthFactor * 2.4);
    const brightness = 0.5 + depthFactor * 0.5;
    const WARP_COLORS = ["255,255,255", "255,154,31", "255,47,110"];
    warpCtx.strokeStyle = `rgba(${WARP_COLORS[s.c || 0]},${brightness})`;
    warpCtx.lineWidth = size;
    warpCtx.beginPath();
    warpCtx.moveTo(ppx, ppy);
    warpCtx.lineTo(px, py);
    warpCtx.stroke();
  }
  warpRAF = requestAnimationFrame(drawWarp);
}

function runWarpThenChat() {
  initWarp();
  warpStartTime = 0;
  showView("view-warp");
  warpRAF = requestAnimationFrame(drawWarp);
  setTimeout(() => {
    cancelAnimationFrame(warpRAF);
    enterChat();
  }, WARP_DURATION);
}

// ---------------------------------------------------------------------
// Chat view bootstrap
// ---------------------------------------------------------------------
function enterChat() {
  const s = getSession() || { username: "Guest", guest: true };
  const initial = (s.username || "G").charAt(0).toUpperCase();
  document.getElementById("profileAvatar").textContent = initial;
  document.getElementById("profileName").textContent = s.username;
  showView("view-chat");
  loadHistoryIntoUI();
}

document.getElementById("backToHub").addEventListener("click", () => {
  closeSidebarMobile();
  enterHub();
});
document.getElementById("aboutBtn").addEventListener("click", () => {
  alert("JUSTTALK 1.1 ALPHA — Regen 1 Alpha runs GPT-OSS-20B via Groq with optional live web verification. System credits track answer reliability: verified or successful answers earn credits, and only genuine verification failures cost credits (going offline or turning search off never does).");
});
document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  if (confirm("Clear this conversation?")) {
    chatHistory = [];
    localStorage.removeItem(LS_HISTORY);
    document.getElementById("chat-flow").innerHTML = "";
  }
});

// ---------------------------------------------------------------------
// Sidebar (mobile drawer)
// ---------------------------------------------------------------------
const sidebarEl = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
function openSidebarMobile() { sidebarEl.classList.add("open"); sidebarOverlay.classList.add("show"); }
function closeSidebarMobile() { sidebarEl.classList.remove("open"); sidebarOverlay.classList.remove("show"); }
document.getElementById("menuToggle").addEventListener("click", openSidebarMobile);
sidebarOverlay.addEventListener("click", closeSidebarMobile);

// ---------------------------------------------------------------------
// Chat logic
// ---------------------------------------------------------------------
let chatHistory = [];
try {
  const saved = JSON.parse(localStorage.getItem(LS_HISTORY));
  if (Array.isArray(saved)) chatHistory = saved;
} catch { chatHistory = []; }

function persistHistory() {
  // Keep a generous local window so "New chat" / reload doesn't wipe context
  // unless the user explicitly asks for it.
  localStorage.setItem(LS_HISTORY, JSON.stringify(chatHistory.slice(-40)));
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Turns fenced ```code``` blocks into copy-able boxes and escapes the rest.
// This is the "copy paste box" feature: any code or long paragraph the
// model returns gets its own box with a Copy button.
function renderBotContent(raw) {
  const codeFence = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let html = "";
  let match;
  let boxCount = 0;

  while ((match = codeFence.exec(raw)) !== null) {
    const before = raw.slice(lastIndex, match.index);
    if (before.trim()) html += renderParagraphs(before);

    const lang = match[1] || "text";
    const code = match[2];
    boxCount++;
    const codeId = `code-${Date.now()}-${boxCount}`;
    html += `
      <div class="code-box">
        <div class="code-box-header">
          <span>${escapeHtml(lang)}</span>
          <button onclick="copyBoxText('${codeId}', this)">Copy</button>
        </div>
        <pre id="${codeId}">${escapeHtml(code.trim())}</pre>
      </div>`;
    lastIndex = codeFence.lastIndex;
  }
  const rest = raw.slice(lastIndex);
  if (rest.trim()) html += renderParagraphs(rest);
  return (html || renderParagraphs(raw)).replace(/>\s*\n\s*</g, '><').trim();
}

// Long plain-text paragraphs (>= 400 chars, no code fence) also get wrapped
// in a copyable box, per the "any copy paste stuff -> box" request.
function renderParagraphs(text) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length >= 400) {
    const codeId = `para-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    return `
      <div class="code-box">
        <div class="code-box-header">
          <span>Response text</span>
          <button onclick="copyBoxText('${codeId}', this)">Copy</button>
        </div>
        <pre id="${codeId}" style="white-space:pre-wrap;font-family:inherit;font-size:14.5px;">${escapeHtml(trimmed)}</pre>
      </div>`;
  }
  return `<span>${escapeHtml(trimmed).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</span>`;
}

function copyBoxText(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = old; }, 1200);
  });
}

function copyWholeMessage(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => {
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = old; }, 1200);
  });
}

function toggleThink(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const bar = el.closest(".think-bar");
  if (bar) bar.classList.toggle("open");
}


// Animated credit counter (count-up/down + bump), matches landing motion.
function setCredits(target) {
  const el = document.getElementById("creditDisplay");
  const from = parseInt(el.textContent, 10) || 0;
  const t0 = performance.now(), dur = 600;
  el.style.color = target < 700 ? "#f43f5e" : "#22c55e";
  const bar = document.getElementById("creditBar");
  if (bar) { bar.style.width = Math.max(4, Math.min(100, target / 10)) + "%"; bar.classList.toggle("neg", target < 700); }
  el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function toggleBtn() {
  const input = document.getElementById("userInput");
  const btn = document.getElementById("sendBtn");
  if (input.value.trim()) btn.classList.add("active"); else btn.classList.remove("active");
}

function loadHistoryIntoUI() {
  const chatFlow = document.getElementById("chat-flow");
  chatFlow.innerHTML = "";
  chatHistory.forEach(turn => {
    if (turn.role === "user") {
      chatFlow.innerHTML += `
        <div class="chat-row user-row">
          <div class="bubble-container"><div class="user-bubble">${escapeHtml(turn.content)}</div></div>
          <div class="avatar user-avatar">U</div>
        </div>`;
    } else {
      const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
      chatFlow.innerHTML += `
        <div class="chat-row bot-row">
          <div class="avatar bot-avatar">JT</div>
          <div class="bubble-container">
            <div class="bot-bubble" id="${msgId}">${renderBotContent(turn.content)}</div>
            <div class="meta-row"><button class="copy-msg-btn" onclick="copyWholeMessage('${msgId}', this)">Copy</button></div>
          </div>
        </div>`;
    }
  });
  chatFlow.scrollTop = chatFlow.scrollHeight;
}

async function send() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;
  if (window.__stream) window.__stream.finish();

  const chatFlow = document.getElementById("chat-flow");
  const creditDisplay = document.getElementById("creditDisplay");

  chatFlow.innerHTML += `
    <div class="chat-row user-row msg-enter">
      <div class="bubble-container"><div class="user-bubble">${escapeHtml(text)}</div></div>
      <div class="avatar user-avatar">U</div>
    </div>`;

  input.value = "";
  toggleBtn();
  chatFlow.scrollTop = chatFlow.scrollHeight;

  // BUG FIX: previously the array was trimmed to 8 entries right after
  // pushing the user turn (before the assistant reply existed), which could
  // silently drop the *other* half of an exchange and desync context sent
  // to the server. Now we push, persist and trim only in complete pairs.
  chatHistory.push({ role: "user", content: text });
  persistHistory();

  const thinkId = "think-" + Date.now();

  chatFlow.innerHTML += `
    <div class="chat-row bot-row msg-enter" id="loading-${thinkId}">
      <div class="avatar bot-avatar">JT</div>
      <div class="bubble-container">
        <div class="think-bar live open">
          <div class="think-header" onclick="toggleThink('${thinkId}')">
            <span>🧠 Thinking Process...</span><span class="arrow">▼</span>
          </div>
          ${routerChips(-1)}
          <div class="think-body"><div class="think-content routing" id="${thinkId}">routing…</div></div>
        </div>
      </div>
    </div>`;
  chatFlow.scrollTop = chatFlow.scrollHeight;

  try {
    const webSearchToggle = document.getElementById("webSearchToggle");
    const webSearchEnabled = webSearchToggle ? webSearchToggle.checked : true;

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send the full retained history (not just the last few pairs) so the
      // backend has real context to work with.
      body: JSON.stringify({ message: text, history: chatHistory, web_search_enabled: webSearchEnabled })
    });
    const data = await res.json();

    const prevCredits = parseInt(creditDisplay.textContent, 10) || 0;
    const delta = data.credits !== undefined ? data.credits - prevCredits : 0;
    const deltaPill = delta ? `<span class="delta ${delta > 0 ? "pos" : "neg"}">${delta > 0 ? "+" : ""}${delta}</span>` : "";

    const loadEl = document.getElementById(`loading-${thinkId}`);
    if (loadEl) loadEl.remove();

    chatHistory.push({ role: "assistant", content: data.reply });
    persistHistory();

    const msgId = `msg-${Date.now()}`;
    chatFlow.innerHTML += `
      <div class="chat-row bot-row msg-enter">
        <div class="avatar bot-avatar">JT</div>
        <div class="bubble-container">
          <div class="think-bar">
            <div class="think-header" onclick="toggleThink('${thinkId}')">
              <span>🧠 Inner Thought Process</span><span class="arrow">▼</span>
            </div>
            ${routerChips(detectRouter(data.thought))}
            <div class="think-body"><div class="think-content" id="${thinkId}">${escapeHtml(data.thought || "")}</div></div>
          </div>
          <div class="bot-bubble" id="${msgId}">${renderBotContent(data.reply || "")}</div>
          <div class="meta-row">
            <span class="meta-pill">⚡ ${data.response_time}s</span>${deltaPill}
            <button class="copy-msg-btn" onclick="copyWholeMessage('${msgId}', this)">Copy</button>
          </div>
        </div>
      </div>`;

    if (data.credits !== undefined) {
      setCredits(data.credits);
    }
    chatFlow.scrollTop = chatFlow.scrollHeight;
    streamBubble(msgId, data.thought || "");
  } catch (err) {
    const loadEl = document.getElementById(`loading-${thinkId}`);
    if (loadEl) loadEl.remove();
    chatFlow.innerHTML += `
      <div class="chat-row bot-row msg-enter">
        <div class="avatar bot-avatar">JT</div>
        <div class="bubble-container"><div class="bot-bubble" style="color:#f43f5e;">Server connection offline. Your message wasn't lost — it's still in this conversation's history once the server is back.</div></div>
      </div>`;
    // Roll back the optimistic push so a dropped request doesn't leave a
    // one-sided (user-only) turn baked into history forever.
    chatHistory.pop();
    persistHistory();
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
    newChatBtn.addEventListener("click", () => {
      chatHistory = [];
      localStorage.removeItem(LS_HISTORY);
      document.getElementById("chat-flow").innerHTML = "";
      closeSidebarMobile();
    });
  }

  // Resume session on reload instead of forcing sign-in again every time.
  const existing = getSession();
  if (existing) enterHub();
});


// ---------------------------------------------------------------------
// Landing-page UX: router chips, empty-state hero, suggestion chips
// ---------------------------------------------------------------------
const ROUTERS = ["Temporal", "Identity", "Generation", "Factual", "Fallback"];

// Same 5-router flow as landing.html. active = index that answered,
// earlier ones are "passed" (first match wins), -1 = still scanning.
function routerChips(active) {
  const steps = ROUTERS.map((n, i) => {
    const st = active < 0 ? "" : (i < active ? "passed" : (i === active ? "active" : "idle"));
    return `<div class="router-step ${st}" style="--i:${i}"><b>${i + 1}</b> ${n}</div>` +
           (i < ROUTERS.length - 1 ? '<span class="router-arrow">→</span>' : "");
  }).join("");
  return `<div class="router-flow${active < 0 ? " scanning" : ""}">${steps}</div>`;
}

function detectRouter(thought) {
  const t = (thought || "").split("\n\n--- Model reasoning ---")[0];
  if (/SYSTEM ROUTER/i.test(t)) return 0;
  if (/Identity query/i.test(t)) return 1;
  if (/GENERATION|Generation Error|CAREFUL MODE RECOVERY/.test(t)) return 2;
  if (/WEB VERIFIED/.test(t)) return 3;
  return 4;
}

document.addEventListener("DOMContentLoaded", () => {
  const flow = document.getElementById("chat-flow");
  const empty = document.getElementById("empty-state");
  const sync = () => empty.classList.toggle("hide", flow.childElementCount > 0);
  new MutationObserver(sync).observe(flow, { childList: true });
  sync();

  empty.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const input = document.getElementById("userInput");
      input.value = chip.dataset.q;
      toggleBtn();
      send();
    });
  });
});


/* =========================================================================
   STREAMING TEXT ANIMATION
   Words resolve out of blur one by one, a caret trails the text, then the
   action icons, source chip and follow-up prompts fade in and become usable.
   ========================================================================= */
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ACTION_ICONS = {
  copy:  '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  retry: '<path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/>',
  up:    '<path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z"/>',
  down:  '<path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z"/>'
};
const FOLLOW_UPS = ["Explain that more simply", "Give me an example"];

function svgIcon(name) {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ACTION_ICONS[name]}</svg>`;
}

function sourceDomain(thought) {
  const m = /Source:\s*(https?:\/\/[^\s.][^\s]*)/i.exec(thought || "");
  if (!m) return null;
  try { const u = new URL(m[1]); return { href: u.href, domain: u.hostname.replace(/^www\./, "") }; }
  catch (e) { return null; }
}

function buildExtras(bubble, thought) {
  const wrap = document.createElement("div");
  wrap.className = "stream-extras";
  const src = sourceDomain(thought);
  wrap.innerHTML = `
    <div class="stream-actions">
      ${["copy", "retry", "up", "down"].map(n => `<button type="button" class="act-btn" data-act="${n}" aria-label="${n}">${svgIcon(n)}</button>`).join("")}
      ${src ? `<a class="src-chip" href="${src.href}" target="_blank" rel="noreferrer"><span class="src-dot"></span>${escapeHtml(src.domain)}</a>` : ""}
    </div>
    <div class="stream-followups">
      <div class="fu-title">Follow-ups</div>
      ${FOLLOW_UPS.map((t, i) => `<button type="button" class="fu-btn" style="--i:${i}">↳ ${t}</button>`).join("")}
    </div>`;
  wrap.querySelector('[data-act="copy"]').onclick = () =>
    navigator.clipboard.writeText(bubble.innerText).catch(() => {});
  wrap.querySelector('[data-act="retry"]').onclick = () => {
    const last = [...chatHistory].reverse().find(t => t.role === "user");
    if (!last) return;
    document.getElementById("userInput").value = last.content;
    send();
  };
  ["up", "down"].forEach(n => {
    wrap.querySelector(`[data-act="${n}"]`).onclick = e => {
      const row = wrap.querySelector(".stream-actions");
      row.querySelectorAll('[data-act="up"],[data-act="down"]').forEach(b => b.classList.remove("on"));
      e.currentTarget.classList.add("on");
    };
  });
  wrap.querySelectorAll(".fu-btn").forEach(b => b.onclick = () => {
    document.getElementById("userInput").value = b.textContent.replace("↳ ", "");
    send();
  });
  return wrap;
}

function streamBubble(bubbleId, thought) {
  const bubble = document.getElementById(bubbleId);
  if (!bubble) return;
  const container = bubble.parentElement;
  const original = bubble.innerHTML;
  const extras = buildExtras(bubble, thought);
  const meta = container.querySelector(".meta-row");
  (meta || bubble).insertAdjacentElement("afterend", extras);

  const reveal = () => extras.classList.add("show");
  if (REDUCED_MOTION) { reveal(); return; }

  // wrap every word of the text (code blocks fade in as one block instead)
  const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const total = nodes.reduce((n, t) => n + (t.nodeValue.match(/\S+/g) || []).length, 0) || 1;
  const step = Math.min(70, 3200 / total);
  let idx = 0;
  nodes.forEach(node => {
    const inCode = node.parentElement.closest('pre[id^="code-"]');
    if (inCode) return;
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      const sp = document.createElement("span");
      sp.className = "sw";
      sp.style.animationDelay = (idx++ * step) + "ms";
      sp.textContent = part;
      frag.appendChild(sp);
    });
    node.replaceWith(frag);
  });
  bubble.querySelectorAll(".code-box").forEach(box => {
    if (box.querySelector('pre[id^="code-"]')) {
      box.classList.add("sw-block");
      box.style.animationDelay = (idx * step) + "ms";
      idx++;
    }
  });
  const caret = document.createElement("span");
  caret.className = "stream-caret";
  bubble.appendChild(caret);

  const flow = document.getElementById("chat-flow");
  const scroller = setInterval(() => { flow.scrollTop = flow.scrollHeight; }, 120);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(scroller);
    clearTimeout(timer);
    if (document.body.contains(bubble)) bubble.innerHTML = original; // clean DOM, no replay
    reveal();
    if (window.__stream && window.__stream.finish === finish) window.__stream = null;
  };
  const timer = setTimeout(finish, idx * step + 450);
  window.__stream = { finish };
}
