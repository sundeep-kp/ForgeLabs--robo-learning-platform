// ===============================
//  learn.js — FULL UPDATED VERSION (with locking & progress)
// ===============================

// 1. Import roadmaps + CSS
import { roboticsRoadmaps } from './content-data';
import './style.css';

// ===============================
// STATIC KNOWLEDGE BASE — EXTENDED
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
    "range": "Most HC‑SR04 sensors work best between 4cm–200cm.",
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
// PROGRESS UTILITIES (localStorage)
// ===============================
const STORAGE_KEY = 'forgelabs_completed_lessons';

function readCompletedLessons() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveCompletedLessons(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function markLessonComplete(id) {
  const list = new Set(readCompletedLessons());
  list.add(id);
  saveCompletedLessons([...list]);
  // re-render navigation to show unlocked lessons
  renderRoadmapNav();
  // also update right sidebar message
  showRightSidebarNotice('Lesson marked complete. Next lesson unlocked.');
}

function isLessonComplete(id) {
  return readCompletedLessons().includes(id);
}

// ===============================
// LESSON FLATTENING / HELPERS
// ===============================
function getAllLessons() {
  const all = [];
  for (const key in roboticsRoadmaps) {
    roboticsRoadmaps[key].chapters.forEach(chapter => {
      chapter.subchapters.forEach(lesson => all.push(lesson));
    });
  }
  return all;
}

function findLessonById(id) {
  return getAllLessons().find(l => l.id === id) || null;
}

function findAdjacentLessons(currentId) {
  const allLessons = getAllLessons();
  const currentIndex = allLessons.findIndex(l => l.id === currentId);
  return {
    prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
    next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
  };
}

// Determines if a lesson can be accessed (prev must be completed or absent)
function canAccessLesson(lessonId) {
  const adjacent = findAdjacentLessons(lessonId);
  if (!adjacent.prev) return true; // first lesson in course
  return isLessonComplete(adjacent.prev.id);
}

// Small UI helper to show notices in the right sidebar
function showRightSidebarNotice(text) {
  const rightSidebar = document.getElementById('right-sidebar');
  if (!rightSidebar) return;
  let notice = rightSidebar.querySelector('.notice');
  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'notice';
    notice.style.padding = '8px';
    notice.style.marginTop = '8px';
    notice.style.backgroundColor = '#fff8e1';
    notice.style.border = '1px solid #f0e0a0';
    notice.style.borderRadius = '6px';
    rightSidebar.prepend(notice);
  }
  notice.textContent = text;
  setTimeout(() => {
    if (notice && notice.parentNode) notice.parentNode.removeChild(notice);
  }, 6000);
}

// ===============================
// RENDER LEFT NAVIGATION (EDClub style, with locks)
// ===============================
function renderRoadmapNav() {
  const navList = document.getElementById('roadmap-list');
  if (!navList) return;

  navList.innerHTML = '';

  for (const key in roboticsRoadmaps) {
    const roadmap = roboticsRoadmaps[key];

    const roadmapHeader = document.createElement('li');
    roadmapHeader.className = 'roadmap-title';
    roadmapHeader.innerHTML = `<h3>${roadmap.title}</h3>`;
    navList.appendChild(roadmapHeader);

    const chapterList = document.createElement('ul');
    chapterList.className = 'chapter-list';

    roadmap.chapters.forEach(chapter => {
      const chapterHeader = document.createElement('li');
      chapterHeader.className = 'chapter-title';
      chapterHeader.innerHTML = `<h4>${chapter.title}</h4>`;
      chapterList.appendChild(chapterHeader);

      chapter.subchapters.forEach(sub => {
        const item = document.createElement('li');
        item.className = 'subchapter-item';

        const link = document.createElement('a');
        link.href = `#${sub.id}`;
        link.textContent = sub.title;

        // Determine if the lesson is locked
        const locked = !canAccessLesson(sub.id);

        if (locked) {
          link.classList.add('locked');
          link.setAttribute('aria-disabled', 'true');
          // show lock icon
          link.innerHTML = `🔒 ${sub.title}`;
          link.addEventListener('click', (e) => {
            e.preventDefault();
            // Inform the user why it's locked
            const prev = findAdjacentLessons(sub.id).prev;
            const prevText = prev ? `${prev.title}` : 'previous lesson';
            showRightSidebarNotice(`Locked — complete "${prevText}" to unlock this lesson.`);
          });
        } else {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = sub.id;
            loadContent(sub.contentFile, sub);

            document.querySelectorAll('.subchapter-item a')
              .forEach(a => a.classList.remove('active'));
            link.classList.add('active');
          });
        }

        // Visual marker if completed
        if (isLessonComplete(sub.id)) {
          const doneBadge = document.createElement('span');
          doneBadge.className = 'done-badge';
          doneBadge.textContent = '✓';
          doneBadge.style.marginLeft = '8px';
          item.appendChild(doneBadge);
        }

        item.appendChild(link);
        chapterList.appendChild(item);
      });
    });

    navList.appendChild(chapterList);
  }
}

// ===============================
// LOAD CONTENT FILE + SIDEBAR
// ===============================
async function loadContent(filename, lessonData) {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;

  // Block load if locked
  if (!canAccessLesson(lessonData.id)) {
    // render sidebar so user sees hint
    renderRightSidebar(lessonData);
    contentArea.innerHTML = `
      <div class="locked-lesson">
        <h2>Lesson Locked 🔒</h2>
        <p>This lesson is locked. Complete the previous lesson to unlock it.</p>
        <p><em>Tip:</em> Use the right sidebar for hints on what to complete next.</p>
      </div>
    `;
    return;
  }

  renderRightSidebar(lessonData);

  contentArea.innerHTML = '<div class="loading">Loading content...</div>';

  try {
    const response = await fetch(`/content/${filename}`);
    if (!response.ok) throw new Error("Content not found");

    const html = await response.text();
    // Replace content
    contentArea.innerHTML = html;

    // Inject Mark Complete UI
    injectCompletionControls(contentArea, lessonData);

    // Navigation buttons injection
    const navContainer = document.createElement('div');
    navContainer.className = 'lesson-nav';
    navContainer.style.display = 'flex';
    navContainer.style.justifyContent = 'space-between';
    navContainer.style.marginTop = '18px';
    contentArea.appendChild(navContainer);

    const adjacent = findAdjacentLessons(lessonData.id);

    if (adjacent.prev) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'nav-button prev';
      prevBtn.innerHTML = `← ${adjacent.prev.title}`;
      prevBtn.onclick = () => {
        window.location.hash = adjacent.prev.id;
        loadContent(adjacent.prev.contentFile, adjacent.prev);
      };
      navContainer.appendChild(prevBtn);
    }

    if (adjacent.next) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'nav-button next';
      // If the next is locked show it but greyed
      if (!canAccessLesson(adjacent.next.id)) {
        nextBtn.disabled = true;
        nextBtn.title = 'Complete current lesson to unlock next';
      }
      nextBtn.innerHTML = `${adjacent.next.title} →`;
      nextBtn.onclick = () => {
        if (!canAccessLesson(adjacent.next.id)) {
          showRightSidebarNotice('Complete this lesson to unlock the next one.');
          return;
        }
        window.location.hash = adjacent.next.id;
        loadContent(adjacent.next.contentFile, adjacent.next);
      };
      navContainer.appendChild(nextBtn);
    }

  } catch (err) {
    contentArea.innerHTML = `<h2>Error</h2><p>${err.message}</p>`;
  }
}

// Injects "Mark lesson complete" and "Show progress" UI into the lesson content area
function injectCompletionControls(contentArea, lessonData) {
  // Avoid duplicates
  if (contentArea.querySelector('.lesson-complete-controls')) return;

  const controls = document.createElement('div');
  controls.className = 'lesson-complete-controls';
  controls.style.marginTop = '12px';
  controls.style.display = 'flex';
  controls.style.gap = '8px';
  controls.style.alignItems = 'center';

  const completeBtn = document.createElement('button');
  completeBtn.className = 'complete-btn';
  completeBtn.textContent = isLessonComplete(lessonData.id) ? 'Completed ✓' : 'Mark lesson complete';
  completeBtn.disabled = isLessonComplete(lessonData.id);
  completeBtn.onclick = () => {
    markLessonComplete(lessonData.id);
    completeBtn.textContent = 'Completed ✓';
    completeBtn.disabled = true;
  };

  const progress = document.createElement('div');
  progress.className = 'lesson-progress';
  progress.style.fontSize = '0.9em';
  const total = getAllLessons().length;
  const done = readCompletedLessons().length;
  progress.textContent = `Progress: ${done}/${total} lessons completed`;

  controls.appendChild(completeBtn);
  controls.appendChild(progress);

  // Append to the end of content area
  contentArea.appendChild(controls);
}

// ===============================
// RIGHT SIDEBAR + CHATBOT
// ===============================
function renderRightSidebar(data) {
  const rightSidebar = document.getElementById('right-sidebar');
  if (!rightSidebar) return;

  let chatContext = "default";

  // Automatic context detection
  if (data.id.includes("servo")) chatContext = "servo-motor";
  else if (data.id.includes("sensor") || data.id.includes("ultrasonic")) chatContext = "ultrasonic-sensor";
  else if (data.id.includes("dxl") || data.id.includes("dynamixel")) chatContext = "dynamixel";
  else if (data.id.includes("ros2") || data.id.includes("rviz") || data.id.includes("urdf"))
    chatContext = "ros2";

  const componentInfoHTML = `
    <h3>Component Control</h3>
    ${data.debugging ? `<section class="debug-tips"><h4>🔧 DEBUGGING</h4><ul>${data.debugging.map(i => `<li>${i}</li>`).join('')}</ul></section>` : ''}
    ${data.failure ? `<section class="failure-modes-sidebar"><h4>⚠️ FAILURE MODES</h4><ul>${data.failure.map(i => `<li>${i}</li>`).join('')}</ul></section>` : ''}
    ${data.playground ? `<p><a href="${data.playground}" class="playground-sidebar-link">🔗 Open Playground</a></p>` : ''}
  `;

  const chatbotHTML = `
    <section id="ai-assistant-container">
      <h4>💬 AI Debugging Assistant</h4>
      <div id="chat-messages" class="chat-box"></div>
      <div class="chat-controls">
        <input id="chat-input" placeholder="Ask about ${chatContext}..." />
        <button id="chat-send">Send</button>
      </div>
    </section>
  `;

  rightSidebar.innerHTML = componentInfoHTML + chatbotHTML;

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
