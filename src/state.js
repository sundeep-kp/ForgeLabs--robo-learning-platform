// src/state.js

const DEFAULT_STATE = {
  xp: 0,
  aura: 0,
  completedLessons: [],
  helpCount: 0,
  unlockedIndex: 0 
};

export function loadState() {
  const raw = localStorage.getItem("robotics-learner-state");
  if (!raw) return structuredClone(DEFAULT_STATE);

  try {
    return {
      ...structuredClone(DEFAULT_STATE),
      ...JSON.parse(raw)
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(state) {
  localStorage.setItem(
    "robotics-learner-state",
    JSON.stringify(state)
  );
}

export function updateState(mutator) {
  const state = loadState();
  mutator(state);
  saveState(state);
}

