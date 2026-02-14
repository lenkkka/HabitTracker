import { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import TrackerPage from "./pages/TrackerPage";
import StatsPage from "./pages/StatsPage";
import HabitPage from "./pages/HabitPage";
import CalendarPage from "./pages/CalendarPage";
import {
  getHabits,
  putHabit,
  getMeta,
  setMeta,
  exportBackup,
  importBackup,
} from "./storage/db";
import AddHabitModal from "./components/AddHabitModal";
import OceanWaves from "./components/OceanWaves";
import BottomNav from "./components/BottomNav";

function isoToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getGreetingParts(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h <= 11) return { text: "Good Morning", emoji: "🌅" };
  if (h >= 12 && h <= 16) return { text: "Good Afternoon", emoji: "☀️" };
  if (h >= 17 && h <= 21) return { text: "Good Evening", emoji: "🌇" };
  return { text: "Good Night", emoji: "🌙" };
}

async function ensureHabitOrder(list) {
  // If some habits don't have an order yet, assign it once and persist.
  let changed = false;
  const withOrder = list.map((h, i) => {
    if (h.order === undefined || h.order === null) {
      changed = true;
      return { ...h, order: i };
    }
    return h;
  });
  if (changed) {
    for (const h of withOrder) {
      await putHabit(h);
    }
  }
  return withOrder;
}

function sortHabits(list) {
  return [...list].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

const DEFAULT_ONE = {
  id: "surfing",
  name: "Surfing",
  icon: "🏄‍♀️",
  kind: "count",
  required: false,
  color: "#35c5ff",
};

export default function App() {
  const [dateISO, setDateISO] = useState(isoToday());
  const [habits, setHabits] = useState([]);
  const [ready, setReady] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);

  // Personal info (optional)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [now, setNow] = useState(() => new Date()); // for auto-updating greeting


  const fileRef = useRef(null);

  async function refreshHabits() {
    const list = await getHabits();
    const normalized = await ensureHabitOrder(list);
    setHabits(sortHabits(normalized));
  }

  useEffect(() => {
    (async () => {
      const seeded = await getMeta("seeded");
      const list = await getHabits();
      if (!seeded && list.length === 0) {
        await putHabit(DEFAULT_ONE);
        await setMeta("seeded", true);
      }

      // Load personal info
      const fn = (await getMeta("firstName")) ?? "";
      const ln = (await getMeta("lastName")) ?? "";
      setFirstName(String(fn || ""));
      setLastName(String(ln || ""));

      await refreshHabits();
      setReady(true);
    })();
  }, []);

  // Update greeting automatically when time-of-day changes (no refresh needed)
  useEffect(() => {
    let timerId;

    const scheduleNext = () => {
      const d = new Date();
      const h = d.getHours();
      const next = new Date(d);

      if (h < 5) next.setHours(5, 0, 0, 0);
      else if (h < 12) next.setHours(12, 0, 0, 0);
      else if (h < 17) next.setHours(17, 0, 0, 0);
      else if (h < 22) next.setHours(22, 0, 0, 0);
      else {
        next.setDate(next.getDate() + 1);
        next.setHours(5, 0, 0, 0);
      }

      const delayMs = Math.max(1000, next.getTime() - d.getTime() + 50);
      timerId = window.setTimeout(() => {
        setNow(new Date());
        scheduleNext();
      }, delayMs);
    };

    scheduleNext();
    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);


  const greeting = useMemo(() => {
    const { text, emoji } = getGreetingParts(now);
    const name = [firstName, lastName]
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .join(" ");

    // Format:
    // - With name: "Good Morning, First Last! 🌅"
    // - Without:   "Good Morning! 🌅"
    return name ? `${text}, ${name}! ${emoji}` : `${text}! ${emoji}`;
  }, [firstName, lastName, now]);

  async function handleDownloadBackup() {
    const data = await exportBackup();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    const stamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");
    const filename = `habit-tracker-backup-${stamp}.json`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    setDrawerOpen(false);
  }

  function handlePickRestoreFile() {
    if (restoreBusy) return;
    fileRef.current?.click();
  }

  async function handleRestoreFileChosen(e) {
    const file = e.target.files?.[0];
    // allow choosing the same file again later
    e.target.value = "";
    if (!file) return;

    try {
      setRestoreBusy(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importBackup(parsed);

      // Re-load personal info after restore
      const fn = (await getMeta("firstName")) ?? "";
      const ln = (await getMeta("lastName")) ?? "";
      setFirstName(String(fn || ""));
      setLastName(String(ln || ""));

      await refreshHabits();
      setDrawerOpen(false);
    } catch (err) {
      console.error(err);
      alert(err?.message ? `Restore failed: ${err.message}` : "Restore failed.");
    } finally {
      setRestoreBusy(false);
    }
  }

  async function handleUpdateFirstName(v) {
    setFirstName(v);
    await setMeta("firstName", v);
  }
  async function handleUpdateLastName(v) {
    setLastName(v);
    await setMeta("lastName", v);
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <OceanWaves />

      <div style={wrap}>
        <Header title={greeting} onMenu={() => setDrawerOpen(true)} />

        <div style={{ height: 14 }} />

        {!ready ? (
          <div style={{ opacity: 0.8 }}>Loading…</div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <TrackerPage
                  dateISO={dateISO}
                  setDateISO={setDateISO}
                  habits={habits}
                />
              }
            />
            <Route
              path="/stats"
              element={<StatsPage habits={habits} onReorder={refreshHabits} />}
            />
            <Route path="/calendar" element={<CalendarPage habits={habits} />} />
            <Route
              path="/habit/:id"
              element={<HabitPage habits={habits} onHabitsChanged={refreshHabits} />}
            />
          </Routes>
        )}

        <div style={{ height: 14 }} />
        <div style={{ opacity: 0.55, fontSize: 12 }}>
          Data is stored locally on your device (IndexedDB). Updating the site won’t erase it.
        </div>
      </div>

      <BottomNav onAdd={() => setAddOpen(true)} />

      <AddHabitModal
        open={addOpen}
        usedColors={habits.map((h) => h.color).filter(Boolean)}
        onClose={() => setAddOpen(false)}
        onSave={async (data) => {
          const h = { id: uid(), order: habits.length, ...data };
          await putHabit(h);
          await refreshHabits();
        }}
      />

      <SideDrawer
        open={drawerOpen}
        busy={restoreBusy}
        firstName={firstName}
        lastName={lastName}
        onClose={() => setDrawerOpen(false)}
        onDownload={handleDownloadBackup}
        onRestore={handlePickRestoreFile}
        onFirstNameChange={handleUpdateFirstName}
        onLastNameChange={handleUpdateLastName}
      />

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleRestoreFileChosen}
      />
    </div>
  );
}

function Header({ title, onMenu }) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        type="button"
        aria-label="Open personal menu"
        onClick={onMenu}
        style={menuBtn}
      >
        <PersonIcon />
      </button>

      <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: 0.2 }}>
        {title}
      </div>
    </header>
  );
}

function SideDrawer({
  open,
  busy,
  firstName,
  lastName,
  onClose,
  onDownload,
  onRestore,
  onFirstNameChange,
  onLastNameChange,
}) {
  return (
    <>
      {/* scrim */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 180ms ease",
          zIndex: 9998,
        }}
      />

      {/* panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Profile"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          width: "min(340px, 88vw)",
          transform: open ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 220ms ease",
          zIndex: 9999,

          padding: "calc(16px + env(safe-area-inset-top)) 14px 18px",
          background: "rgba(255,255,255,.06)",
          borderRight: "1px solid rgba(255,255,255,.14)",
          boxShadow: "18px 0 70px rgba(0,0,0,.45)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",

          display: "flex",
          flexDirection: "column",
          gap: 12,
          color: "var(--text)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 950, letterSpacing: 0.2 }}>Profile</div>
          <div style={{ marginLeft: "auto" }}>
            <button type="button" onClick={onClose} style={closeBtn}>
              ✕
            </button>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
            Personal Info
          </div>

          <label style={label}>
            <div style={labelTop}>First name (optional)</div>
            <input
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              placeholder="First name"
              style={input}
              autoComplete="given-name"
            />
          </label>

          <label style={label}>
            <div style={labelTop}>Last name (optional)</div>
            <input
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              placeholder="Last name"
              style={input}
              autoComplete="family-name"
            />
          </label>

          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, lineHeight: 1.35 }}>
            Your name is stored locally (and included in backups). You can leave it empty.
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
            Backup & Restore
          </div>

          <button type="button" onClick={onDownload} style={drawerBtn}>
            Download current data (backup)
          </button>

          <button
            type="button"
            onClick={onRestore}
            style={{ ...drawerBtn, opacity: busy ? 0.6 : 1 }}
            disabled={busy}
          >
            {busy ? "Restoring…" : "Upload backup to restore"}
          </button>

          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10, lineHeight: 1.35 }}>
            Backup is a JSON file saved on your device. Uploading a backup will{" "}
            <b>replace</b> current local data in this browser.
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ fontSize: 12, opacity: 0.65 }}>
          Tip: on iPhone you can save the backup to Files / iCloud.
        </div>
      </aside>
    </>
  );
}

function PersonIcon() {
  // "user" outline, centered optically
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

const menuBtn = {
  width: 40,
  height: 40,
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  lineHeight: 0,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.06)",
  color: "rgba(234,246,255,.92)",
  boxShadow: "0 16px 40px rgba(0,0,0,.22)",
  cursor: "pointer",
};

const closeBtn = {
  width: 34,
  height: 34,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.06)",
  color: "rgba(234,246,255,.92)",
  cursor: "pointer",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  fontSize: 18,
  fontWeight: 800,
};

const card = {
  padding: 12,
  borderRadius: 18,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  boxShadow: "0 18px 60px rgba(0,0,0,.28)",
};

const drawerBtn = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.06)",
  color: "rgba(234,246,255,.92)",
  cursor: "pointer",
  fontWeight: 750,
  textAlign: "left",
  marginTop: 10,
};

const label = { display: "block", marginTop: 10 };
const labelTop = { fontSize: 12, opacity: 0.72, marginBottom: 6, fontWeight: 650 };

const input = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,.10)",
  color: "rgba(234,246,255,.92)",
  outline: "none",
  fontWeight: 750,
};

const wrap = {
  padding: 16,
  paddingTop: "calc(48px + env(safe-area-inset-top))",
  maxWidth: 980,
  margin: "0 auto",
  color: "var(--text)",
  paddingBottom: "calc(110px + env(safe-area-inset-bottom))",
};
