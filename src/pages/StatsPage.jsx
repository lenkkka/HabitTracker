import { useNavigate } from "react-router-dom";
import { putHabit } from "../storage/db";

export default function StatsPage({ habits, onReorder }) {
  const nav = useNavigate();

  /**
   * Reorder habits deterministically:
   * - swap the two items in the *current* rendered list
   * - then rewrite ALL `order` fields to 0..n-1 and persist
   *
   * This avoids edge cases where `order` values are missing, duplicated,
   * non-contiguous, or stored as strings from older data.
   */
  async function move(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= habits.length) return;

    // Swap in the current UI order
    const next = [...habits];
    [next[idx], next[j]] = [next[j], next[idx]];

    // Persist a clean, contiguous ordering
    await Promise.all(
      next.map((h, i) =>
        putHabit({
          ...h,
          order: i,
        })
      )
    );

    onReorder && onReorder();
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 950, fontSize: 18 }}>Stats</div>
        <div style={{ opacity: 0.65, fontSize: 12 }}>Tap a habit to open details</div>
      </div>

      <div style={{ height: 12 }} />

      <div style={{ display: "grid", gap: 10 }}>
        {habits.map((h, idx) => {
          const color = h.color || "#35c5ff";

          return (
            <div key={h.id} style={{ ...rowWrap, borderLeft: `5px solid ${color}` }}>
              <button onClick={() => nav(`/habit/${h.id}`)} style={habitBtn} type="button">
                <div style={{ width: 28, textAlign: "center", fontSize: 18 }}>{h.icon || "•"}</div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900 }}>{h.name}</div>
                  <div style={{ opacity: 0.65, fontSize: 12 }}>
                    {h.kind === "check"
                      ? h.required
                        ? "Required • check"
                        : "Optional • check"
                      : h.required
                        ? `Required • count${h.minCount ? ` • min ${h.minCount}` : ""}`
                        : "Optional • count"}
                  </div>
                </div>
              </button>

              {/* Reorder controls (same row, no extra boxes) */}
              <div style={arrows}>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={idx === habits.length - 1}
                  onClick={() => move(idx, +1)}
                  style={arrowBtn(idx === habits.length - 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                  style={arrowBtn(idx === 0)}
                >
                  ↑
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const card = {
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.06)",
  boxShadow: "0 25px 70px rgba(0,0,0,.25)",
  backdropFilter: "blur(10px)",
};

const rowWrap = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.04)",
};

const habitBtn = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.05)",
  color: "#fff",
  cursor: "pointer",
  textAlign: "left",
};

const arrows = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  paddingRight: 6,
};

const arrowBtn = (disabled) => ({
  border: "none",
  background: "transparent",
  color: disabled ? "rgba(234,246,255,.30)" : "rgba(234,246,255,.85)",
  fontWeight: 950,
  fontSize: 18,
  lineHeight: 1,
  padding: 6,
  cursor: disabled ? "default" : "pointer",
});
