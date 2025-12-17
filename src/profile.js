import { loadState } from "./state.js";

/* ---------------- MOCK DATA ---------------- */

const mockActivity = {
  "2025-01-01": 1,
  "2025-01-02": 3,
  "2025-01-03": 0,
  "2025-01-04": 5,
  "2025-01-05": 2,
  "2025-01-06": 7,
  "2025-01-07": 1,
};

/* ---------------- BOOTSTRAP ---------------- */

console.log("🧠 Profile UI booting");

// Profile button
const btn = document.createElement("button");
btn.id = "profile-btn";
btn.innerText = "🧠";

// Profile panel (starts hidden)
const panel = document.createElement("div");
panel.id = "profile-panel";
panel.classList.add("hidden");

document.body.appendChild(btn);
document.body.appendChild(panel);

/* ---------------- RENDER PROFILE ---------------- */

function renderProfile() {
  const state = loadState();

  panel.innerHTML = `
    <div class="profile-header">
      <h3>Your Profile</h3>
      <button id="profile-close">✕</button>
    </div>

    <div class="profile-stats">
      <div class="stat">
        <span>XP</span>
        <strong>${state.xp}</strong>
      </div>

      <div class="stat">
        <span>Aura</span>
        <strong>${state.aura}</strong>
      </div>

      <div class="stat">
        <span>Lessons Completed</span>
        <strong>${state.completedLessons.length}</strong>
      </div>

      <div class="stat">
        <span>Peers Helped</span>
        <strong>${state.helpCount}</strong>
      </div>
    </div>

    <div class="profile-activity">
      <strong>Your Activity</strong>
      <div id="heatmap" class="heatmap-grid"></div>
    </div>
  `;

  // render heatmap ONLY here
  renderHeatmap(document.getElementById("heatmap"));

  panel.querySelector("#profile-close").onclick = () => {
    panel.classList.add("hidden");
    panel.innerHTML = ""; // destroy heatmap + content
  };
}

/* ---------------- BUTTON TOGGLE ---------------- */

btn.onclick = () => {
  if (panel.classList.contains("hidden")) {
    renderProfile();
    panel.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
    panel.innerHTML = "";
  }
};

/* ---------------- HEATMAP ---------------- */

function renderHeatmap(container) {
  console.trace("🔥 Heatmap rendered");

  if (!(container instanceof HTMLElement)) return;

  container.innerHTML = "";

  const days = 28;
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);

    const count = mockActivity[key] || 0;

    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    cell.dataset.level = getHeatLevel(count);
    cell.title = `${key}: ${count} actions`;

    container.appendChild(cell);
  }
}

function getHeatLevel(count) {
  if (count === 0) return 0;
  if (count < 2) return 1;
  if (count < 4) return 2;
  if (count < 6) return 3;
  return 4;
}
