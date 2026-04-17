import { subscribeToData } from "./firebase.js";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("cs-CZ").format(new Date(dateString));
}

function calculatePoints(teams, results) {
  const totals = {};
  teams.forEach(t => totals[t] = 0);

  Object.values(results || {}).forEach(map => {
    if (!map) return;
    Object.entries(map).forEach(([team, place]) => {
      const n = Number(place);
      if (n === 1) totals[team] += 2;
      else if (n === 2) totals[team] += 1;
    });
  });

  return teams
    .map(t => ({ team: t, points: totals[t] }))
    .sort((a, b) => b.points - a.points || a.team.localeCompare(b.team, "cs"));
}

function createRankingTable(rows) {
  const table = document.createElement("table");
  table.className = "results-table";

  table.innerHTML = `<thead><tr><th>Pořadí</th><th>Tým</th></tr></thead>`;
  const tbody = document.createElement("tbody");

  rows.forEach((r, i) => {
    const tr = document.createElement("tr");

    if (i === 0) tr.className = "rank-gold";
    else if (i === 1) tr.className = "rank-silver";
    else if (i === 2) tr.className = "rank-bronze";

    tr.innerHTML = `<td class="place-cell">${i + 1}.</td><td class="team-name">${r.team}</td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

function getCompletedDisciplinesCount(disciplineResults) {
  return Object.values(disciplineResults || {}).filter(resultMap => {
    if (!resultMap) return false;
    return Object.keys(resultMap).length > 0;
  }).length;
}

function createProgressBar(completed, total) {
  const wrapper = document.createElement("div");
  wrapper.className = "progress-wrapper";

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  wrapper.innerHTML = `
    <div class="progress-text">${percent} %</div>
    <div class="progress-bar-box">
      <div class="progress-bar-fill" style="width: ${percent}%;"></div>
    </div>
    <div class="progress-subtext">Hotovo ${completed} z ${total} disciplín</div>
  `;

  return wrapper;
}

function createDisciplineStatusTable(disciplines, disciplineResults) {
  const wrapper = document.createElement("div");
  wrapper.className = "discipline-status-wrapper";

  const title = document.createElement("div");
  title.className = "discipline-status-title";
  title.textContent = "Přehled disciplín";
  wrapper.appendChild(title);

  const table = document.createElement("table");
  table.className = "results-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th>Disciplína</th>
        <th>Stav</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");

  disciplines.forEach((discipline) => {
    const resultMap = disciplineResults?.[discipline];
    const finished = resultMap && Object.keys(resultMap).length > 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="team-name">${discipline}</td>
      <td class="place-cell ${finished ? "status-done" : "status-planned"}">
        ${finished ? "Již proběhla" : "Ještě neproběhla"}
      </td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);

  return wrapper;
}

function renderHome(data) {
  const ranking = document.getElementById("rankingContent");
  const upcoming = document.getElementById("upcomingContent");
  const loser = document.getElementById("loserInfo");
  const progressSection = document.getElementById("progressSection");
  const disciplineStatusSection = document.getElementById("disciplineStatusSection");

  ranking.innerHTML = "";
  upcoming.innerHTML = "";
  loser.innerHTML = "";
  progressSection.innerHTML = "";
  disciplineStatusSection.innerHTML = "";

  const sorted = calculatePoints(data.teams || [], data.disciplineResults || {});

  if (sorted.length) {
    ranking.appendChild(createRankingTable(sorted));
    loser.textContent = `Aktuálně platí večeři: ${sorted[sorted.length - 1].team}`;
  } else {
    ranking.innerHTML = "Nejsou žádné týmy.";
  }

  const list = document.createElement("ul");
  list.className = "upcoming-list";

  Object.entries(data.disciplineSchedule || {}).forEach(([name, s]) => {
    if (!s.date) return;

    const li = document.createElement("li");
    li.className = "upcoming-item";

    li.innerHTML = `
      <div class="upcoming-top">
        <div class="upcoming-left">
          <div class="upcoming-name">${name}</div>
          <div class="upcoming-meta">Místo: ${s.place || "-"}</div>
        </div>
        <div class="upcoming-date">
          ${formatDate(s.date)} ${s.time || ""}
        </div>
      </div>
    `;

    list.appendChild(li);
  });

  if (list.children.length === 0) {
    upcoming.innerHTML = "Žádné nadcházející disciplíny.";
  } else {
    upcoming.appendChild(list);
  }

  const completedCount = getCompletedDisciplinesCount(data.disciplineResults || {});
  const totalCount = (data.disciplines || []).length;
  progressSection.appendChild(createProgressBar(completedCount, totalCount));

  if ((data.disciplines || []).length > 0) {
    disciplineStatusSection.appendChild(
      createDisciplineStatusTable(data.disciplines || [], data.disciplineResults || {})
    );
  }
}

subscribeToData(renderHome);