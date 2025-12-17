// src/state/learnerState.js

const STORAGE_KEY = "robotics-learner-state";

export function loadLearnerState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw
    ? JSON.parse(raw)
    : {
        lessons: {},
        aura: 0,
        contributions: 0
      };
}

export function saveLearnerState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


export function getLessonState(state, lessonId) {
  return state.lessons[lessonId] || {
    state: "AVAILABLE",
    actions: []
  };
}

export function updateLesson(state, lessonId, updater) {
  const lesson = getLessonState(state, lessonId);
  updater(lesson);
  state.lessons[lessonId] = lesson;
}

export const LESSON_STATES = {
  LOCKED: "LOCKED",
  AVAILABLE: "AVAILABLE",
  IN_PROGRESS: "IN_PROGRESS",
  MASTERED: "MASTERED"
};

export const AURA_ACTIONS = {
  COMPLETE_LESSON: 20,
  HELP_PEER: 15,
  SHARE_HARDWARE_SNAPSHOT: 10,
  PUBLISH_CODE: 30
};

export function awardAura(state, action) {
  const points = AURA_ACTIONS[action] || 0;
  state.aura += points;
  state.contributions += 1;
}

export function getAuraLevel(aura) {
  if (aura < 50) return "Novice";
  if (aura < 150) return "Builder";
  if (aura < 300) return "Debugger";
  if (aura < 600) return "Architect";
  return "Robotics Sage";
}
