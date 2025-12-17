// src/peersupport.js
// Frontend-only Peer Support DM (prototype)

import {
  loadLearnerState,
  saveLearnerState,
  awardAura
} from "./state/learnerState.js";

/* =====================================================
   BOOT
===================================================== */
(function () {
  console.log("🔥 Peer Support booting (clean)");

  const uiRoot =
    document.getElementById("ui-root") || document.body;

  /* =============================
     Floating Action Button
  ============================== */
  const fab = document.createElement("div");
  fab.id = "peer-support-fab";
  fab.innerHTML = "🤝";

  /* =============================
     DM Container
  ============================== */
  const dm = document.createElement("div");
  dm.id = "peer-support-dm";

  dm.innerHTML = `
    <div class="dm-header">
      <span>Peer Support</span>
      <button id="dm-close">✕</button>
    </div>

    <div class="dm-main">
      <!-- LEFT -->
      <div class="dm-contacts">
        <div class="dm-contact" data-user-id="arjun">
          <div class="name">Arjun</div>
          <div class="meta">Servo • Online</div>
        </div>

        <div class="dm-contact" data-user-id="neha">
          <div class="name">Neha</div>
          <div class="meta">ROS2 • Offline</div>
        </div>

        <div class="dm-contact" data-user-id="mentor">
          <div class="name">Mentor Bot</div>
          <div class="meta">AI Helper</div>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="dm-chat">
        <div class="dm-empty">
          Select a peer to start chatting
        </div>
      </div>
    </div>
  `;

  uiRoot.appendChild(fab);
  uiRoot.appendChild(dm);

  /* =============================
     Open / Close Behavior
  ============================== */
  fab.onclick = () => dm.classList.add("open");
  dm.querySelector("#dm-close").onclick = () =>
    dm.classList.remove("open");

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") dm.classList.remove("open");
  });

  document.addEventListener("click", e => {
    if (
      dm.classList.contains("open") &&
      !dm.contains(e.target) &&
      !fab.contains(e.target)
    ) {
      dm.classList.remove("open");
    }
  });

  /* =============================
     Contact → Load Chat
  ============================== */
  dm.querySelectorAll(".dm-contact").forEach(el => {
    el.addEventListener("click", () => {
      loadDMChat(el.dataset.userId);
    });
  });
})();

/* =====================================================
   CHAT RENDERER
===================================================== */
function loadDMChat(userId) {
  const profiles = {
    arjun: { name: "Arjun", status: "Online" },
    neha: { name: "Neha", status: "Offline" },
    mentor: { name: "Mentor Bot", status: "AI Helper" }
  };

  const profile = profiles[userId];
  if (!profile) return;

  const chat = document.querySelector(".dm-chat");

  chat.innerHTML = `
    <div class="dm-chat-header">
      <strong>${profile.name}</strong>
      <span class="status">${profile.status}</span>
    </div>

    <div class="dm-messages"></div>

    <div class="dm-input">
      <button class="btn-snapshot" title="Share Hardware Snapshot">📡</button>
      <button title="Request Peer Help">🆘</button>
      <input type="text" placeholder="Type a message…" />
      <button>Send</button>
    </div>
  `;

  chat
    .querySelector(".btn-snapshot")
    .addEventListener("click", openHardwareSnapshot);
}

/* =====================================================
   HARDWARE SNAPSHOT (FAKE BUT SEXY)
===================================================== */
function openHardwareSnapshot() {
  if (document.getElementById("hardware-snapshot")) return;

  const modal = document.createElement("div");
  modal.id = "hardware-snapshot";

  modal.innerHTML = `
    <div class="hs-backdrop"></div>

    <div class="hs-panel">
      <h3>📡 Hardware Snapshot</h3>

      <section><strong>Board</strong><div>Arduino Uno</div></section>
      <section><strong>Power</strong><div>External 5V • Common GND ✔</div></section>

      <section>
        <strong>Servo Angles</strong>
        <ul>
          <li>Base: 92°</li>
          <li>Shoulder: 45°</li>
          <li>Elbow: 130°</li>
        </ul>
      </section>

      <section class="hs-warning">
        ⚠ Servo jitter detected
      </section>

      <section>
        <strong>Code</strong>
        <pre>servo.write(180);</pre>
      </section>

      <div class="hs-actions">
        <button id="hs-cancel">Cancel</button>
        <button id="hs-attach">Attach Snapshot</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".hs-backdrop").onclick = closeHardwareSnapshot;
  modal.querySelector("#hs-cancel").onclick = closeHardwareSnapshot;

  modal.querySelector("#hs-attach").onclick = () => {
    attachSnapshotToChat();
    closeHardwareSnapshot();
  };
}

function closeHardwareSnapshot() {
  document.getElementById("hardware-snapshot")?.remove();
}

/* =====================================================
   SNAPSHOT → CHAT + PROGRESS
===================================================== */
function attachSnapshotToChat() {
  const messages = document.querySelector(".dm-messages");
  if (!messages) return;

  const learner = loadLearnerState();

  awardAura(learner, "SHARE_HARDWARE_SNAPSHOT");
  learner.xp += 10;
  learner.snapshotsShared =
    (learner.snapshotsShared || 0) + 1;

  saveLearnerState(learner);

  const msg = document.createElement("div");
  msg.className = "msg self snapshot";
  msg.innerHTML = `
    📡 <strong>Hardware Snapshot Shared</strong>
    <div class="snapshot-mini">
      Arduino Uno • 3 Servos • 1 Sensor<br/>
      ⚠ Servo jitter detected
    </div>
  `;

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}
