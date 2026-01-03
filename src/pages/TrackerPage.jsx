import { useEffect, useRef, useState } from "react";
import { getLog, setLog } from "../storage/db";

function iso(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function shift(dateISO, deltaDays) {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + deltaDays);
  return iso(d);
}

export default function TrackerPage({ dateISO, setDateISO, habits }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((x) => x + 1);

  return (
    <div style={gridWrap}>
      <div style={card}>
        <div style={topBar}>
          <div style={row1}>
            <button onClick={() => setDateISO(shift(dateISO, -1))} type="button">
              ‹
            </button>

            <div style={dateTap}>
              <div style={{ fontWeight: 900 }}>{dateISO}</div>
            </div>

            <button onClick={() => setDateISO(shift(dateISO, 1))} type="button">
              ›
            </button>
          </div>

          <div style={row2}>
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gap: 10 }}>
          {habits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              dateISO={dateISO}
              refreshKey={refreshKey}
              onChanged={bump}
            />
          ))}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <TodaySummary habits={habits} dateISO={dateISO} refreshKey={refreshKey} />
    </div>
  );
}

function HabitRow({ habit, dateISO, refreshKey, onChanged }) {
  const [val, setVal] = useState(null);

  useEffect(() => {
    (async () => {
      const v = await getLog(dateISO, habit.id);
      setVal(v ?? (habit.kind === "count" ? 0 : false));
    })();
  }, [dateISO, habit.id, habit.kind, refreshKey]);

  async function toggle() {
    const next = !val;
    setVal(next);
    await setLog(dateISO, habit.id, next);
    onChanged && onChanged();
  }

  async function inc(delta) {
    const next = Math.max(0, (val ?? 0) + delta);
    setVal(next);
    await setLog(dateISO, habit.id, next);
    onChanged && onChanged();
  }

  const color = habit.color || "#35c5ff";

  return (
    <div style={{ ...row, borderLeft: `5px solid ${color}` }}>
      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 20, width: 28, textAlign: "center" }}>
            {habit.icon || "✅"}
          </div>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>{habit.name}</div>
            <div style={{ opacity: 0.65, fontSize: 12 }}>
              {habit.required ? "Required" : "Optional"} · {habit.kind}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginLeft: "auto" }} />

      {habit.kind === "check" ? (
        <button onClick={toggle} type="button" style={habitBtn(val ? color : null)}>
          {val ? "✓" : ""}
        </button>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => inc(-1)} type="button">
            -
          </button>
          <div style={{ width: 30, textAlign: "center", fontWeight: 900 }}>
            {val ?? 0}
          </div>
          <button onClick={() => inc(1)} type="button">
            +
          </button>
        </div>
      )}
    </div>
  );
}

function TodaySummary({ habits, dateISO, refreshKey }) {
  const [summary, setSummary] = useState({ reqPct: 0, countTotal: 0 });

  useEffect(() => {
    (async () => {
      const req = habits.filter((h) => h.kind === "check" && h.required);
      let done = 0;
      for (const h of req) {
        const v = await getLog(dateISO, h.id);
        if (v) done++;
      }
      const reqPct = req.length ? Math.round((done / req.length) * 100) : 100;

      const counts = habits.filter((h) => h.kind === "count");
      let countTotal = 0;
      for (const h of counts) {
        countTotal += (await getLog(dateISO, h.id)) || 0;
      }

      setSummary({ reqPct, countTotal });
    })();
  }, [habits, dateISO, refreshKey]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={kpi}>
        <div style={{ fontWeight: 950, fontSize: 40 }}>{summary.reqPct}%</div>
        <div style={{ opacity: 0.65, fontSize: 12 }}>Required completion today</div>
      </div>

      <div style={kpi}>
        <div style={{ fontWeight: 950, fontSize: 40 }}>{summary.countTotal}</div>
        <div style={{ opacity: 0.65, fontSize: 12 }}>Total count actions</div>
      </div>
    </div>
  );
}

const topBar = { display: "grid", gap: 10 };
const row1 = {
  display: "grid",
  gridTemplateColumns: "44px 1fr 44px",
  alignItems: "center",
  gap: 10,
};
const row2 = { display: "grid", gap: 10 };

const dateTap = {
  minWidth: 0,
  width: "100%",
  textAlign: "center",
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
};

const gridWrap = { display: "grid", gap: 14 };

const card = {
  padding: 14,
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 16,
  background: "rgba(255,255,255,.04)",
  boxShadow: "0 25px 70px rgba(0,0,0,.25)",
};

const row = {
  padding: 12,
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 16,
  background: "rgba(0,0,0,.12)",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const kpi = {
  padding: 14,
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 16,
  background: "rgba(0,0,0,.12)",
};

function habitBtn(activeColor) {
  const base = {
    width: 52,
    height: 52,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    fontWeight: 950,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
  };

  if (!activeColor) return base;

  return {
    ...base,
    border: `1px solid rgba(255,255,255,.10)`,
    background: `linear-gradient(135deg, rgba(255,255,255,.10), ${activeColor}55)`,
    boxShadow: `0 10px 30px ${activeColor}22`,
  };
}