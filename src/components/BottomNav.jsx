import { NavLink, useLocation } from "react-router-dom";

function Icon({ children }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function TrackerIcon() {
  return (
    <Icon>
      <path d="M4 7h16" />
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <rect x="4" y="7" width="16" height="14" rx="3" />
      <path d="M8 11h.01" />
      <path d="M12 11h.01" />
      <path d="M16 11h.01" />
      <path d="M8 15h.01" />
      <path d="M12 15h.01" />
      <path d="M16 15h.01" />
    </Icon>
  );
}

function StatsIcon() {
  return (
    <Icon>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 16v-5" />
      <path d="M12 16V8" />
      <path d="M17 16v-3" />
    </Icon>
  );
}

function CalendarIcon() {
  return (
    <Icon>
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 9h16" />
      <path d="M8 13h.01" />
      <path d="M12 13h.01" />
      <path d="M16 13h.01" />
      <path d="M8 17h.01" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </svg>
  );
}

export default function BottomNav({ onAdd }) {
  const location = useLocation();
  const path = location.pathname;

  const itemStyle = ({ isActive }) => ({
    flex: 1,
    minWidth: 56,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    borderRadius: 999,
    color: isActive ? "#06131b" : "rgba(234,246,255,.92)",
    background: isActive
      ? "linear-gradient(135deg, var(--accent), var(--accent2))"
      : "transparent",
    boxShadow: isActive ? "0 14px 34px rgba(53,197,255,.22)" : "none",
    border: isActive ? "1px solid rgba(255,255,255,.22)" : "1px solid transparent",
    transition: "transform 160ms ease, box-shadow 160ms ease, background 160ms ease",
  });

  const addBtnActive = path === "/add"; // (never true; keeps symmetry if you later add a route)

  return (
    <nav
      aria-label="Bottom navigation"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        width: "min(520px, calc(100vw - 24px))",
        height: 76,
        padding: 10,
        display: "flex",
        gap: 10,
        alignItems: "center",
        borderRadius: 999,
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.14)",
        boxShadow: "0 26px 70px rgba(0,0,0,.42)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        zIndex: 9999,
      }}
    >
      <NavLink to="/" style={itemStyle} end aria-label="Tracker">
        <TrackerIcon />
      </NavLink>

      <NavLink to="/stats" style={itemStyle} aria-label="Stats">
        <StatsIcon />
      </NavLink>

      <NavLink to="/calendar" style={itemStyle} aria-label="Calendar">
        <CalendarIcon />
      </NavLink>

      <button
        type="button"
        onClick={onAdd}
        aria-label="Add habit"
        style={{
          flex: 1,
          minWidth: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,.18)",
          background: "linear-gradient(135deg, rgba(109,93,254,1), rgba(46,212,255,1))",
          color: "#06131b",
          boxShadow: "0 14px 34px rgba(109,93,254,.22)",
          cursor: "pointer",
          transition: "transform 160ms ease, box-shadow 160ms ease",
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <PlusIcon />
      </button>
    </nav>
  );
}
