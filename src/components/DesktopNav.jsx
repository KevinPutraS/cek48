import { NavLink } from "react-router-dom";

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18V9M10 18V5M16 18v-6M22 18H2" />
    </svg>
  );
}

function MemberIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c.6-3.8 2.6-5.7 6-5.7s5.4 1.9 6 5.7M16 7.5a3 3 0 0 1 0 6M16.5 15c2.3.6 3.7 2.2 4.2 5" />
    </svg>
  );
}

function ScheduleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18M8 14h3M13 14h3M8 18h3" />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h14v14H5z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: "/quota", label: "Monitor", icon: MonitorIcon },
  { to: "/news", label: "News", icon: NewsIcon },
  { to: "/members", label: "Member", icon: MemberIcon },
  { to: "/schedule", label: "Jadwal", icon: ScheduleIcon },
];

export default function DesktopNav() {
  return (
    <aside className="desktop-sidebar" aria-label="Navigasi utama desktop">
      <NavLink className="sidebar-brand" to="/quota">
        <img
          src="/cek48-icon.png"
          alt=""
          width="549"
          height="534"
          className="sidebar-brand-logo"
        />
        <span className="sidebar-brand-wordmark" aria-hidden="true">
          <span className="sidebar-brand-cek">CEK</span>
          <span className="sidebar-brand-number">48</span>
        </span>
      </NavLink>

      <div className="sidebar-caption">MIDNIGHT ORBIT</div>

      <nav className="desktop-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `desktop-nav-link ${isActive ? "is-active" : ""}`
            }
          >
            <span className="desktop-nav-icon">
              <Icon />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-status">
        <span>
          <i /> Aplikasi siap
        </span>
        <small>Status data di Monitor</small>
      </div>
      <div className="sidebar-build">
        <span>Build 5.4.0</span>
        <small>© 2026 CEK48</small>
      </div>
    </aside>
  );
}
