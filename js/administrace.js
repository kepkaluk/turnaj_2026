import {
  loadData,
  saveData,
  login,
  logout,
  watchAuth,
  subscribeToData
} from "./firebase.js";

let currentData = {
  teams: [],
  disciplines: [],
  disciplineSchedule: {},
  disciplineResults: {}
};

let editingDiscipline = null;

const loginBox = document.getElementById("loginBox");
const adminContent = document.getElementById("adminContent");
const loginMessage = document.getElementById("loginMessage");

function showMessage(elementId, text, success = false) {
  const el = document.getElementById(elementId);
  el.textContent = text;
  if (success) {
    el.classList.add("success-message");
  } else {
    el.classList.remove("success-message");
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("cs-CZ").format(date);
}

function escapeId(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getAvailableDisciplines() {
  return currentData.disciplines.filter((discipline) => !currentData.disciplineSchedule[discipline]);
}

function renderTeams() {
  const list = document.getElementById("teamList");
  list.innerHTML = "";

  currentData.teams.forEach((team) => {
    const li = document.createElement("li");

    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.className = "danger-button";

    btn.addEventListener("click", async () => {
      const data = await loadData();
      const removed = team;

      data.teams = data.teams.filter(t => t !== removed);

      Object.keys(data.disciplineResults).forEach((discipline) => {
        if (data.disciplineResults[discipline] && removed in data.disciplineResults[discipline]) {
          delete data.disciplineResults[discipline][removed];
        }
      });

      await saveData(data);
    });

    li.append(team, btn);
    list.appendChild(li);
  });
}

function renderDisciplines() {
  const list = document.getElementById("disciplineList");
  list.innerHTML = "";

  currentData.disciplines.forEach((discipline) => {
    const li = document.createElement("li");

    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.className = "danger-button";

    btn.addEventListener("click", async () => {
      const data = await loadData();
      data.disciplines = data.disciplines.filter(d => d !== discipline);
      delete data.disciplineSchedule[discipline];
      delete data.disciplineResults[discipline];
      await saveData(data);
    });

    li.append(discipline, btn);
    list.appendChild(li);
  });
}

function renderDisciplineOptions() {
  const select = document.getElementById("disciplineSelect");
  const available = getAvailableDisciplines();
  select.innerHTML = "";

  if (currentData.disciplines.length === 0) {
    select.innerHTML = `<option value="">Nejdřív přidej disciplíny</option>`;
    select.disabled = true;
    return;
  }

  if (available.length === 0) {
    select.innerHTML = `<option value="">Všechny disciplíny už mají termín</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;

  available.forEach((discipline) => {
    const option = document.createElement("option");
    option.value = discipline;
    option.textContent = discipline;
    select.appendChild(option);
  });
}

function renderResultDisciplineOptions() {
  const select = document.getElementById("resultDisciplineSelect");
  const current = select.value;
  select.innerHTML = "";

  if (currentData.disciplines.length === 0) {
    select.innerHTML = `<option value="">Nejdřív přidej disciplíny</option>`;
    select.disabled = true;
    renderResultsForm();
    return;
  }

  select.disabled = false;

  currentData.disciplines.forEach((discipline) => {
    const option = document.createElement("option");
    option.value = discipline;
    option.textContent = discipline;
    select.appendChild(option);
  });

  if (currentData.disciplines.includes(current)) {
    select.value = current;
  }

  renderResultsForm();
}

function clearAddForm() {
  document.getElementById("disciplineDate").value = "";
  document.getElementById("disciplineTime").value = "";
  document.getElementById("disciplinePlace").value = "";
}

async function saveDisciplineSchedule() {
  const discipline = document.getElementById("disciplineSelect").value;
  const date = document.getElementById("disciplineDate").value;
  const time = document.getElementById("disciplineTime").value;
  const place = document.getElementById("disciplinePlace").value.trim();

  if (!discipline) {
    showMessage("message", "Nejdřív vyber disciplínu.");
    return;
  }

  if (!date) {
    showMessage("message", "Vyplň datum konání.");
    return;
  }

  const data = await loadData();
  data.disciplineSchedule[discipline] = { date, time, place };
  await saveData(data);

  clearAddForm();
  showMessage("message", "Termín byl uložen.", true);
}

function startEditDiscipline(discipline) {
  editingDiscipline = discipline;
  renderSavedDates();
}

function cancelEditDiscipline() {
  editingDiscipline = null;
  renderSavedDates();
}

async function updateDisciplineSchedule(discipline) {
  const date = document.getElementById(`edit-date-${escapeId(discipline)}`).value;
  const time = document.getElementById(`edit-time-${escapeId(discipline)}`).value;
  const place = document.getElementById(`edit-place-${escapeId(discipline)}`).value.trim();

  if (!date) {
    alert("Vyplň datum konání.");
    return;
  }

  const data = await loadData();
  data.disciplineSchedule[discipline] = { date, time, place };
  await saveData(data);
  editingDiscipline = null;
}

async function removeDisciplineSchedule(discipline) {
  const confirmed = confirm(`Opravdu chceš odstranit termín disciplíny "${discipline}"?`);
  if (!confirmed) return;

  const data = await loadData();
  delete data.disciplineSchedule[discipline];
  await saveData(data);

  if (editingDiscipline === discipline) editingDiscipline = null;
}

function renderSavedDates() {
  const container = document.getElementById("datesContent");

  const items = currentData.disciplines
    .map((discipline) => {
      const schedule = currentData.disciplineSchedule[discipline] || null;
      if (!schedule) return null;
      return {
        name: discipline,
        date: schedule.date || "",
        time: schedule.time || "",
        place: schedule.place || ""
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      `${a.date}T${a.time || "23:59"}`.localeCompare(`${b.date}T${b.time || "23:59"}`)
    );

  if (items.length === 0) {
    container.innerHTML = "Zatím tu není uložený žádný termín disciplíny.";
    return;
  }

  const list = document.createElement("ul");
  list.className = "saved-list";

  items.forEach((item) => {
    const li = document.createElement("li");
    const escaped = escapeId(item.name);

    const editHtml = editingDiscipline === item.name ? `
      <div class="editing-box">
        <label for="edit-date-${escaped}">Datum</label>
        <input type="date" id="edit-date-${escaped}" value="${item.date}">
        <label for="edit-time-${escaped}">Čas</label>
        <input type="time" id="edit-time-${escaped}" value="${item.time}">
        <label for="edit-place-${escaped}">Místo</label>
        <input type="text" id="edit-place-${escaped}" value="${item.place.replace(/"/g, "&quot;")}">
        <button class="save-edit-btn" data-name="${item.name}">Uložit změny</button>
        <button class="secondary-button cancel-edit-btn">Zrušit</button>
      </div>
    ` : "";

    li.innerHTML = `
      <div>
        <div class="saved-item-title">${item.name}</div>
        <div class="saved-item-meta">
          Datum: ${formatDate(item.date)}<br>
          Čas: ${item.time || "neuvedeno"}<br>
          Místo: ${item.place || "neuvedeno"}
        </div>
        ${editHtml}
      </div>
      <div class="saved-item-actions">
        <button class="secondary-button edit-btn" data-name="${item.name}">Upravit</button>
        <button class="danger-button remove-btn" data-name="${item.name}">Odstranit</button>
      </div>
    `;

    list.appendChild(li);
  });

  container.innerHTML = "";
  container.appendChild(list);

  container.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => startEditDiscipline(btn.dataset.name));
  });

  container.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => removeDisciplineSchedule(btn.dataset.name));
  });

  container.querySelectorAll(".cancel-edit-btn").forEach(btn => {
    btn.addEventListener("click", cancelEditDiscipline);
  });

  container.querySelectorAll(".save-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => updateDisciplineSchedule(btn.dataset.name));
  });
}

function renderResultsForm() {
  const container = document.getElementById("resultsForm");
  const discipline = document.getElementById("resultDisciplineSelect").value;

  if (currentData.disciplines.length === 0) {
    container.innerHTML = '<div class="hint">Nejdřív přidej disciplíny.</div>';
    return;
  }

  if (currentData.teams.length === 0) {
    container.innerHTML = '<div class="hint">Nejdřív přidej týmy.</div>';
    return;
  }

  const resultMap = currentData.disciplineResults[discipline] || {};
  container.innerHTML = "";

  currentData.teams.forEach((team) => {
    const row = document.createElement("div");
    row.className = "result-row";

    const label = document.createElement("div");
    label.className = "team-label";
    label.textContent = team;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.step = "1";
    input.placeholder = "Umístění";
    input.id = `result-${escapeId(team)}`;
    input.value = resultMap[team] ? String(resultMap[team]) : "";

    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  });
}

async function saveDisciplineResults() {
  const discipline = document.getElementById("resultDisciplineSelect").value;

  if (!discipline) {
    showMessage("resultsMessage", "Nejdřív vyber disciplínu.");
    return;
  }

  const resultMap = {};
  const usedPlaces = new Set();

  for (const team of currentData.teams) {
    const input = document.getElementById(`result-${escapeId(team)}`);
    const raw = input ? input.value.trim() : "";

    if (raw === "") continue;

    const place = Number(raw);

    if (!Number.isInteger(place) || place < 1) {
      showMessage("resultsMessage", "Umístění musí být celé číslo od 1 výše.");
      return;
    }

    if (usedPlaces.has(place)) {
      showMessage("resultsMessage", "Stejné umístění nejde zadat dvakrát.");
      return;
    }

    usedPlaces.add(place);
    resultMap[team] = place;
  }

  const data = await loadData();
  data.disciplineResults[discipline] = resultMap;
  await saveData(data);

  showMessage("resultsMessage", "Výsledky byly uloženy.", true);
}

async function addTeam() {
  const input = document.getElementById("teamInput");
  const name = input.value.trim();

  if (!name) return;

  const data = await loadData();
  if (data.teams.includes(name)) return;

  data.teams.push(name);
  input.value = "";
  await saveData(data);
}

async function addDiscipline() {
  const input = document.getElementById("disciplineInput");
  const name = input.value.trim();

  if (!name) return;

  const data = await loadData();
  if (data.disciplines.includes(name)) return;

  data.disciplines.push(name);
  input.value = "";
  await saveData(data);
}

async function loginAdmin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginMessage.textContent = "";

  try {
    await login(email, password);
  } catch (error) {
    console.error(error);
    const code = error?.code || "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      loginMessage.textContent = "Špatný email nebo heslo.";
    } else if (code === "auth/unauthorized-domain") {
      loginMessage.textContent = "Tato doména není povolená ve Firebase Authentication.";
    } else if (code === "auth/too-many-requests") {
      loginMessage.textContent = "Příliš mnoho pokusů o přihlášení. Zkus to znovu později.";
    } else if (code === "auth/network-request-failed") {
      loginMessage.textContent = "Chyba připojení k síti.";
    } else if (code === "auth/operation-not-allowed") {
      loginMessage.textContent = "Email/Password přihlášení není ve Firebase zapnuté.";
    } else {
      loginMessage.textContent = `Přihlášení se nepodařilo (${code || "neznámá chyba"}).`;
    }
  }
}

async function logoutAdmin() {
  await logout();
}

document.getElementById("loginBtn").addEventListener("click", loginAdmin);
document.getElementById("logoutBtn").addEventListener("click", logoutAdmin);
document.getElementById("addTeamBtn").addEventListener("click", addTeam);
document.getElementById("addDisciplineBtn").addEventListener("click", addDiscipline);
document.getElementById("saveScheduleBtn").addEventListener("click", saveDisciplineSchedule);
document.getElementById("saveResultsBtn").addEventListener("click", saveDisciplineResults);
document.getElementById("resultDisciplineSelect").addEventListener("change", renderResultsForm);
document.getElementById("password").addEventListener("keydown", (event) => {
  if (event.key === "Enter") loginAdmin();
});
document.getElementById("email").addEventListener("keydown", (event) => {
  if (event.key === "Enter") loginAdmin();
});

watchAuth((user) => {
  loginMessage.textContent = "";
  if (user) {
    loginBox.classList.add("hidden");
    adminContent.classList.remove("hidden");
  } else {
    loginBox.classList.remove("hidden");
    adminContent.classList.add("hidden");
  }
});

subscribeToData((data) => {
  currentData = data;
  renderTeams();
  renderDisciplines();
  renderDisciplineOptions();
  renderSavedDates();
  renderResultDisciplineOptions();
});