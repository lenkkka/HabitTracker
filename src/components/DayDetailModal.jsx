import { useEffect, useState } from "react";
import { getLog, setLog } from "../storage/db";

export default function DayDetailModal({ open, dateISO, habits, onClose, onChanged }) {
  const [vals, setVals] = useState({});

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      const next = {};
      for (const h of habits) {
        const v = await getLog(dateISO, h.id);
        next[h.id] = v ?? (h.kind === "check" ? false : 0);
      }
      if (alive) setVals(next);
    })();
    return () => { alive = false; };
  }, [open, dateISO, habits]);

  if (!open) return null;

  const toggle = async (h) => {
    const next = !vals[h.id];
    await setLog(dateISO, h.id, next);
    setVals((p) => ({ ...p, [h.id]: next }));
    onChanged?.();
  };

  const setCount = async (h, next) => {
    const v = Math.max(0, Number(next || 0));
    await setLog(dateISO, h.id, v);
    setVals((p) => ({ ...p, [h.id]: v }));
    onChanged?.();
  };

  return (
    <div style={overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={head}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontWeight: 950, fontSize: 20 }}>Day details</div>
            <div style={{ opacity: 0.7 }}>{dateISO}</div>
          </div>
          <button type="button" onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gap: 12 }}>
          {habits.map((h) => {
            const v = vals[h.id];
            const done = h.kind === "check" ? !!v : (v || 0) > 0;

            return (
              <div key={h.id} style={{ ...row, borderLeft: `5px solid ${h.color || "#35c5ff"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ opacity: 0.8, fontSize: 18 }}>•</div>
                  <div style={{ display: "grid" }}>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>{h.name}</div>
                    <div style={{ opacity: 0.7, fontSize: 13 }}>{h.required ? "Required" : "Optional"}</div>
                  </div>
                </div>

                {/* ✅ FIX: count habits = - 0 +, check habits = same-size circle */}
                {h.kind === "count" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button type="button" style={countBtn} onClick={() => setCount(h, (v || 0) - 1)}>−</button>
                    <div style={{ width: 26, textAlign: "center", fontWeight: 950 }}>{v || 0}</div>
                    <button type="button" style={countBtn} onClick={() => setCount(h, (v || 0) + 1)}>+</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(h)}
                    style={{
                      ...checkBtn,
                      background: done ? "rgba(53,197,255,.18)" : "rgba(255,255,255,.06)",
                      color: done ? "#eaf6ff" : "rgba(234,246,255,.55)",
                      borderColor: done ? "rgba(53,197,255,.28)" : "rgba(255,255,255,.18)",
                    }}
                    aria-label={done ? "Completed" : "Not completed"}
                  >
                    {done ? "✓" : ""}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ height: 12 }} />
        <div style={{ opacity: 0.65, fontSize: 12 }}>
          Count habits are treated as completed if value &gt; 0.
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "max(16px, env(safe-area-inset-top)) 12px max(16px, env(safe-area-inset-bottom))",
  zIndex: 99999,
};

const card = {
  width: "min(520px, 94vw)",
  maxHeight: "82vh",
  overflow: "auto",
  WebkitOverflowScrolling: "touch",
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(8,28,40,.92)",
  boxShadow: "0 25px 70px rgba(0,0,0,.55)",
  backdropFilter: "blur(12px)",
};

const head = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 };
const closeBtn = {
  width: 44,
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.06)",
  fontSize: 22,
  lineHeight: "44px",
};

const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.04)",
};

const checkBtn = {
  width: 52,
  height: 52,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.18)",
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
  fontSize: 20,
};

const countBtn = {
  width: 44,
  height: 44,
  borderRadius: 14,
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.06)",
};