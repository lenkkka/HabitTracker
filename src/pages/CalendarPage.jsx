import { useEffect, useMemo, useState } from "react";
import { getLog } from "../storage/db";
import DayDetailModal from "../components/DayDetailModal";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function startOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

// IMPORTANT: local YYYY-MM-DD (no timezone shift)
function iso(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

function ringStyle(colors) {
  if (!colors || colors.length === 0) return {};
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ");
  return {
    background: `conic-gradient(${stops})`,
    WebkitMask: "radial-gradient(circle, transparent 62%, #000 63%)",
    mask: "radial-gradient(circle, transparent 62%, #000 63%)",
  };
}

export default function CalendarPage({ habits }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [rings, setRings] = useState({});
  const [bump, setBump] = useState(0);
  const [openDay, setOpenDay] = useState(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickMonth, setPickMonth] = useState(cursor.getMonth());
  const [pickYear, setPickYear] = useState(cursor.getFullYear());

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 21 }, (_, i) => y - 10 + i);
  }, []);

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);

  // Monday-start grid
  const gridStart = useMemo(() => {
    const s = new Date(monthStart);
    const dow = s.getDay();          // 0=Sun..6=Sat
    const dowMon = (dow + 6) % 7;    // 0=Mon..6=Sun
    return addDays(s, -dowMon);
  }, [monthStart]);

  const gridDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 42; i++) arr.push(addDays(gridStart, i));
    return arr;
  }, [gridStart]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const map = {};
      for (const day of gridDays) {
        const dayISO = iso(day);
        const colors = [];

        for (const h of habits) {
          const v = await getLog(dayISO, h.id);
          const done = h.kind === "check" ? !!v : ((v || 0) > 0);
          if (done) colors.push(h.color || "#35c5ff");
        }

        if (colors.length) map[dayISO] = colors;
      }

      if (!cancelled) setRings(map);
    })();

    return () => { cancelled = true; };
  }, [gridDays, habits, bump]);

  const label = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const todayISO = iso(new Date());

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 950, fontSize: 18 }}>Calendar</div>
        <div style={{ opacity: 0.65, fontSize: 12 }}>Tap a day to edit / view</div>
      </div>

      <div style={{ height: 10 }} />

      <div style={monthRow}>
        <button onClick={() => setCursor(addDays(monthStart, -1))} type="button">‹</button>

        <button
          type="button"
          onClick={() => {
            setPickMonth(cursor.getMonth());
            setPickYear(cursor.getFullYear());
            setPickerOpen(true);
          }}
          style={monthLabelBtn}
        >
          {label}
        </button>

        <button onClick={() => setCursor(addDays(monthStart, +32))} type="button">›</button>
      </div>

      <div style={{ height: 12 }} />

      {/* headers + days use same padding/gap so columns never shift */}
      <div style={gridWrap}>
        <div style={weekHeader}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ opacity: 0.65, fontSize: 12, textAlign: "center" }}>{w}</div>
          ))}
        </div>

        <div style={grid}>
          {gridDays.map((d) => {
            const dayISO = iso(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            const colors = rings[dayISO] || [];
            const isToday = dayISO === todayISO;

            return (
              <button
                key={dayISO}
                type="button"
                onClick={() => setOpenDay(dayISO)}
                style={dayCellBtn}
                title={dayISO}
              >
                <div style={outerCircle}>
                  {colors.length > 0 && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: 999, ...ringStyle(colors) }} />
                  )}

                  <div
                    style={{
                      ...innerCircle,
                      border: isToday
                        ? "1px solid rgba(255,255,255,.28)" // subtle “today” ring
                        : "1px solid rgba(255,255,255,.10)",
                      color: inMonth ? "#eaf6ff" : "rgba(234,246,255,.35)",
                    }}
                  >
                    {d.getDate()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 10 }} />
      <div style={{ opacity: 0.65, fontSize: 12 }}>
        Rings are multi-color when multiple habits are completed.
      </div>

      <DayDetailModal
        open={!!openDay}
        dateISO={openDay || ""}
        habits={habits}
        onClose={() => setOpenDay(null)}
        onChanged={() => setBump((x) => x + 1)}
      />

      {pickerOpen && (
        <div style={pickerOverlay} role="dialog" aria-modal="true" onClick={() => setPickerOpen(false)}>
          <div style={pickerCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>Choose month & year</div>
              <button type="button" onClick={() => setPickerOpen(false)} style={{ padding: "8px 10px", borderRadius: 12 }}>
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>Month</div>
                <select value={pickMonth} onChange={(e) => setPickMonth(Number(e.target.value))}>
                  {MONTHS.map((name, i) => (
                    <option key={name} value={i}>{name}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>Year</div>
                <select value={pickYear} onChange={(e) => setPickYear(Number(e.target.value))}>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button type="button" onClick={() => setPickerOpen(false)} style={{ borderRadius: 14 }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCursor(new Date(pickYear, pickMonth, 1));
                  setPickerOpen(false);
                }}
                style={{ borderRadius: 14, borderColor: "rgba(53,197,255,.45)", background: "rgba(53,197,255,.16)" }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
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

const monthRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 };
const monthLabelBtn = {
  flex: 1,
  textAlign: "center",
  fontWeight: 900,
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "inherit",
};

const gridWrap = { padding: "0 6px" };
const weekHeader = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, justifyItems: "center" };
const grid = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, justifyItems: "center" };

const dayCellBtn = {
  width: "100%",
  padding: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  placeItems: "center",
};

const outerCircle = {
  position: "relative",
  width: 34,
  height: 34,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  margin: "0 auto",
};

const innerCircle = {
  position: "relative",
  width: 30,
  height: 30,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(0,0,0,.18)",
  fontWeight: 900,
  fontSize: 12,
};

const pickerOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "max(16px, env(safe-area-inset-top)) 12px max(16px, env(safe-area-inset-bottom))",
  zIndex: 99999,
};

const pickerCard = {
  width: "min(420px, 92vw)",
  background: "rgba(8,28,40,.98)",
  color: "rgba(255,255,255,.92)",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 18,
  padding: 14,
  boxShadow: "0 25px 70px rgba(0,0,0,.60)",
  backdropFilter: "blur(12px)",
  maxHeight: "85vh",
  overflow: "auto",
  WebkitOverflowScrolling: "touch",
};