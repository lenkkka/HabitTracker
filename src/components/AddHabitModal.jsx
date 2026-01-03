import { useEffect, useMemo, useState } from "react";

const EMOJIS = ["🏄‍♀️","🌊","🏋️‍♀️","🧘‍♀️","📚","🥗","💧","😴","🚶‍♀️","🧠","🧼","🪥","🎨","🎧","🧊","☀️","🫶","🧩","🧺","🦷","🧑‍🍳","🧘","🏃‍♀️","🚴‍♀️"];

export default function AddHabitModal({ open, onClose, onSave, initial=null }) {
  const isEdit = !!initial;

  const [name, setName] = useState("");
  const [kind, setKind] = useState("check"); // check | count
  const [required, setRequired] = useState(true);
  const [icon, setIcon] = useState("🏄‍♀️");
  const [customEmoji, setCustomEmoji] = useState("");
  const [color, setColor] = useState("#35c5ff");

  useEffect(() => {
    if (!open) return;
    if (!initial) return;
    setName(initial.name ?? "");
    setKind(initial.kind ?? "check");
    setRequired(!!initial.required);
    setIcon(initial.icon ?? "🏄‍♀️");
    setCustomEmoji("");
    setColor(initial.color ?? "#35c5ff");
  }, [open, initial]);

  const finalIcon = useMemo(
    () => (customEmoji.trim() ? customEmoji.trim() : icon),
    [customEmoji, icon]
  );

  if (!open) return null;

  function resetToDefault() {
    setName("");
    setKind("check");
    setRequired(true);
    setIcon("🏄‍♀️");
    setCustomEmoji("");
    setColor("#35c5ff");
  }

  function close() {
    if (!isEdit) resetToDefault();
    onClose();
  }

  return (
    <div style={overlay} onMouseDown={close}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>
            {isEdit ? "Edit habit" : "Add habit"}
          </div>
          <div style={{ marginLeft: "auto" }} />
          <button onClick={close} style={ghostBtn} type="button">✕</button>
        </div>

        <div style={{ height: 12 }} />

        <label style={label}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Meditation"
          style={input}
          type="text"
        />

        <div style={{ height: 12 }} />

        <label style={label}>Type</label>
        <div style={{ display: "flex", gap: 8, alignItems:"center", flexWrap:"wrap" }}>
          <button
            onClick={() => !isEdit && setKind("check")}
            style={pill(kind === "check", isEdit)}
            type="button"
            title={isEdit ? "Type is locked after creation" : ""}
          >
            Check
          </button>
          <button
            onClick={() => !isEdit && setKind("count")}
            style={pill(kind === "count", isEdit)}
            type="button"
            title={isEdit ? "Type is locked after creation" : ""}
          >
            Count
          </button>
          {isEdit && <span style={{ opacity:.6, fontSize:12 }}>(locked)</span>}
        </div>

        {kind === "check" && (
          <>
            <div style={{ height: 10 }} />
            <label style={label}>Required</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setRequired(true)} style={pill(required === true)} type="button">Yes</button>
              <button onClick={() => setRequired(false)} style={pill(required === false)} type="button">No</button>
            </div>
          </>
        )}

        <div style={{ height: 12 }} />

        <label style={label}>Icon (emoji)</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setIcon(e)} style={emojiBtn(e === icon)} type="button">{e}</button>
          ))}
        </div>

        <div style={{ height: 10 }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            placeholder="Or type your emoji…"
            style={input}
            type="text"
          />
          <div style={{ fontSize: 20, width: 34, textAlign: "center" }}>{finalIcon}</div>
        </div>

        <div style={{ height: 12 }} />

        <label style={label}>Color</label>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <div style={swatch(color)} />
        </div>

        <div style={{ height: 14 }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={close} style={ghostBtn} type="button">Cancel</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSave({
                name: name.trim(),
                icon: finalIcon,
                kind,
                required: kind === "check" ? required : false,
                color,
              });
              if (!isEdit) resetToDefault();
              onClose();
            }}
            style={primaryBtn}
            type="button"
          >
            {isEdit ? "Save changes" : "Save"}
          </button>
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
  alignItems: "flex-start",
  paddingTop: 24,
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const modal = {
  width: "min(560px, 100%)",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(10,20,30,.92)",
  backdropFilter: "blur(10px)",
  padding: 14,
  boxShadow: "0 25px 70px rgba(0,0,0,.45)",
  maxHeight: "85vh",
  overflow: "auto",
  WebkitOverflowScrolling: "touch",
};

const label = { opacity: 0.7, fontSize: 12, marginBottom: 6, display: "block" };
const input = { width: "100%", padding: "10px 12px", borderRadius: 12 };

const pill = (on, disabled=false) => ({
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  background: on ? "linear-gradient(135deg, rgba(53,197,255,1), rgba(26,123,255,1))" : "rgba(255,255,255,.06)",
  color: on ? "#001018" : "#fff",
  fontWeight: 800,
  opacity: disabled ? (on ? 1 : .55) : 1,
  cursor: disabled ? "not-allowed" : "pointer",
});

const emojiBtn = (on) => ({
  padding: "8px 10px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.14)",
  background: on ? "rgba(53,197,255,.22)" : "rgba(255,255,255,.06)",
  fontSize: 18,
});

const ghostBtn = { padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,.06)" };

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #35c5ff, #1a7bff)",
  color: "#001018",
  fontWeight: 950,
};

const swatch = (color) => ({
  width: 26,
  height: 26,
  borderRadius: 999,
  background: color,
  border: "1px solid rgba(255,255,255,.2)",
});
