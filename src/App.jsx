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
    setHabits(await getHabits());
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
            <Route path="/stats" element={<StatsPage habits={habits} />} />
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
        onClose={() => setAddOpen(false)}
        onSave={async (data) => {
          const h = { id: uid(), ...data };
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
    <header style={{ display: "flex", gap: 10, alignItems: "center", flexWrap:"wrap" }}>
      <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: .2 }}>Habit Tracker</div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap:"wrap" }}>
        <NavLink to="/" style={linkStyle}>Tracker</NavLink>
        <NavLink to="/stats" style={linkStyle}>Stats</NavLink>
        <NavLink to="/calendar" style={linkStyle}>Calendar</NavLink>
        <button onClick={onAdd} style={btn} type="button">+ Habit</button>
      </div>
    </header>
  );
}

const wrap = {
  padding: 16,
  maxWidth: 980,
  margin: "0 auto",
  color: "var(--text)",
  paddingBottom: "max(16px, env(safe-area-inset-bottom))",
};

const btn = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.08)",
  color: "#fff",
  fontWeight: 950,
};
