// ======== Fake Peer Support System ========

const cannedReplies = [
  "I had the same issue! Try checking your ground wire.",
  "Make sure you powered the servo externally — that fixed it for me!",
  "This happened to me yesterday 😭 — turned out to be a loose jumper cable.",
  "Try running a minimal test sketch to isolate the bug.",
  "If nothing works, restart your microcontroller. It solves 80% of problems lol.",
];

function peerSendMessage(sender, text) {
  const box = document.getElementById("peer-support-messages");
  if (!box) return;

  const msg = document.createElement("div");
  msg.className = sender === "peer" ? "peer-msg" : "user-msg";
  msg.textContent = text;
  box.appendChild(msg);

  box.scrollTop = box.scrollHeight;
}

function initPeerSupport() {
  const input = document.getElementById("peer-support-input");
  const sendBtn = document.getElementById("peer-support-send");

  if (!input || !sendBtn) return;

  sendBtn.onclick = () => sendMessage();
  input.onkeypress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    peerSendMessage("you", text);
    input.value = "";

    // Fake peer reply after 1s
    setTimeout(() => {
      const reply = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
      peerSendMessage("peer", reply);
    }, 1000);
  }
}

document.addEventListener("DOMContentLoaded", initPeerSupport);
