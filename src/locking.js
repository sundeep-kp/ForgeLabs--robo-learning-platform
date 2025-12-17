import { loadState } from "./state.js";
import { LESSON_ORDER } from "./lesson-order.js";

export function isLessonUnlocked(lessonId) {
  const state = loadState();
  const idx = LESSON_ORDER.indexOf(lessonId);

  if (idx === -1) return false;
  return idx <= state.unlockedIndex;
}
