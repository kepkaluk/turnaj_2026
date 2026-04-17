import { subscribeToData } from "./firebase.js";

function ordinal(place) {
  const n = Number(place);
  if (!n) return "-";
  return `${n}.`;
}

function calculatePoints(teams, disciplineResults) {
  const totals = {};
  teams.forEach(team => totals[team] = 0);

  Object.values(disciplineResults).forEach(resultMap => {
    if (!resultMap) return;

    Object.entries(resultMap).forEach(([team, place]) => {
      const n = Number(place);
      if (!(team in totals)) return;

      if (n === 1) totals[team] += 2;
      else if (n === 2) totals[team] += 1;
    });
  });

  return teams
    .map(team => ({ team, points: totals[team] }))
    .sort((a, b) => b.points - a.points || a.team.localeCompare(b.team, "cs"));
}

function createPointsTable(rows) {
  const table = document.createElement("table");
  table.className = "results-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th>Tým</th>
        <th>Body</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");

  rows.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="team-name">${row.team}</td>
      <td class="points-cell">${row.points}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

function createResultTable(teams, resultMap) {
  const table = document.createElement("table");
  table.className = "results-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th>Tým</th>
        <th>Umístění</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");

  teams.forEach((team) => {
    const place = Number(resultMap?.[team]);
    const row = document.createElement("tr");

    // 🔥 zvýraznění podle pořadí
    if (place === 1) row.className = "discipline-gold";
    else if (place === 2) row.className = "discipline-silver";
    else if (place === 3) row.className = "discipline-bronze";

    row.innerHTML = `
      <td class="team-name">${team}</td>
      <td class="place-cell">${place ? place + "." : "-"}</td>
    `;

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
}

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

function createDisciplineAccordion(teams, discipline, resultMap, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "discipline-card";

  const contentId = `discipline-content-${index}`;

  wrapper.innerHTML = `
    <button class="discipline-toggle" type="button" aria-expanded="false" aria-controls="${contentId}">
      <span class="discipline-toggle-arrow">▾</span>
      <span class="discipline-title">${discipline}</span>
    </button>
    <div class="discipline-hidden-content hidden" id="${contentId}"></div>
  `;

  const toggle = wrapper.querySelector(".discipline-toggle");
  const arrow = wrapper.querySelector(".discipline-toggle-arrow");
  const content = wrapper.querySelector(".discipline-hidden-content");

  content.appendChild(createResultTable(teams, resultMap));

  toggle.addEventListener("click", () => {
    const isHidden = content.classList.contains("hidden");

    if (isHidden) {
      content.classList.remove("hidden");
      toggle.setAttribute("aria-expanded", "true");
      arrow.classList.add("open");
    } else {
      content.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
      arrow.classList.remove("open");
    }
  });

  return wrapper;
}

function renderDisciplinesPage(data) {
  const pointsContent = document.getElementById("pointsContent");
  const container = document.getElementById("disciplinesContent");

  const { teams, disciplines, disciplineResults } = data;

  pointsContent.innerHTML = "";
  container.innerHTML = "";

  if (teams.length === 0) {
    pointsContent.innerHTML = "Zatím nejsou přidané žádné týmy.";
  } else {
    const sorted = calculatePoints(teams, disciplineResults);
    pointsContent.appendChild(createPointsTable(sorted));
  }

  if (disciplines.length === 0) {
    container.innerHTML = "Zatím nejsou přidané žádné disciplíny.";
    return;
  }

  disciplines.forEach((discipline, index) => {
    const accordion = createDisciplineAccordion(
      teams,
      discipline,
      disciplineResults[discipline] || {},
      index
    );
    container.appendChild(accordion);
  });
}

subscribeToData(renderDisciplinesPage);