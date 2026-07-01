import { Link } from "react-router-dom";
import { RefreshIcon } from "./Icons";

const VALID_CONNECTION_STATUSES = new Set(["CONNECTING", "LIVE", "WAITING", "OFFLINE"]);

function formatTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "belum ada";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function normalizeConnectionStatus(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();

  return VALID_CONNECTION_STATUSES.has(normalized) ? normalized : "CONNECTING";
}

export default function TopBar({
  connectionStatus,
  lastUpdated = null,
  isRefreshing = false,
  onRefresh,
  sectionLabel = "Monitor",
  sectionDescription = "Pantau informasi JKT48",
  showControls = true,
}) {
  const status = normalizeConnectionStatus(connectionStatus);
  const statusClass = status.toLowerCase();

  return (
    <header className="topbar">
      <Link className="topbar-mobile-brand" to="/quota" aria-label="CEK48">
        <img
          src="/cek48-icon.png"
          alt=""
          width="549"
          height="534"
          className="topbar-mobile-logo"
        />
        <span className="topbar-mobile-wordmark">
          <span className="topbar-mobile-cek">CEK</span>
          <span className="topbar-mobile-number">48</span>
        </span>
      </Link>

      <div className="topbar-title">
        <strong>{sectionLabel}</strong>
        <small>{sectionDescription}</small>
      </div>

      <div className="topbar-actions">
        {showControls ? (
          <output className={`topbar-status is-${statusClass}`} aria-live="polite">
            <span className="topbar-status-dot" aria-hidden="true" />
            <strong>{status}</strong>
            {status === "LIVE" && lastUpdated ? (
              <small>{formatTime(lastUpdated)}</small>
            ) : null}
          </output>
        ) : null}

        {showControls ? (
          <button
            className="refresh-button"
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing || typeof onRefresh !== "function"}
            aria-label={isRefreshing ? "Sedang sinkronisasi data" : "Refresh data"}
          >
            <RefreshIcon />
            <span>{isRefreshing ? "Sinkron..." : "Refresh"}</span>
          </button>
        ) : null}

        <Link
          className="topbar-info-link"
          to="/info"
          aria-label="Buka informasi aplikasi"
        >
          i
        </Link>
      </div>
    </header>
  );
}
