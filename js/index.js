import { subscribeToData } from "./firebase.js";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("cs-CZ").format(new Date(dateString));
}

function calculatePoints(teams, results) {
  const totals = {};
  teams.forEach(t => totals[t] = 0);

  Object.values(results).forEach(map => {
    if (!map) return;
    Object.entries(map).forEach(([team, place]) => {
      const n = Number(place);
      if (n === 1) totals[team] += 2;
      else if (n === 2) totals[team] += 1;
    });
  });

  return teams
    .map(t => ({ team: t, points: totals[t] }))
    .sort((a,b)=>b.points-a.points);
}

function createRankingTable(rows) {
  const table = document.createElement("table");
  table.className = "results-table";

  table.innerHTML = `<thead><tr><th>Pořadí</th><th>Tým</th></tr></thead>`;
  const tbody = document.createElement("tbody");

  rows.forEach((r,i)=>{
    const tr = document.createElement("tr");

    if(i===0) tr.className="rank-gold";
    else if(i===1) tr.className="rank-silver";
    else if(i===2) tr.className="rank-bronze";

    tr.innerHTML = `<td>${i+1}.</td><td>${r.team}</td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

function renderHome(data){
  const ranking = document.getElementById("rankingContent");
  const upcoming = document.getElementById("upcomingContent");
  const loser = document.getElementById("loserInfo");

  ranking.innerHTML="";
  upcoming.innerHTML="";
  loser.innerHTML="";

  const sorted = calculatePoints(data.teams, data.disciplineResults);

  ranking.appendChild(createRankingTable(sorted));

  if(sorted.length){
    loser.textContent = `Aktuálně platí večeři: ${sorted[sorted.length-1].team}`;
  }

  const list = document.createElement("ul");
  list.className="upcoming-list";

  Object.entries(data.disciplineSchedule || {}).forEach(([name,s])=>{
    if(!s.date) return;

    const li = document.createElement("li");
    li.className="upcoming-item";

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

  upcoming.appendChild(list);
}

subscribeToData(renderHome);