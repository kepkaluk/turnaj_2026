import { subscribeToData } from "./firebase.js";

const palette = [
  "#4f46e5", "#0f766e", "#dc2626", "#ca8a04", "#9333ea",
  "#2563eb", "#db2777", "#059669", "#ea580c", "#0891b2"
];

function teamColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

function ordinal(place) {
  const n = Number(place);
  if (!n) return "-";
  return `${n}.`;
}

function createResultCards(teams, resultMap) {
  const grid = document.createElement("div");
  grid.className = "discipline-results-grid";

  teams.forEach((team) => {
    const place = resultMap?.[team] || "";
    const color = teamColor(team);
    const card = document.createElement("div");
    card.className = "discipline-team-card";
    card.style.setProperty("--team-color", color);
    card.innerHTML = `
      <div class="discipline-team-head">
        <span class="discipline-place-pill ${place ? "" : "empty"}">${ordinal(place)}</span>
        <div>
          <div class="discipline-team-name">${team}</div>
          <div class="discipline-team-sub">${place ? `Umístění v disciplíně` : "Zatím bez zadaného výsledku"}</div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  return grid;
}

function renderDisciplinesPage(data) {
  const container = document.getElementById("disciplinesContent");
  const nav = document.getElementById("disciplineNav");
  const { teams, disciplines, disciplineResults } = data;

  if (disciplines.length === 0) {
    nav.innerHTML = "";
    container.innerHTML = "Zatím nejsou přidané žádné disciplíny. Přidej je v sekci Administrace.";
    return;
  }

  container.innerHTML = "";
  nav.innerHTML = "";

  disciplines.forEach((discipline) => {
    const safeId = "disc-" + discipline.replace(/[^a-zA-Z0-9_-]/g, "_");

    const navBtn = document.createElement("button");
    navBtn.textContent = discipline;
    navBtn.addEventListener("click", () => {
      const el = document.getElementById(safeId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    });
    nav.appendChild(navBtn);

    const card = document.createElement("div");
    card.className = "discipline-card";
    card.id = safeId;

    const title = document.createElement("div");
    title.className = "discipline-title";
    title.textContent = discipline;
    card.appendChild(title);

    card.appendChild(createResultCards(teams, disciplineResults[discipline] || {}));
    container.appendChild(card);
  });
}

subscribeToData(renderDisciplinesPage);