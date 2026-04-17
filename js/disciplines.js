import { subscribeToData } from "./firebase.js";

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

  return teams.map(t => ({ team: t, points: totals[t] }))
    .sort((a,b)=>b.points-a.points);
}

function createPointsTable(rows){
  const table = document.createElement("table");
  table.className="results-table";

  table.innerHTML=`<thead><tr><th>Tým</th><th>Body</th></tr></thead>`;
  const tb=document.createElement("tbody");

  rows.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.team}</td><td>${r.points}</td>`;
    tb.appendChild(tr);
  });

  table.appendChild(tb);
  return table;
}

function createResultTable(teams, map){
  const table=document.createElement("table");
  table.className="results-table";

  table.innerHTML=`<thead><tr><th>Tým</th><th>Umístění</th></tr></thead>`;
  const tb=document.createElement("tbody");

  teams.forEach(t=>{
    const place=Number(map?.[t]);
    const tr=document.createElement("tr");

    if(place===1) tr.className="discipline-gold";
    else if(place===2) tr.className="discipline-silver";
    else if(place===3) tr.className="discipline-bronze";

    tr.innerHTML=`<td>${t}</td><td>${place?place+".":"-"}</td>`;
    tb.appendChild(tr);
  });

  table.appendChild(tb);
  return table;
}

function render(data){
  const pointsDiv=document.getElementById("pointsContent");
  const cont=document.getElementById("disciplinesContent");

  pointsDiv.innerHTML="";
  cont.innerHTML="";

  const sorted=calculatePoints(data.teams,data.disciplineResults);
  pointsDiv.appendChild(createPointsTable(sorted));

  data.disciplines.forEach((d,i)=>{
    const wrap=document.createElement("div");
    wrap.className="discipline-card";

    const content=document.createElement("div");
    content.className="hidden";

    const btn=document.createElement("button");
    btn.className="discipline-toggle";
    btn.innerHTML=`▾ <span class="discipline-title">${d}</span>`;

    btn.onclick=()=>{
      content.classList.toggle("hidden");
    };

    content.appendChild(createResultTable(data.teams,data.disciplineResults[d]||{}));

    wrap.appendChild(btn);
    wrap.appendChild(content);
    cont.appendChild(wrap);
  });
}

subscribeToData(render);