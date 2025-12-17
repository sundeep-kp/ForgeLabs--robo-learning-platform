import { roboticsRoadmaps } from "./content-data";

export const LESSON_ORDER = [];

for (const roadmap of Object.values(roboticsRoadmaps)) {
  for (const chapter of roadmap.chapters) {
    for (const lesson of chapter.subchapters) {
      LESSON_ORDER.push(lesson.id);
    }
  }
}
