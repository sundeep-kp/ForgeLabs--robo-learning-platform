// src/roadmap.js
import { roboticsRoadmaps } from "./content-data";

export function renderRoadmapNav() {
  const container = document.getElementById("roadmap-list");
  if (!container) return;

  container.innerHTML = "<h2>Roadmaps</h2>";

  // Iterate over roadmap OBJECT
  Object.entries(roboticsRoadmaps).forEach(([roadmapId, roadmap]) => {
    const roadmapBlock = document.createElement("div");
    roadmapBlock.className = "roadmap-block";

    roadmapBlock.innerHTML = `
      <h3 class="roadmap-title">${roadmap.title}</h3>
      <p class="roadmap-desc">${roadmap.description || ""}</p>
    `;

    roadmap.chapters.forEach(module => {
      const moduleBlock = document.createElement("div");
      moduleBlock.className = "chapter-block";

      moduleBlock.innerHTML = `<h4 class="chapter-title">${module.title}</h4>`;

      const ul = document.createElement("ul");

      module.subchapters.forEach(lesson => {
        const li = document.createElement("li");
        li.className = "subchapter-item";

        li.innerHTML = `
          <a href="#${lesson.id}" data-lesson="${lesson.id}">
            ${lesson.title}
          </a>
        `;

        ul.appendChild(li);
      });

      moduleBlock.appendChild(ul);
      roadmapBlock.appendChild(moduleBlock);
    });

    container.appendChild(roadmapBlock);
  });
}
