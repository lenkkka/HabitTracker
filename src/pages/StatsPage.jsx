import { useNavigate } from "react-router-dom";

export default function StatsPage({ habits }) {
  const nav = useNavigate();

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap:"wrap" }}>
        <div style={{ fontWeight: 950, fontSize: 18 }}>Stats</div>
        <div style={{ opacity: 0.65, fontSize: 12 }}>Tap a habit to open details</div>
      </div>

      <div style={{ height: 12 }} />

      <div style={{ display: "grid", gap: 10 }}>
        {habits.map((h) => (
          <button
            key={h.id}
            onClick={() => nav(`/habit/${h.id}`)}
            style={{...habitBtn, borderLeft:`5px solid ${h.color || "#35c5ff"}`}}
            type="button"
          >
            <span style={{ fontSize: 18 }}>{h.icon || "•"}</span>
            <span style={{ fontWeight: 900 }}>{h.name}</span>
            <span style={{ marginLeft: "auto", opacity: 0.65 }}>›</span>
          </button>
        ))}
      </div>
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

const habitBtn = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.05)",
  color: "#fff",
  cursor: "pointer",
};
