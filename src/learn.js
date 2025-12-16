// ===============================
// learn.js — AI wired, structure preserved
// ===============================

// 1. Import roadmaps + CSS
import { roboticsRoadmaps } from './content-data';
import './style.css';

// ===============================
// STATIC KNOWLEDGE BASE (FALLBACK)
// ===============================
const staticKnowledgeBase = {
  "servo-motor": {
    "jitter": "Servo jittering is commonly caused by unstable power or noisy PWM signals.",
    "not moving": "Check GND, power, and confirm the PWM pin matches your code.",
    "overheat": "Overheating happens if the servo stalls or is powered incorrectly.",
    "default": "Ask me about servo jitter, wiring problems, PWM, or overheating."
  },
  "ultrasonic-sensor": {
    "no reading": "No readings normally mean the echo signal isn't returning — check wiring.",
    "range": "Most HC-SR04 sensors work best between 4cm–200cm.",
    "wiring": "Ensure Trig → digital output and Echo → digital input.",
    "default": "Ask about wiring, echo issues, or range limitations."
  },
  "dynamixel": {
    "torque": "Torque mode increases grip but can overheat under block load.",
    "position": "Position mode uses internal PID. Great for robotic arms.",
    "velocity": "Velocity mode is used for wheels or continuous movement.",
    "id": "Each Dynamixel must have a unique ID. Conflicts cause failures.",
    "overheat": "High load or poor ventilation can trigger overheat shutdown.",
    "default": "Ask about torque mode, ID setup, U2D2 issues, or overheating."
  },
  "ros2": {
    "node": "Nodes are ROS2 processes that compute and exchange data.",
    "topic": "Topics are channels for communication via publish/subscribe.",
    "parameter": "Parameters configure node behavior at runtime.",
    "rviz": "RViz is used to visualize robot state, transforms, and sensor streams.",
    "urdf": "URDF defines robot geometry. Incorrect links or joints break simulation.",
    "default": "Ask about nodes, topics, parameters, RViz, or URDF issues."
  },
  "default": {
    "default": "Welcome! Ask me debugging questions related to this lesson."
  }
};

// ===============================
// CHATBOT (AI FIRST, BoW FALLBACK)
// ===============================
let chatHistory = [];

function displayMessage(sender, text) {
  const box = document.getElementById('chat-messages');
  if (!box) return;

  const div = document.createElement('div');
  div.className = sender === "AI" ? "msg-ai" : "msg-user";
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

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

  } catch (err) {
    // fallback to BoW
    handleBoWQuery(text, contextId);
  }
}

function handleBoWQuery(query, contextId) {
  query = query.toLowerCase();
  const kb = staticKnowledgeBase[contextId] || staticKnowledgeBase.default;

  let response = kb.default;
  for (const key in kb) {
    if (key !== "default" && query.includes(key)) {
      response = kb[key];
      break;
    }
  }

  displayMessage("AI", response);

  chatHistory.push({ sender: "You", text: query });
  chatHistory.push({ sender: "AI", text: response });
}

function initChatbot(contextId) {
  chatHistory = [];

  const input = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send');
  if (!input || !btn) return;

  displayMessage("AI", "AI Debugging Assistant ready.");

  const send = () => {
    const text = input.value.trim();
    if (!text) return;

    displayMessage("You", text);
    handleAIQuery(text, contextId);
    input.value = '';
  };

  btn.onclick = send;
  input.onkeypress = e => {
    if (e.key === "Enter") send();
  };
}

// ===============================
// RIGHT SIDEBAR (UNCHANGED)
// ===============================
function renderRightSidebar(data) {
  const rightSidebar = document.getElementById('right-sidebar');
  if (!rightSidebar) return;

  let chatContext = "default";
  if (data.id.includes("servo")) chatContext = "servo-motor";
  else if (data.id.includes("sensor") || data.id.includes("ultrasonic")) chatContext = "ultrasonic-sensor";
  else if (data.id.includes("dxl") || data.id.includes("dynamixel")) chatContext = "dynamixel";
  else if (data.id.includes("ros2") || data.id.includes("rviz") || data.id.includes("urdf"))
    chatContext = "ros2";

  rightSidebar.innerHTML = `
    <h3>Component Control</h3>
    <section id="ai-assistant-container">
      <h4>💬 AI Debugging Assistant</h4>
      <div id="chat-messages" class="chat-box"></div>
      <div class="chat-controls">
        <input id="chat-input" placeholder="Ask about ${chatContext}..." />
        <button id="chat-send">Send</button>
      </div>
    </section>
  `;

  initChatbot(chatContext);
}
// ===============================
// CHATBOT IMPLEMENTATION
// ===============================
function displayMessage(sender, text) {
  const box = document.getElementById('chat-messages');
  if (!box) return;

  const div = document.createElement('div');
  div.className = sender === "AI" ? "msg-ai" : "msg-user";
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function handleBoWQuery(query, contextId) {
  query = query.toLowerCase();
  const kb = staticKnowledgeBase[contextId] || staticKnowledgeBase["default"];

  let response = kb.default;

  for (const key in kb) {
    if (key !== "default" && query.includes(key)) {
      response = kb[key];
      break;
    }
  }

  setTimeout(() => displayMessage("AI", response), 200);
}

function initChatbot(contextId) {
  const input = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send');

  if (!input || !btn) return;

  displayMessage("AI", staticKnowledgeBase[contextId]?.default);

  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    displayMessage("You", text);
    handleBoWQuery(text, contextId);
    input.value = '';
  };

  btn.onclick = send;
  input.onkeypress = (e) => {
    if (e.key === "Enter") send();
  };
}

// ===============================
// INITIALIZATION & HASH CHECK
// ===============================
function checkHashForContent() {
  const id = window.location.hash.replace('#', '');
  if (!id) return;

  const lesson = findLessonById(id);
  if (!lesson) return;

  // If locked, show a friendly message instead of loading
  if (!canAccessLesson(id)) {
    renderRoadmapNav();
    renderRightSidebar(lesson);
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="locked-lesson">
          <h2>Lesson Locked 🔒</h2>
          <p>This lesson is locked. Complete the previous lesson to unlock it.</p>
        </div>
      `;
    }
    return;
  }

  loadContent(lesson.contentFile, lesson);
}

document.addEventListener("DOMContentLoaded", () => {
  renderRoadmapNav();
  checkHashForContent();
});
