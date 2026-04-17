import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXBI6mXhwC5GhrBeUR3eq6-yYgbDoVOXc",
  authDomain: "parovyturnaj.firebaseapp.com",
  databaseURL: "https://parovyturnaj-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "parovyturnaj",
  storageBucket: "parovyturnaj.firebasestorage.app",
  messagingSenderId: "995648758325",
  appId: "1:995648758325:web:e7fd8774c9e4a26598477c",
  measurementId: "G-X7GRTTGJ4G"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const rootRef = ref(db, "turnaj");

function createEmptyData() {
  return {
    teams: [],
    disciplines: [],
    disciplineSchedule: {},
    disciplineResults: {}
  };
}

function normalize(data) {
  return {
    teams: Array.isArray(data?.teams) ? data.teams : [],
    disciplines: Array.isArray(data?.disciplines) ? data.disciplines : [],
    disciplineSchedule:
      data?.disciplineSchedule && typeof data.disciplineSchedule === "object"
        ? data.disciplineSchedule
        : {},
    disciplineResults:
      data?.disciplineResults && typeof data.disciplineResults === "object"
        ? data.disciplineResults
        : {}
  };
}

export async function loadData() {
  const snapshot = await get(rootRef);
  if (!snapshot.exists()) return createEmptyData();
  return normalize(snapshot.val());
}

export async function saveData(data) {
  await set(rootRef, normalize(data));
}

export function subscribeToData(callback) {
  return onValue(rootRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(createEmptyData());
      return;
    }
    callback(normalize(snapshot.val()));
  });
}