// ===============================
// learn.js — reconstructed, stable
// ===============================

// Imports
 
import { roboticsRoadmaps } from "./content-data";
import "./style.css";
import {
  renderRoadmapNav
} from "./roadmap.js";

// ===============================
// STATIC KNOWLEDGE BASE (BoW FALLBACK)
// ===============================
const staticKnowledgeBase = {
  "servo-motor": {
    jitter: "Servo jittering is commonly caused by unstable power or noisy PWM signals.",
    "not moving": "Check GND, power, and confirm the PWM pin matches your code.",
    overheat: "Overheating happens if the servo stalls or is powered incorrectly.",
    default: "Ask me about servo jitter, wiring problems, PWM, or overheating."
  },
  "ultrasonic-sensor": {
    "no reading": "No readings normally mean the echo signal isn't returning — check wiring.",
    range: "Most HC-SR04 sensors work best between 4cm–200cm.",
    wiring: "Ensure Trig → digital output and Echo → digital input.",
    default: "Ask about wiring, echo issues, or range limitations."
  },
  dynamixel: {
    torque: "Torque mode increases grip but can overheat under block load.",
    position: "Position mode uses internal PID. Great for robotic arms.",
    velocity: "Velocity mode is used for wheels or continuous movement.",
    id: "Each Dynamixel must have a unique ID. Conflicts cause failures.",
    overheat: "High load or poor ventilation can trigger overheat shutdown.",
    default: "Ask about torque mode, ID setup, U2D2 issues, or overheating."
  },
  ros2: {
    node: "Nodes are ROS2 processes that compute and exchange data.",
    topic: "Topics are channels for communication via publish/subscribe.",
    parameter: "Parameters configure node behavior at runtime.",
    rviz: "RViz is used to visualize robot state, transforms, and sensor streams.",
    urdf: "URDF defines robot geometry. Incorrect links or joints break simulation.",
    default: "Ask about nodes, topics, parameters, RViz, or URDF issues."
  },
  default: {
    default: "Welcome! Ask me debugging questions related to this lesson."
  }
};

// ===============================
// CHATBOT STATE
// ===============================
let chatHistory = [];

// ===============================
// CHAT UI HELPERS
// ===============================
function displayMessage(sender, text) {
  const box = document.getElementById("chat-messages");
  if (!box) return;

  const msg = document.createElement("div");
  msg.className = sender === "AI" ? "msg-ai" : "msg-user";
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

// ===============================
// AI CHAT (PRIMARY)
// ===============================
async function handleAIQuery(text, contextId) {
  try {
    const res = await fetch("/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        lessonId: contextId,
        history: chatHistory
      })
    });

    if (!res.ok) throw new Error("AI backend error");

    const data = await res.json();
    const reply = data.reply || "No response from AI.";

    displayMessage("AI", reply);

    chatHistory.push({ sender: "You", text });
    chatHistory.push({ sender: "AI", text: reply });

  } catch {
    handleBoWQuery(text, contextId);
  }
}

// ===============================
// BoW FALLBACK (SECONDARY)
// ===============================
function handleBoWQuery(query, contextId) {
  const q = query.toLowerCase();
  const kb = staticKnowledgeBase[contextId] || staticKnowledgeBase.default;

  let response = kb.default;
  for (const key in kb) {
    if (key !== "default" && q.includes(key)) {
      response = kb[key];
      break;
    }
  }

  displayMessage("AI", response);

  chatHistory.push({ sender: "You", text: query });
  chatHistory.push({ sender: "AI", text: response });
}

// ===============================
// CHAT INITIALIZER (ISOLATED)
// ===============================
function initChatbot(contextId) {
  chatHistory = [];

  const input = document.getElementById("chat-input");
  const btn = document.getElementById("chat-send");
  if (!input || !btn) return;

  displayMessage("AI", "AI Debugging Assistant ready.");

  const send = () => {
    const text = input.value.trim();
    if (!text) return;

    displayMessage("You", text);
    handleAIQuery(text, contextId);
    input.value = "";
  };

  btn.onclick = send;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  });
}

// ===============================
// RIGHT SIDEBAR (CHAT ONLY)
// ===============================
function renderRightSidebar(lesson) {
  const rightSidebar = document.getElementById("right-sidebar");
  if (!rightSidebar || !lesson) return;

  let html = `<h3>Component Control</h3>`;

  // 1. Resources
  if (lesson.resources?.length) {
    html += `
      <section class="lesson-resources">
        <h4>🔗 Useful Resources</h4>
        <ul>
          ${lesson.resources
            .map(
              r =>
                `<li><a href="${r.url}" target="_blank" rel="noopener">${r.name}</a></li>`
            )
            .join("")}
        </ul>
      </section>
    `;
  }

  // 2. Debugging tips
  if (lesson.debugging?.length) {
    html += `
      <section class="lesson-debugging">
        <h4>🛠 Debugging Tips</h4>
        <ul>
          ${lesson.debugging.map(t => `<li>${t}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  // 3. Failure modes
  if (lesson.failure?.length) {
    html += `
      <section class="lesson-failure">
        <h4>⚠️ Common Failure Modes</h4>
        <ul>
          ${lesson.failure.map(f => `<li>${f}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  // 4. Playground link
  if (lesson.playground) {
    html += `
      <section class="lesson-playground">
        <h4>▶ Playground</h4>
        <a href="${lesson.playground}" target="_blank" rel="noopener">
          Open Interactive Playground
        </a>
      </section>
    `;
  }

  // 5. AI Assistant (always last)
  html += `
    <section id="ai-assistant-container">
      <h4>💬 AI Debugging Assistant</h4>
      <div id="chat-messages" class="chat-box"></div>
      <div class="chat-controls">
        <input
          id="chat-input"
          type="text"
          placeholder="Ask about ${lesson.id}..."
        />
        <button id="chat-send">Send</button>
      </div>
    </section>
  `;

  rightSidebar.innerHTML = html;

  // Infer chat context
  let chatContext = "default";
  if (lesson.id.includes("servo")) chatContext = "servo-motor";
  else if (lesson.id.includes("sensor") || lesson.id.includes("ultrasonic"))
    chatContext = "ultrasonic-sensor";
  else if (lesson.id.includes("dxl") || lesson.id.includes("dynamixel"))
    chatContext = "dynamixel";
  else if (
    lesson.id.includes("ros2") ||
    lesson.id.includes("rviz") ||
    lesson.id.includes("urdf")
  )
    chatContext = "ros2";

  initChatbot(chatContext);
}


function findLessonById(id) {
  for (const roadmap of Object.values(roboticsRoadmaps)) {
    for (const chapter of roadmap.chapters) {
      for (const lesson of chapter.subchapters) {
        if (lesson.id === id) {
          return lesson;
        }
      }
    }
  }
  return null;
}

async function loadContent(file, lesson) {
  try {
    const res = await fetch(`/content/${file}`);
    if (!res.ok) throw new Error("Content fetch failed");

    const html = await res.text();
    document.getElementById("content-area").innerHTML = html;

    renderRightSidebar(lesson);
  } catch (err) {
    console.error(err);
    document.getElementById("content-area").innerHTML =
      "<p>Failed to load lesson content.</p>";
  }
}


// ===============================
// HASH-BASED CONTENT LOADING
// ===============================
function checkHashForContent() {
  const id = window.location.hash.replace('#', '');
  if (!id) return;

  const lesson = findLessonById(id);
  if (!lesson) return;

  loadContent(lesson.contentFile, lesson);
}

// ===============================
// BOOTSTRAP
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  renderRoadmapNav();
  checkHashForContent();
});

window.addEventListener("hashchange", () => {
  checkHashForContent();
});
