import { useEffect, useMemo, useState } from "react";

const EMOJIS = ["🏄‍♀️","🌊","🏋️‍♀️","🧘‍♀️","📚","🥗","💧","😴","🚶‍♀️","🧠","🧼","🪥","🎨","🎧","🧊","☀️","🫶","🧩","🧺","🦷","🧑‍🍳","🧘","🏃‍♀️","🚴‍♀️"];

function hslToHex(h, s, l){
  // h: 0-360, s/l: 0-100
  s /= 100;
  l /= 100;

  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToHsl(hex){
  const h = hex.replace("#","").trim();
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0,2), 16) / 255;
  const g = parseInt(h.slice(2,4), 16) / 255;
  const b = parseInt(h.slice(4,6), 16) / 255;

  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let hh = 0, ss = 0;
  const ll = (max + min) / 2;
  const d = max - min;

  if (d !== 0){
    ss = d / (1 - Math.abs(2 * ll - 1));
    switch(max){
      case r: hh = ((g - b) / d) % 6; break;
      case g: hh = (b - r) / d + 2; break;
      case b: hh = (r - g) / d + 4; break;
    }
    hh = Math.round(hh * 60);
    if (hh < 0) hh += 360;
  }
  return { h: hh, s: Math.round(ss * 100), l: Math.round(ll * 100) };
}

function pickDistinctColor(usedColors){
  const used = (usedColors || []).filter(Boolean).map((c) => c.toLowerCase());
  const usedHues = used
    .map(hexToHsl)
    .filter(Boolean)
    .map((x) => x.h);

  // Ocean-friendly vivid palette, then fallback to optimized random hues
  const palette = [
    "#35c5ff", "#1a7bff", "#2ed4ff", "#6d5dfe", "#00b8d9",
    "#00d1b2", "#3b82f6", "#22c55e", "#a78bfa", "#38bdf8",
    "#06b6d4", "#6366f1", "#0ea5e9", "#14b8a6"
  ].filter((c) => !used.includes(c.toLowerCase()));

  if (palette.length){
    // choose a palette color with best hue distance vs used
    let best = palette[0];
    let bestScore = -1;
    for (const c of palette){
      const hsl = hexToHsl(c);
      const hue = hsl?.h ?? 0;
      const score = usedHues.length
        ? Math.min(...usedHues.map((u) => {
            const d = Math.abs(u - hue);
            return Math.min(d, 360 - d);
          }))
        : 999;
      if (score > bestScore){
        bestScore = score;
        best = c;
      }
    }
    return best;
  }

  // Fallback: generate random hue that maximizes distance (try 40 candidates)
  let bestHue = Math.floor(Math.random() * 360);
  let bestScore = -1;

  for (let i = 0; i < 40; i++){
    const hue = Math.floor(Math.random() * 360);
    const score = usedHues.length
      ? Math.min(...usedHues.map((u) => {
          const d = Math.abs(u - hue);
          return Math.min(d, 360 - d);
        }))
      : 999;
    if (score > bestScore){
      bestScore = score;
      bestHue = hue;
    }
  }

  return hslToHex(bestHue, 82, 56);
}


export default function AddHabitModal({ open, onClose, onSave, initial=null, usedColors=[] }) {
  const isEdit = !!initial;

  const [name, setName] = useState("");
  const [kind, setKind] = useState("check"); // check | count
  const [required, setRequired] = useState(true);
  const [minCount, setMinCount] = useState("1");
  const [icon, setIcon] = useState("🏄‍♀️");
  const [customEmoji, setCustomEmoji] = useState("");
  const [color, setColor] = useState("#35c5ff");

  useEffect(() => {
    if (!open) return;

    // When creating a new habit, propose a fresh color (avoid repeats when possible)
    if (!initial) {
      setColor(pickDistinctColor(usedColors));
      setRequired(true);
      setMinCount("1");
    }
    if (!initial) return;
    setName(initial.name ?? "");
    setKind(initial.kind ?? "check");
    setRequired(!!initial.required);
    setMinCount(String(initial.minCount ?? 1));
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
    setMinCount("1");
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

        {(kind === "check" || kind === "count") && (
          <>
            <div style={{ height: 10 }} />
            <label style={label}>Required</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setRequired(true)} style={pill(required === true)} type="button">Yes</button>
              <button onClick={() => setRequired(false)} style={pill(required === false)} type="button">No</button>
            </div>

            {kind === "count" && required && (
              <>
                <div style={{ height: 10 }} />
                <label style={label}>Minimum count</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={minCount}
                  placeholder="1"
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => e.target.select()}
                  onChange={(e) => {
                    const raw = e.target.value;
                    // allow temporary empty value while typing (so user can replace "1" with "3")
                    if (raw === "") {
                      setMinCount("");
                      return;
                    }
                    const n = Number(raw);
                    if (Number.isFinite(n)) setMinCount(String(Math.max(0, Math.floor(n))));
                  }}
                  onBlur={() => {
                    const n = Number(minCount);
                    const fixed = Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
                    setMinCount(String(fixed));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  style={input}
                />
              </>
            )}
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
                required,
                color,
                minCount: kind === "count" && required ? Math.max(1, Math.floor(Number(minCount || 1))) : null,
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
