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

/**
 * Backup / Restore
 * - habits: array of habit objects (keyPath id)
 * - logs: array of { key, value } where key is `${dateISO}|${habitId}`
 * - meta: array of { key, value }
 */
export async function exportBackup() {
  const db = await dbPromise;
  const tx = db.transaction(["habits", "logs", "meta"], "readonly");

  const habits = await tx.objectStore("habits").getAll();

  const logsStore = tx.objectStore("logs");
  const logKeys = await logsStore.getAllKeys();
  const logs = [];
  for (const key of logKeys) {
    logs.push({ key: String(key), value: await logsStore.get(key) });
  }

  const metaStore = tx.objectStore("meta");
  const metaKeys = await metaStore.getAllKeys();
  const meta = [];
  for (const key of metaKeys) {
    meta.push({ key: String(key), value: await metaStore.get(key) });
  }

  await tx.done;

  return {
    schema: 1,
    app: "habit-tracker",
    exportedAt: new Date().toISOString(),
    habits,
    logs,
    meta,
  };
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export async function importBackup(data) {
  if (!isPlainObject(data)) {
    throw new Error("Invalid backup: root must be an object");
  }
  if (data.app !== "habit-tracker") {
    // Allow older backups without app field, but block totally unrelated files.
    if (data.schema !== 1) {
      throw new Error("Invalid backup: not a Habit Tracker backup");
    }
  }

  const habits = Array.isArray(data.habits) ? data.habits : [];
  const logs = Array.isArray(data.logs) ? data.logs : [];
  const meta = Array.isArray(data.meta) ? data.meta : [];

  const db = await dbPromise;
  const tx = db.transaction(["habits", "logs", "meta"], "readwrite");

  // Replace existing data (restore semantics).
  await tx.objectStore("habits").clear();
  await tx.objectStore("logs").clear();
  await tx.objectStore("meta").clear();

  for (const h of habits) {
    if (isPlainObject(h) && typeof h.id === "string") {
      await tx.objectStore("habits").put(h);
    }
  }

  for (const row of logs) {
    if (isPlainObject(row) && typeof row.key === "string") {
      await tx.objectStore("logs").put(row.value ?? null, row.key);
    }
  }

  for (const row of meta) {
    if (isPlainObject(row) && typeof row.key === "string") {
      await tx.objectStore("meta").put(row.value ?? null, row.key);
    }
  }

  await tx.done;
}