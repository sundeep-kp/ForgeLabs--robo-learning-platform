import { updateState } from "./state.js";
import { LESSON_ORDER } from "./lessons.js";

export function completeCurrentLesson() {
  const current =
    window.location.pathname.split("/").pop();

  updateState(state => {
    const index = LESSON_ORDER.indexOf(current);
    if (index === -1) return;

    if (!state.completedLessons.includes(current)) {
      state.completedLessons.push(current);
      state.xp += 25;
      state.aura += 1;
    }

    if (state.unlockedIndex < index + 1) {
      state.unlockedIndex = index + 1;
    }
  });
}
