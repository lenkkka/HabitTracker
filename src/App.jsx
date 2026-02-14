import { useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import TrackerPage from "./pages/TrackerPage";
import StatsPage from "./pages/StatsPage";
import HabitPage from "./pages/HabitPage";
import CalendarPage from "./pages/CalendarPage";
import { getHabits, putHabit, getMeta, setMeta, exportBackup, importBackup } from "./storage/db";
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
      await refreshHabits();
      setReady(true);
    })();
  }, []);

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
      await refreshHabits();
      setDrawerOpen(false);
    } catch (err) {
      console.error(err);
      alert(err?.message ? `Restore failed: ${err.message}` : "Restore failed.");
    } finally {
      setRestoreBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <OceanWaves />

      <div style={wrap}>
        <Header onMenu={() => setDrawerOpen(true)} />

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
        onClose={() => setDrawerOpen(false)}
        onDownload={handleDownloadBackup}
        onRestore={handlePickRestoreFile}
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

function Header({ onMenu }) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenu}
        style={menuBtn}
      >
        <MenuIcon />
      </button>

      <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: 0.2 }}>
        Habit Tracker
      </div>

      <div style={{ marginLeft: "auto", opacity: 0.75, fontSize: 12 }}>
        Tracker • Stats • Calendar
      </div>
    </header>
  );
}

function SideDrawer({ open, busy, onClose, onDownload, onRestore }) {
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
        aria-label="Menu"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          width: "min(320px, 86vw)",
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
          <div style={{ fontWeight: 950, letterSpacing: 0.2 }}>Menu</div>
          <div style={{ marginLeft: "auto" }}>
            <button type="button" onClick={onClose} style={closeBtn}>
              ✕
            </button>
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

function MenuIcon() {
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
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

const menuBtn = {
  width: 40,
  height: 40,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
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

const wrap = {
  padding: 16,
  paddingTop: "calc(48px + env(safe-area-inset-top))",
  maxWidth: 980,
  margin: "0 auto",
  color: "var(--text)",
  paddingBottom: "calc(110px + env(safe-area-inset-bottom))",
};
