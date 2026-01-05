import { useEffect, useState } from "react";
import { getLog, setLog } from "../storage/db";
import DayDetailModal from "../components/DayDetailModal";

function shift(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function mixHex(a, b, t) {
  const pa = String(a || "").replace("#", "");
  const pb = String(b || "").replace("#", "");
  if (pa.length !== 6 || pb.length !== 6) return a;
  const ar = parseInt(pa.slice(0, 2), 16),
    ag = parseInt(pa.slice(2, 4), 16),
    ab = parseInt(pa.slice(4, 6), 16);
  const br = parseInt(pb.slice(0, 2), 16),
    bg = parseInt(pb.slice(2, 4), 16),
    bb = parseInt(pb.slice(4, 6), 16);
  const tt = clamp01(t);
  const r = Math.round(ar + (br - ar) * tt);
  const g = Math.round(ag + (bg - ag) * tt);
  const b2 = Math.round(ab + (bb - ab) * tt);
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b2)}`;
}

function habitGradient(color) {
  const c1 = color || "#35c5ff";
  const c2 = mixHex(c1, "#1a7bff", 0.45);
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

export default function TrackerPage({ dateISO, setDateISO, habits }) {
  const [bump, setBump] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState("Day details");
  const [detailHabits, setDetailHabits] = useState([]);

  const prettyDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateISO}T00:00:00`));

  function openSummary(kind) {
    if (kind === "required") {
      setDetailTitle("Required habits");
      setDetailHabits(habits.filter((h) => h.required));
    } else if (kind === "optional") {
      setDetailTitle("Optional habits");
      setDetailHabits(habits.filter((h) => !h.required));
    } else {
      setDetailTitle("Count habits");
      setDetailHabits(habits.filter((h) => h.kind === "count"));
    }
    setDetailOpen(true);
  }

  return (
    <div style={gridWrap}>
      {/* Summary widget */}
      <div style={card}>
        <TodaySummary
          habits={habits}
          dateISO={dateISO}
          bump={bump}
          onOpen={openSummary}
        />
      </div>

      {/* Main tracker card */}
      <div style={card}>
        <div style={topBar}>
          <div style={row1}>
            <button
              onClick={() => setDateISO(shift(dateISO, -1))}
              type="button"
              style={navBtn}
              aria-label="Previous day"
            >
              ‹
            </button>

            {/* Date pill (tap opens native date picker) */}
            <div style={datePill} aria-label="Choose date">
              <div style={{ pointerEvents: "none" }}>{prettyDate}</div>

              {/* Invisible native date input on top */}
              <input
                type="date"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
                aria-label="Pick date"
                style={dateOverlayInput}
              />
            </div>

            <button
              onClick={() => setDateISO(shift(dateISO, 1))}
              type="button"
              style={navBtn}
              aria-label="Next day"
            >
              ›
            </button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gap: 10 }}>
          {habits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              dateISO={dateISO}
              onChanged={() => setBump((x) => x + 1)}
            />
          ))}
        </div>
      </div>

      {/* Drill-down modal (same as calendar) */}
      <DayDetailModal
        open={detailOpen}
        title={detailTitle}
        dateISO={dateISO}
        habits={detailHabits}
        onClose={() => setDetailOpen(false)}
        onChanged={() => setBump((x) => x + 1)}
      />
    </div>
  );
}

function HabitRow({ habit, dateISO, onChanged }) {
  const [val, setVal] = useState(null);

  useEffect(() => {
    (async () => {
      const v = await getLog(dateISO, habit.id);
      setVal(v ?? (habit.kind === "count" ? 0 : false));
    })();
  }, [dateISO, habit.id, habit.kind]);

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
      <div style={{ fontSize: 18, width: 28, textAlign: "center" }}>
        {habit.icon || "•"}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800 }}>{habit.name}</div>
        <div style={{ opacity: 0.65, fontSize: 12 }}>
          {habit.kind === "check"
            ? habit.required
              ? "Required • check"
              : "Optional • check"
            : habit.required
              ? `Required • count${habit.minCount ? ` • min ${habit.minCount}` : ""}`
              : "Optional • count"}
        </div>
      </div>

      <div style={{ marginLeft: "auto" }} />

      {habit.kind === "check" ? (
        <button
          onClick={toggle}
          type="button"
          style={habitBtn(val ? color : null)}
          aria-label="Toggle"
        >
          {val ? "✓" : ""}
        </button>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => inc(-1)} type="button" aria-label="Decrease">
            -
          </button>

          <input
            type="number"
            inputMode="numeric"
            value={val ?? ""}
            placeholder="0"
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.target.select()}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                setVal(null);
                return;
              }
              const n = Number(raw);
              if (Number.isFinite(n)) setVal(Math.max(0, Math.floor(n)));
            }}
            onBlur={async () => {
              const n = Number(val ?? 0);
              const next = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
              setVal(next);
              await setLog(dateISO, habit.id, next);
              onChanged && onChanged();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            style={countInput}
            aria-label="Count"
          />

          <button onClick={() => inc(1)} type="button" aria-label="Increase">
            +
          </button>
        </div>
      )}
    </div>
  );
}

function TodaySummary({ habits, dateISO, bump, onOpen }) {
  const [summary, setSummary] = useState({
    reqPct: 0,
    optPct: 0,
    countTotal: 0,
  });

  useEffect(() => {
    (async () => {
      const req = habits.filter((h) => h.required);
      let reqDone = 0;
      for (const h of req) {
        const v = await getLog(dateISO, h.id);
        if (h.kind === "check") {
          if (v) reqDone++;
        } else if (h.kind === "count") {
          const min = Math.max(1, Number(h.minCount ?? 1));
          if ((v || 0) >= min) reqDone++;
        }
      }
      const reqPct = req.length ? Math.round((reqDone / req.length) * 100) : 100;

      const opt = habits.filter((h) => !h.required);
      let optDone = 0;
      for (const h of opt) {
        const v = await getLog(dateISO, h.id);
        if (h.kind === "check") {
          if (v) optDone++;
        } else if (h.kind === "count") {
          if ((v || 0) > 0) optDone++;
        }
      }
      const optPct = opt.length ? Math.round((optDone / opt.length) * 100) : 100;

      const counts = habits.filter((h) => h.kind === "count");
      let countTotal = 0;
      for (const h of counts) {
        countTotal += (await getLog(dateISO, h.id)) || 0;
      }

      setSummary({ reqPct, optPct, countTotal });
    })();
  }, [habits, dateISO, bump]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
        alignItems: "center",
        gap: 0,
      }}
    >
      <button
        type="button"
        style={kpiColBtn}
        onClick={() => onOpen?.("required")}
        aria-label="Show required habits"
      >
        <div style={kpiValue}>{summary.reqPct}%</div>
        <div style={kpiLabel}>Required</div>
      </button>

      <div style={kpiDivider} />

      <button
        type="button"
        style={kpiColBtn}
        onClick={() => onOpen?.("optional")}
        aria-label="Show optional habits"
      >
        <div style={kpiValue}>{summary.optPct}%</div>
        <div style={kpiLabel}>Optional</div>
      </button>

      <div style={kpiDivider} />

      <button
        type="button"
        style={kpiColBtn}
        onClick={() => onOpen?.("count")}
        aria-label="Show count habits"
      >
        <div style={kpiValue}>{summary.countTotal}</div>
        <div style={kpiLabel}>Count total</div>
      </button>
    </div>
  );
}

const gridWrap = { display: "grid", gap: 14 };

const card = {
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.06)",
  boxShadow: "0 22px 60px rgba(0,0,0,.25)",
  backdropFilter: "blur(10px)",
};

const topBar = { display: "grid", gap: 10 };

const row1 = {
  display: "grid",
  gridTemplateColumns: "44px 1fr 44px",
  alignItems: "center",
  gap: 12,
};

const navBtn = {
  width: 44,
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.06)",
  color: "rgba(234,246,255,.92)",
  fontWeight: 950,
  fontSize: 22,
  lineHeight: 1,
  display: "grid",
  placeItems: "center",
};

const datePill = {
  position: "relative",
  width: "100%",
  height: 44,
  textAlign: "center",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.04)",
  fontWeight: 900,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "grid",
  placeItems: "center",
};

const dateOverlayInput = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  border: "none",
  background: "transparent",
  color: "transparent",
  cursor: "pointer",
};

const row = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.04)",
};

const habitBtn = (activeColorOrNull) => ({
  width: 54,
  height: 54,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  background: activeColorOrNull
    ? habitGradient(activeColorOrNull)
    : "rgba(255,255,255,.06)",
  color: activeColorOrNull ? "#001018" : "rgba(234,246,255,.92)",
  fontWeight: 950,
  fontSize: 22,
  display: "grid",
  placeItems: "center",
});

const countInput = {
  width: 56,
  height: 36,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.06)",
  color: "rgba(234,246,255,.92)",
  fontWeight: 900,
  textAlign: "center",
  outline: "none",
};

const kpiColBtn = {
  padding: 14,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 16,
  color: "inherit",
  cursor: "pointer",
};

const kpiValue = { fontSize: 22, fontWeight: 950 };
const kpiLabel = {
  opacity: 0.65,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.2,
};

const kpiDivider = {
  width: 1,
  alignSelf: "stretch",
  background: "rgba(255,255,255,.12)",
};