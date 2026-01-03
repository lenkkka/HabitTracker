import { openDB } from "idb";

const DB_NAME = "habit-tracker";
const DB_VER = 1;

export const dbPromise = openDB(DB_NAME, DB_VER, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("habits")) {
      db.createObjectStore("habits", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("logs")) {
      // key = `${dateISO}|${habitId}`
      db.createObjectStore("logs");
    }
    if (!db.objectStoreNames.contains("meta")) {
      db.createObjectStore("meta");
    }
  },
});

export async function getHabits() {
  const db = await dbPromise;
  return db.getAll("habits");
}

export async function putHabit(habit) {
  const db = await dbPromise;
  return db.put("habits", habit);
}

export async function deleteHabit(id) {
  const db = await dbPromise;
  return db.delete("habits", id);
}

function logKey(dateISO, habitId) {
  return `${dateISO}|${habitId}`;
}

export async function getLog(dateISO, habitId) {
  const db = await dbPromise;
  return (await db.get("logs", logKey(dateISO, habitId))) ?? null;
}

export async function setLog(dateISO, habitId, value) {
  const db = await dbPromise;
  return db.put("logs", value, logKey(dateISO, habitId));
}

export async function getMeta(key) {
  const db = await dbPromise;
  return (await db.get("meta", key)) ?? null;
}

export async function setMeta(key, value) {
  const db = await dbPromise;
  return db.put("meta", value, key);
}
