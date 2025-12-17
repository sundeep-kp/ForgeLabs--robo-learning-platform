// ===============================
// learn.js — quiz-enabled, stable
// ===============================

// Imports
import { roboticsRoadmaps } from "./content-data";
import "./style.css";
import { renderRoadmapNav } from "./roadmap.js";
import { isLessonUnlocked } from "./locking.js";
import { updateState } from "./state.js";
import { QUIZ_DATA } from "./quiz-data.js";
import { LESSON_ORDER } from "./lesson-order.js";

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
// AI CHAT
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
// BoW FALLBACK
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
// CHAT INITIALIZER
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
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  });
}

// ===============================
// QUIZ HELPERS
// ===============================
function lessonHasQuiz(id) {
  return Boolean(QUIZ_DATA[id]);
}

function renderQuiz(lessonId) {
  const quiz = QUIZ_DATA[lessonId];
  const container = document.getElementById("quiz-container");
  if (!quiz || !container) return;

  container.innerHTML = quiz.questions.map((q, qi) => `
    <div class="quiz-question">
      <p>${q.question}</p>
      ${q.options.map(
        (opt, oi) => `
          <label>
            <input type="radio" name="q${qi}" value="${oi}">
            ${opt}
          </label>
        `
      ).join("")}
    </div>
  `).join("");
}

function submitQuiz(lessonId) {
  const quiz = QUIZ_DATA[lessonId];
  if (!quiz) return;

  let score = 0;

  quiz.questions.forEach((q, qi) => {
    const selected = document.querySelector(`input[name="q${qi}"]:checked`);
    if (selected && Number(selected.value) === q.correctIndex) {
      score++;
    }
  });

  if (score < quiz.passScore) {
    alert(`Quiz failed (${score}/${quiz.questions.length}). Try again.`);
    return;
  }

  markLessonComplete(lessonId);
  renderRoadmapNav();
  checkHashForContent();

  alert("Quiz passed. Next lesson unlocked.");
}

// ===============================
// RIGHT SIDEBAR
// ===============================
function renderRightSidebar(lesson) {
  const rightSidebar = document.getElementById("right-sidebar");
  if (!rightSidebar || !lesson) return;

  let html = `<h3 class="sidebar-title">Component Control</h3>`;

  if (lesson.resources?.length) {
    html += `
      <section class="sidebar-card resources">
        <h4>🔗 Useful Resources</h4>
        <ul>
          ${lesson.resources.map(r => `
            <li><a href="${r.url}" target="_blank">${r.name}</a></li>
          `).join("")}
        </ul>
      </section>
    `;
  }

  if (lesson.debugging?.length) {
    html += `
      <section class="sidebar-card debugging">
        <h4>🛠 Debugging Tips</h4>
        <ul>${lesson.debugging.map(t => `<li>${t}</li>`).join("")}</ul>
      </section>
    `;
  }

  if (lesson.failure?.length) {
    html += `
      <section class="sidebar-card failure">
        <h4>⚠️ Common Failure Modes</h4>
        <ul>${lesson.failure.map(f => `<li>${f}</li>`).join("")}</ul>
      </section>
    `;
  }

  if (lesson.playground) {
    html += `
      <section class="sidebar-card playground">
        <h4>▶ Playground</h4>
        <a href="${lesson.playground}" target="_blank" class="playground-btn">
          Open Interactive Playground
        </a>
      </section>
    `;
  }

  if (lessonHasQuiz(lesson.id)) {
    html += `
      <section class="sidebar-card quiz">
        <h4>📝 Checkpoint Quiz</h4>
        <div id="quiz-container"></div>
        <button id="submit-quiz-btn">Submit Quiz</button>
      </section>
    `;
  } else {
    html += `
      <section class="sidebar-card progress">
        <button id="complete-lesson-btn">✅ Mark Lesson Complete</button>
      </section>
    `;
  }

  html += `
    <section class="sidebar-card ai">
      <h4>💬 AI Debugging Assistant</h4>
      <div id="chat-messages" class="chat-box"></div>
      <div class="chat-controls">
        <input id="chat-input" placeholder="Ask about ${lesson.id}..." />
        <button id="chat-send">Send</button>
      </div>
    </section>
  `;

  rightSidebar.innerHTML = html;

  initChatbot(
    lesson.id.includes("servo") ? "servo-motor" :
    lesson.id.includes("sensor") ? "ultrasonic-sensor" :
    lesson.id.includes("dxl") ? "dynamixel" :
    lesson.id.includes("ros") ? "ros2" :
    "default"
  );

  if (lessonHasQuiz(lesson.id)) {
    renderQuiz(lesson.id);
    document.getElementById("submit-quiz-btn").onclick =
      () => submitQuiz(lesson.id);
  } else {
    document.getElementById("complete-lesson-btn").onclick = () => {
      markLessonComplete(lesson.id);
      renderRoadmapNav();
      checkHashForContent();
    };
  }
}

// ===============================
// CORE HELPERS
// ===============================
function markLessonComplete(lessonId) {
  updateState(state => {
    const idx = LESSON_ORDER.indexOf(lessonId);
    if (idx === -1) return;

    if (!state.completedLessons.includes(lessonId)) {
      state.completedLessons.push(lessonId);
      state.xp += 25;
      state.aura += 1;
    }

    state.unlockedIndex = Math.max(state.unlockedIndex, idx + 1);
  });
}

function findLessonById(id) {
  for (const roadmap of Object.values(roboticsRoadmaps)) {
    for (const chapter of roadmap.chapters) {
      for (const lesson of chapter.subchapters) {
        if (lesson.id === id) return lesson;
      }
    }
  }
  return null;
}

async function loadContent(file, lesson) {
  const res = await fetch(`/content/${file}`);
  const html = await res.text();
  document.getElementById("content-area").innerHTML = html;
  renderRightSidebar(lesson);
}

// ===============================
// HASH ROUTING
// ===============================
function checkHashForContent() {
  const id = window.location.hash.replace("#", "");
  if (!id) return;

  const lesson = findLessonById(id);
  if (!lesson) return;

  if (!isLessonUnlocked(lesson.id)) {
    document.getElementById("content-area").innerHTML =
      "<p style='opacity:.6'>🔒 This lesson is locked.</p>";
    return;
  }

  loadContent(lesson.contentFile, lesson);
}

// ===============================
// BOOT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  renderRoadmapNav();
  checkHashForContent();
});

window.addEventListener("hashchange", checkHashForContent);
