// src/peersupport.js
// STEP 1: Floating Peer Support Button (UI only)
console.log("🔥 peersupport.js LOADED");

(function initPeerSupport() {
  // Prevent double init
  if (document.getElementById("peer-support-fab")) return;

  // ---------- FAB BUTTON ----------
  const fab = document.createElement("button");
  fab.id = "peer-support-fab";
  fab.innerHTML = "🧑‍🤝‍🧑";
  fab.title = "Peer Support";

  // ---------- DM PANEL (stub for now) ----------
  const panel = document.createElement("div");
  panel.id = "peer-support-panel";
  panel.innerHTML = `
    <div class="ps-header">
      <span>Peer Support</span>
      <button id="ps-close">✕</button>
    </div>
    <div class="ps-body">
      <p style="opacity:0.6; font-size:14px;">
        DM UI loading… (yes, this is intentional)
      </p>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  // ---------- TOGGLE LOGIC ----------
  const openPanel = () => {
    panel.classList.add("open");
    fab.classList.add("hidden");
  };

  const closePanel = () => {
    panel.classList.remove("open");
    fab.classList.remove("hidden");
  };

  fab.addEventListener("click", openPanel);
  panel.querySelector("#ps-close").addEventListener("click", closePanel);
})();
