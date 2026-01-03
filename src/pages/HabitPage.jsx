import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLog, deleteHabit, putHabit } from "../storage/db";
import AddHabitModal from "../components/AddHabitModal";

function iso(d){
  const x = new Date(d);
  x.setHours(0,0,0,0);
  const y = x.getFullYear();
  const m = String(x.getMonth()+1).padStart(2,"0");
  const day = String(x.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function parseISO(s){
  const [y,m,d] = String(s).split('-').map(Number);
  return new Date(y, (m||1)-1, d||1);
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function HabitPage({ habits, onHabitsChanged }) {
  const nav = useNavigate();
  const { id } = useParams();
  const habit = habits.find((h) => h.id === id);

  const [editOpen, setEditOpen] = useState(false);

  const [mode, setMode] = useState("7"); // 7 | 30 | year | custom
  const [year, setYear] = useState(new Date().getFullYear());
  const [start, setStart] = useState(iso(addDays(startOfToday(), -6)));
  const [end, setEnd] = useState(iso(startOfToday()));

  const range = useMemo(() => {
    if (mode === "7") {
      const e = startOfToday();
      const s = addDays(e, -6);
      return { start: iso(s), end: iso(e) };
    }
    if (mode === "30") {
      const e = startOfToday();
      const s = addDays(e, -29);
      return { start: iso(s), end: iso(e) };
    }
    if (mode === "year") {
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    }
    return { start, end };
  }, [mode, year, start, end]);

  const [kpi, setKpi] = useState({ a: "—", b: "—", c: "—" });
  const [series, setSeries] = useState([]); // {dateISO, value}

  useEffect(() => {
    if (!habit) return;

    (async () => {
      const dates = [];
      let cur = parseISO(range.start);
      const e = parseISO(range.end);
      cur.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      while (cur <= e) {
        dates.push(iso(cur));
        cur = addDays(cur, 1);
      }

      const points = [];
      for (const d of dates) {
        const v = await getLog(d, habit.id);
        const value = habit.kind === "check" ? (v ? 1 : 0) : (v || 0);
        points.push({ dateISO: d, value });
      }
      setSeries(points);

      if (habit.kind === "check") {
        const done = points.reduce((s,p)=>s+(p.value ? 1 : 0), 0);
        const pct = points.length ? Math.round((done / points.length) * 100) : 0;
        setKpi({
          a: `${pct}%`,
          b: `${done}/${points.length}`,
          c: `${points.length - done}`,
        });
      } else {
        const total = points.reduce((s,p)=>s+p.value, 0);
        const maxDay = points.reduce((m,p)=>Math.max(m,p.value), 0);
        const avg = points.length ? (total / points.length).toFixed(1) : "0.0";
        setKpi({ a: `${total}`, b: `${avg}`, c: `${maxDay}` });
      }
    })();
  }, [habit, range]);

  if (!habit) {
    return (
      <div style={card}>
        <button onClick={() => nav(-1)} style={btn} type="button">← Back</button>
        <div style={{ height: 12 }} />
        Habit not found.
      </div>
    );
  }

  const accent = habit.color || "#35c5ff";

  return (
    <div style={card}>
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <button onClick={() => nav(-1)} style={btn} type="button">← Back</button>
        <div style={{ marginLeft:"auto" }} />
        <button onClick={() => setEditOpen(true)} style={btn} type="button">Edit</button>
        <button
          onClick={async ()=>{
            const ok = window.confirm(`Delete "${habit.name}"?`);
            if(!ok) return;
            await deleteHabit(habit.id);
            onHabitsChanged?.();
            nav("/stats");
          }}
          style={dangerBtn}
          type="button"
        >
          Delete
        </button>
      </div>

      <div style={{ height: 10 }} />

      <div style={{ fontSize: 22, fontWeight: 950, display:"flex", gap:10, alignItems:"center" }}>
        <span style={{ width: 32, textAlign:"center" }}>{habit.icon}</span>
        <span>{habit.name}</span>
        <span style={{ marginLeft:"auto", width: 12, height: 12, borderRadius: 999, background: accent }} />
      </div>
      <div style={{ opacity: 0.65, marginTop: 4, fontSize: 12 }}>
        {habit.kind === "check"
          ? habit.required
            ? "Required • check habit"
            : "Check habit"
          : "Count habit"}
      </div>

      <div style={{ height: 14 }} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setMode("7")} style={pill(mode === "7", accent)} type="button">7d</button>
        <button onClick={() => setMode("30")} style={pill(mode === "30", accent)} type="button">30d</button>
        <button onClick={() => setMode("year")} style={pill(mode === "year", accent)} type="button">Year</button>
        <button onClick={() => setMode("custom")} style={pill(mode === "custom", accent)} type="button">Custom</button>

        {mode === "year" && (
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={select}>
            {Array.from({ length: 6 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        )}

        {mode === "custom" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        )}
      </div>

      <div style={{ height: 12 }} />
      <div style={{ opacity: 0.7, fontSize: 12 }}>Range: {range.start} → {range.end}</div>

      <div style={{ height: 12 }} />

      <div style={kpiGrid}>
        <div style={kpiCard}>
          <div style={kpiVal}>{kpi.a}</div>
          <div style={kpiLab}>{habit.kind === "check" ? "Completion" : "Total"}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiVal}>{kpi.b}</div>
          <div style={kpiLab}>{habit.kind === "check" ? "Days done" : "Avg/day"}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiVal}>{kpi.c}</div>
          <div style={kpiLab}>{habit.kind === "check" ? "Days missed" : "Best day"}</div>
        </div>
      </div>

      <AddHabitModal
        open={editOpen}
        initial={habit}
        onClose={() => setEditOpen(false)}
        onSave={async (data) => {
          await putHabit({ ...habit, ...data });
          onHabitsChanged?.();
          setEditOpen(false);
        }}
      />
    </div>
  );
}

const card = {
  padding: 14,
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 16,
  background: "rgba(255,255,255,.04)",
  boxShadow: "0 25px 70px rgba(0,0,0,.25)",
};

const btn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.08)",
  color: "#fff",
  fontWeight: 900,
};

const dangerBtn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,90,90,.35)",
  background: "rgba(255,90,90,.12)",
  color: "#fff",
  fontWeight: 900,
};

const pill = (on, accent) => ({
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  background: on ? `linear-gradient(135deg, ${accent}, rgba(26,123,255,1))` : "rgba(255,255,255,.06)",
  color: on ? "#001018" : "#fff",
  fontWeight: 900,
});

const select = {
  padding: "10px 10px",
  borderRadius: 12,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "#fff",
};

const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 };

const kpiCard = { padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)" };

const kpiVal = { fontSize: 20, fontWeight: 950 };
const kpiLab = { opacity: 0.65, fontSize: 12 };
