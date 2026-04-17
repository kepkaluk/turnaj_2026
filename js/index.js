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
    if (!resultMap || typeof resultMap !== "object") return;
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

function createTable(rows) {
  const table = document.createElement("table");
  table.className = "results-table";
  table.innerHTML = "<thead><tr><th>Tým</th><th>Body</th></tr></thead>";
  const tbody = document.createElement("tbody");

  rows.forEach((rowData) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="team-name">${rowData.team}</td><td class="points-cell">${rowData.points}</td>`;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
}

function renderHome(data) {
  const resultsContent = document.getElementById("resultsContent");
  const upcomingContent = document.getElementById("upcomingContent");
  const { teams, disciplines, disciplineSchedule, disciplineResults } = data;

  resultsContent.innerHTML = "";
  upcomingContent.innerHTML = "";

  if (teams.length === 0) {
    resultsContent.innerHTML = `
      <div class="empty-message">Nejprve přidej týmy v sekci <strong>Administrace</strong>.</div>
      <div class="hint">Jakmile je vyplníš, zobrazí se tady přehled bodů.</div>
    `;
  } else {
    resultsContent.appendChild(createTable(calculatePoints(teams, disciplineResults)));
  }

  const upcoming = disciplines
    .map((discipline) => {
      const schedule = disciplineSchedule[discipline] || {};
      return {
        name: discipline,
        date: schedule.date || "",
        time: schedule.time || "",
        place: schedule.place || ""
      };
    })
    .filter(item => item.date)
    .sort((a, b) =>
      `${a.date}T${a.time || "23:59"}`.localeCompare(`${b.date}T${b.time || "23:59"}`)
    );

  if (upcoming.length === 0) {
    upcomingContent.innerHTML = `
      <div class="empty-message">Zatím nejsou zadané žádné termíny disciplín.</div>
      <div class="hint">Přidej termíny v sekci <strong>Administrace</strong>.</div>
    `;
    return;
  }

  const list = document.createElement("ul");
  list.className = "upcoming-list";

  upcoming.forEach((item) => {
    const li = document.createElement("li");
    li.className = "upcoming-item";
    li.innerHTML = `
      <div class="upcoming-top">
        <span class="upcoming-name">${item.name}</span>
        <span class="upcoming-date">${formatDate(item.date)}${item.time ? ` v ${item.time}` : ""}</span>
      </div>
      <div class="upcoming-meta">${item.place ? `Místo: ${item.place}` : "Místo zatím není vyplněné."}</div>
    `;
    list.appendChild(li);
  });

  upcomingContent.appendChild(list);
}

subscribeToData(renderHome);