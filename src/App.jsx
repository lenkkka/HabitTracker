import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import TrackerPage from "./pages/TrackerPage";
import StatsPage from "./pages/StatsPage";
import HabitPage from "./pages/HabitPage";
import CalendarPage from "./pages/CalendarPage";
import { getHabits, putHabit, getMeta, setMeta } from "./storage/db";
import AddHabitModal from "./components/AddHabitModal";
import OceanWaves from "./components/OceanWaves";

function isoToday(){
  const d = new Date();
  d.setHours(0,0,0,0);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
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

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <OceanWaves />
      <div style={wrap}>
        <Header onAdd={() => setAddOpen(true)} />

        <div style={{ height: 14 }} />

        {!ready ? (
          <div style={{ opacity: 0.8 }}>Loading…</div>
        ) : (
          <Routes>
            <Route path="/" element={<TrackerPage dateISO={dateISO} setDateISO={setDateISO} habits={habits} />} />
            <Route path="/stats" element={<StatsPage habits={habits} onReorder={refreshHabits} />} />
            <Route path="/calendar" element={<CalendarPage habits={habits} />} />
            <Route path="/habit/:id" element={<HabitPage habits={habits} onHabitsChanged={refreshHabits} />} />
          </Routes>
        )}

        <div style={{ height: 14 }} />
        <div style={{ opacity: 0.55, fontSize: 12 }}>
          Data is stored locally on your device (IndexedDB). Updating the site won’t erase it.
        </div>
      </div>

      <AddHabitModal
        open={addOpen}
        usedColors={habits.map(h => h.color).filter(Boolean)}
        onClose={() => setAddOpen(false)}
        onSave={async (data) => {
          const h = { id: uid(), order: habits.length, ...data };
          await putHabit(h);
          await refreshHabits();
        }}
      />
    </div>
  );
}

function Header({ onAdd }) {
const linkStyle = ({ isActive }) => ({
    padding: "10px 14px",
    borderRadius: 999,
    textDecoration: "none",
    color: isActive ? "#001018" : "rgba(234,246,255,.92)",
    background: isActive
      ? "linear-gradient(135deg, rgba(53,197,255,1), rgba(26,123,255,1))"
      : "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.14)",
    boxShadow: isActive ? "0 12px 30px rgba(53,197,255,.18)" : "none",
    fontWeight: 950,
  });

  return (
    <header style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: 0.2 }}>Habit Tracker</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <NavLink to="/" style={linkStyle}>Tracker</NavLink>
          <NavLink to="/stats" style={linkStyle}>Stats</NavLink>
          <NavLink to="/calendar" style={linkStyle}>Calendar</NavLink>
        </div>

        <div style={{ marginLeft: "auto" }}>
          <button onClick={onAdd} style={btn} type="button" aria-label="Add habit">+</button>
        </div>
      </div>
    </header>
  );
}


const wrap = {
  padding: 16,
  paddingTop: "calc(72px + env(safe-area-inset-top))",
  maxWidth: 980,
  margin: "0 auto",
  color: "var(--text)",
  paddingBottom: "max(16px, env(safe-area-inset-bottom))",
};

const btn = {
  width: 44,
  height: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.18)",
  background: "linear-gradient(135deg, rgba(109,93,254,1), rgba(46,212,255,1))",
  color: "#06131b",
  fontWeight: 950,
  boxShadow: "0 14px 34px rgba(109,93,254,.22)",
};

