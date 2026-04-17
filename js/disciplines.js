import { subscribeToData } from "./firebase.js";

function ordinal(place) {
  const n = Number(place);
  if (!n) return "-";
  return `${n}.`;
}

function createResultTable(teams, resultMap) {
  const table = document.createElement("table");
  table.className = "results-table";
  table.innerHTML = "<thead><tr><th>Tým</th><th>Umístění</th></tr></thead>";

  const tbody = document.createElement("tbody");

  teams.forEach((team) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="team-name">${team}</td>
      <td class="place-cell">${ordinal(resultMap?.[team] || "")}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
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
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    });
    nav.appendChild(navBtn);

    const card = document.createElement("div");
    card.className = "discipline-card";
    card.id = safeId;

    const title = document.createElement("div");
    title.className = "discipline-title";
    title.textContent = discipline;
    card.appendChild(title);

    card.appendChild(createResultTable(teams, disciplineResults[discipline] || {}));
    container.appendChild(card);
  });
}

subscribeToData(renderDisciplinesPage);