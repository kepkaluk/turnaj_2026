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

function createStandingsCards(rows) {
  const grid = document.createElement("div");
  grid.className = "standings-grid";

  rows.forEach((rowData, index) => {
    const color = teamColor(rowData.team);
    const card = document.createElement("div");
    card.className = `team-card ${index < 3 ? `top-${index + 1}` : ""}`;
    card.style.setProperty("--team-color", color);
    card.innerHTML = `
      <div class="team-card-header">
        <div class="team-name-badge">
          <span class="team-dot"></span>
          <div class="team-name-text">${rowData.team}</div>
        </div>
        <span class="team-rank">${index + 1}</span>
      </div>
      <div class="team-points-box">
        <div class="team-points">${rowData.points}</div>
        <div class="team-points-label">bodů</div>
      </div>
      <div class="team-meta">${index === 0 ? "Průběžný lídr turnaje" : "Průběžné pořadí turnaje"}</div>
    `;
    grid.appendChild(card);
  });

  return grid;
}

function createUpcomingCards(items) {
  const grid = document.createElement("div");
  grid.className = "upcoming-grid";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "upcoming-item";
    card.innerHTML = `
      <div class="upcoming-top">
        <span class="upcoming-name">${item.name}</span>
        <span class="upcoming-date">${formatDate(item.date)}${item.time ? ` v ${item.time}` : ""}</span>
      </div>
      <div class="upcoming-meta">${item.place ? `Místo: ${item.place}` : "Místo zatím není vyplněné."}</div>
    `;
    grid.appendChild(card);
  });

  return grid;
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
    resultsContent.appendChild(createStandingsCards(calculatePoints(teams, disciplineResults)));
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

  upcomingContent.appendChild(createUpcomingCards(upcoming));
}

subscribeToData(renderHome);