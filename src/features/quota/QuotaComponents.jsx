import { memo, useEffect, useState } from "react";
import {
  formatDateTabLabel,
  formatQuota,
  formatSessionLabel,
  getItemDate,
  getSoldCount,
  getStatus,
  statusLabel,
} from "./quotaModel";

export function MemberPhoto({ name, image }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  const initials = String(name || "?")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`member-photo ${
        image && !imageFailed ? "has-photo" : "photo-fallback"
      }`}
    >
      {image && !imageFailed ? (
        <img
          src={image}
          alt={`Foto ${name}`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          width="400"
          height="500"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
      <div className="member-photo-shade" />
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" />
      {statusLabel(status)}
    </span>
  );
}

export function QuotaBar({ remaining, total, status }) {
  const quotaKnown = Number.isFinite(remaining);
  const percentage =
    quotaKnown && Number.isFinite(total) && total > 0
      ? Math.max(0, Math.min(100, (remaining / total) * 100))
      : null;

  return (
    <div
      className="quota-progress"
      aria-label={
        percentage === null
          ? "Jumlah kuota belum tersedia"
          : `${remaining} dari ${total} tiket tersisa`
      }
    >
      <div className="quota-track">
        <span
          className={`quota-fill quota-fill-${status}`}
          style={{ width: percentage === null ? "0%" : `${percentage}%` }}
        />
      </div>
      <span>{percentage === null ? "—" : `${Math.round(percentage)}%`}</span>
    </div>
  );
}

export function SummaryCard({ label, value, tone, suffix }) {
  return (
    <article className={`summary-card summary-${tone}`}>
      <div className="summary-top">
        <span>{label}</span>
        <span className="summary-pulse" />
      </div>
      <strong>{value}</strong>
      <small>{suffix}</small>
    </article>
  );
}

export const MemberCard = memo(function MemberCard({
  item,
  showDate = false,
  favorite = false,
  onToggleFavorite,
}) {
  const status = getStatus(item);
  const sold = getSoldCount(item);
  const total = Number.isFinite(item.total) ? item.total : null;
  const remaining = Number.isFinite(item.remaining) ? item.remaining : null;
  const sessionLabel = formatSessionLabel(item.session);
  const laneLabel = item.lane || "Jalur —";
  const dateLabel =
    showDate && getItemDate(item) ? formatDateTabLabel(getItemDate(item)) : "";
  const remainingPercentage =
    Number.isFinite(remaining) && Number.isFinite(total) && total > 0
      ? Math.max(0, Math.min(100, (remaining / total) * 100))
      : null;

  const availabilityLabel =
    status === "sold"
      ? "Tidak tersedia"
      : status === "unknown"
        ? "Belum terbaca"
        : status === "low"
          ? "Hampir habis"
          : "Tersedia";

  return (
    <article
      className={`quota-list-card quota-list-card-${status} ${favorite ? "is-favorite" : ""}`}
    >
      <div className="quota-list-avatar">
        <MemberPhoto name={item.member} image={item.avatar} />
      </div>

      <div className="quota-list-main">
        <div className="quota-list-heading">
          <strong title={item.member}>{item.member}</strong>
          <button
            type="button"
            className={`quota-favorite-button ${favorite ? "is-active" : ""}`}
            onClick={() => onToggleFavorite?.(item)}
            aria-label={
              favorite
                ? `Hapus ${item.member} dari favorit`
                : `Tambahkan ${item.member} ke favorit`
            }
            title={favorite ? "Hapus dari favorit" : "Tambahkan ke favorit"}
          >
            ★
          </button>
          {dateLabel ? <span className="quota-list-date">{dateLabel}</span> : null}
        </div>

        <div className="quota-list-meta">
          <span title={sessionLabel}>{sessionLabel}</span>
          <i aria-hidden="true" />
          <span title={laneLabel}>{laneLabel}</span>
        </div>

        <div className="quota-list-progress-row">
          <div
            className="quota-list-progress"
            aria-label={
              remainingPercentage === null
                ? "Persentase ketersediaan belum tersedia"
                : `${Math.round(remainingPercentage)} persen tiket masih tersedia`
            }
          >
            <span
              className={`quota-list-progress-fill quota-list-progress-fill-${status}`}
              style={{
                width: remainingPercentage === null ? "0%" : `${remainingPercentage}%`,
              }}
            />
          </div>
          <span className="quota-list-sold">
            {Number.isFinite(sold) && Number.isFinite(total)
              ? `${sold}/${total} terjual`
              : "Data penjualan —"}
          </span>
        </div>
      </div>

      <div className="quota-list-quota">
        <div className="quota-list-number">
          <strong>{formatQuota(remaining)}</strong>
          <small>sisa</small>
        </div>
        <span className={`quota-list-status quota-list-status-${status}`}>
          <i aria-hidden="true" />
          {availabilityLabel}
        </span>
      </div>
    </article>
  );
});

export const MemberGrid = memo(function MemberGrid({
  items,
  showDate,
  isFavorite,
  onToggleFavorite,
}) {
  return (
    <div className="quota-list-grid" role="group" aria-label="Data kuota member">
      {items.map((item) => (
        <MemberCard
          item={item}
          key={`${item.id}-${getItemDate(item)}`}
          showDate={showDate}
          favorite={isFavorite(item)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
});

export function SessionTabs({
  options,
  value,
  onChange,
  disabled = false,
  eyebrow = "QUICK SESSION",
  ariaLabel = "Daftar sesi",
  variant = "session",
}) {
  if (!options.length) return null;

  return (
    <section
      className={`session-tabs-panel ${variant === "date" ? "date-tabs-panel" : ""}`}
      aria-label={ariaLabel}
    >
      <div className="session-tabs-copy">
        <span>{eyebrow}</span>
      </div>
      <div className="session-tabs-scroll" role="tablist" aria-label={ariaLabel}>
        {options.map((option) => (
          <button
            type="button"
            role="tab"
            aria-selected={value === option.value}
            className={`session-tab ${value === option.value ? "is-active" : ""}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            title={option.title || option.label}
          >
            <span>{option.label}</span>
            <strong>{option.count}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
