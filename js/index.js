import { subscribeToData } from "./firebase.js";

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("cs-CZ").format(date);
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

function createRankingTable(rows) {
  const table = document.createElement("table");
  table.className = "results-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th>Pořadí</th>
        <th>Tým</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="place-cell">${index + 1}.</td>
      <td class="team-name">${row.team}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
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

function renderHome(data) {
  const rankingContent = document.getElementById("rankingContent");
  const resultsContent = document.getElementById("resultsContent");
  const upcomingContent = document.getElementById("upcomingContent");

  const { teams, disciplines, disciplineSchedule, disciplineResults } = data;

  rankingContent.innerHTML = "";
  resultsContent.innerHTML = "";
  upcomingContent.innerHTML = "";

  if (teams.length === 0) {
    rankingContent.innerHTML = "Nejsou žádné týmy.";
    resultsContent.innerHTML = "Nejsou žádné týmy.";
  } else {
    const sorted = calculatePoints(teams, disciplineResults);

    rankingContent.appendChild(createRankingTable(sorted));
    resultsContent.appendChild(createPointsTable(sorted));
  }

  const upcoming = disciplines
    .map(d => ({
      name: d,
      ...(disciplineSchedule[d] || {})
    }))
    .filter(d => d.date)
    .sort((a, b) =>
      `${a.date}T${a.time || ""}`.localeCompare(`${b.date}T${b.time || ""}`)
    );

  if (upcoming.length === 0) {
    upcomingContent.innerHTML = "Žádné nadcházející disciplíny.";
    return;
  }

  const list = document.createElement("ul");
  list.className = "upcoming-list";

  upcoming.forEach(item => {
    const li = document.createElement("li");
    li.className = "upcoming-item";

    li.innerHTML = `
      <div class="upcoming-top">
        <div class="upcoming-left">
          <div class="upcoming-name">${item.name}</div>
          <div class="upcoming-meta">Místo: ${item.place || "neuvedeno"}</div>
        </div>
        <div class="upcoming-date">
          ${formatDate(item.date)}${item.time ? ` v ${item.time}` : ""}
        </div>
      </div>
    `;

    list.appendChild(li);
  });

  upcomingContent.appendChild(list);
}

subscribeToData(renderHome);