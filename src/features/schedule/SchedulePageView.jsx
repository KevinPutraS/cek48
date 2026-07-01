import TopBar from "../../components/TopBar";
import { getOfficialJkt48ScheduleUrl } from "../../services/externalLinks";
import {
  FILTERS,
  MONTHS,
  formatLongDate,
  formatReceptionTime,
  formatRupiah,
  formatSalesDate,
  formatShortDate,
  formatTeam,
  formatType,
  getRelativeDayLabel,
  getScheduleIdentity,
  getScheduleTemporalState,
} from "./scheduleModel";
import { ScheduleIcon, ScheduleSelect } from "./ScheduleControls";

export default function SchedulePageView({ schedulePage }) {
  const {
    availableSchedules,
    changeMonth,
    closeButtonRef,
    closeScheduleDetail,
    currentMonthSelected,
    detailData,
    detailError,
    detailLoading,
    dialogRef,
    error,
    favoriteLineup,
    goToCurrentMonth,
    groupedSchedules,
    handleMonthChange,
    handleYearChange,
    isFavorite,
    jakartaNow,
    loadSchedules,
    loading,
    month,
    nearestSchedule,
    openScheduleDetail,
    scheduleCounts,
    selectedSchedule,
    setPosterFailed,
    setTypeFilter,
    toggleFavorite,
    typeFilter,
    visiblePoster,
    visibleSchedules,
    year,
    yearOptions,
  } = schedulePage;
  return (
    <div className="app-shell">
      <TopBar
        sectionLabel="JADWAL"
        sectionDescription="Show dan event JKT48"
        showControls={false}
      />

      <main id="main-content" className="nx-page nx-schedule-page">
        <section className="nx-schedule-hero">
          <div className="nx-schedule-hero__copy">
            <span className="nx-kicker">JKT48 CALENDAR</span>
            <h1>Semua momen, tersusun lebih jelas.</h1>
            <p>
              Temukan show theater, event, dan jadwal terdekat tanpa harus membuka
              banyak halaman.
            </p>

            <div className="nx-schedule-hero__chips" aria-label="Ringkasan jadwal">
              <span>
                <strong>{scheduleCounts.ALL}</strong> agenda
              </span>
              <span>
                <strong>{scheduleCounts.SHOW}</strong> show
              </span>
              <span>
                <strong>{scheduleCounts.EVENT}</strong> event
              </span>
            </div>
          </div>

          <div className="nx-schedule-hero__calendar" aria-hidden="true">
            <span>{MONTHS[month - 1]}</span>
            <strong>{year}</strong>
            <small>Waktu Indonesia Barat</small>
            <i>{String(month).padStart(2, "0")}</i>
          </div>

          <div className="nx-schedule-hero__grid" aria-hidden="true" />
          <div className="nx-schedule-hero__flare" aria-hidden="true" />
        </section>

        <section className="nx-schedule-control-dock" aria-label="Kontrol jadwal">
          <div className="nx-schedule-month-control">
            <button
              type="button"
              className="nx-month-step"
              onClick={() => changeMonth(-1)}
              aria-label="Bulan sebelumnya"
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <div className="nx-schedule-selects">
              <ScheduleSelect
                label="Bulan"
                value={month}
                options={MONTHS.map((name, index) => ({
                  label: name,
                  value: index + 1,
                }))}
                onChange={handleMonthChange}
              />
              <ScheduleSelect
                label="Tahun"
                value={year}
                options={yearOptions.map((option) => ({
                  label: String(option),
                  value: option,
                }))}
                onChange={handleYearChange}
              />
            </div>

            <button
              type="button"
              className="nx-month-step"
              onClick={() => changeMonth(1)}
              aria-label="Bulan berikutnya"
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="nx-schedule-quick-actions">
            <button
              type="button"
              className="nx-schedule-today-button"
              onClick={goToCurrentMonth}
              disabled={currentMonthSelected || loading}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3v3M17 3v3M4 9h16" />
                <rect x="4" y="5" width="16" height="16" rx="2" />
                <path d="M9 14h6" />
              </svg>
              Bulan ini
            </button>

            <button
              type="button"
              className="nx-schedule-refresh-button"
              onClick={loadSchedules}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
              </svg>
              {loading ? "Memuat" : "Refresh"}
            </button>
          </div>

          <div
            className="nx-schedule-tabs"
            role="group"
            aria-label="Filter jenis jadwal"
          >
            {FILTERS.map((filter) => (
              <button
                type="button"
                aria-pressed={typeFilter === filter.value}
                className={typeFilter === filter.value ? "is-active" : ""}
                key={filter.value}
                onClick={() => setTypeFilter(filter.value)}
              >
                <span>{filter.label}</span>
                <strong>{scheduleCounts[filter.value]}</strong>
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <section className="nx-schedule-loading" aria-label="Memuat jadwal">
            <div className="nx-schedule-loading__head">
              <span />
              <p>
                <strong />
                <small />
              </p>
            </div>
            {Array.from({ length: 4 }, (_, index) => (
              <div className="nx-schedule-loading__row" key={index}>
                <span />
                <p>
                  <strong />
                  <small />
                </p>
              </div>
            ))}
          </section>
        ) : error ? (
          <section className="nx-state-card nx-state-card--error nx-schedule-state">
            <span className="nx-schedule-state__icon">!</span>
            <strong>Jadwal belum dapat dimuat</strong>
            <p>{error}</p>
            <button type="button" onClick={loadSchedules}>
              Coba lagi
            </button>
          </section>
        ) : visibleSchedules.length === 0 ? (
          <section className="nx-state-card nx-schedule-state">
            <span className="nx-schedule-state__icon">◇</span>
            <strong>Tidak ada agenda yang cocok</strong>
            <p>
              Coba pilih filter lain atau kembali ke bulan berjalan untuk melihat jadwal
              terbaru.
            </p>
            <div className="nx-schedule-state__actions">
              {typeFilter !== "ALL" ? (
                <button type="button" onClick={() => setTypeFilter("ALL")}>
                  Tampilkan semua
                </button>
              ) : null}
              {!currentMonthSelected ? (
                <button type="button" onClick={goToCurrentMonth}>
                  Kembali ke bulan ini
                </button>
              ) : null}
            </div>
          </section>
        ) : (
          <>
            {nearestSchedule
              ? (() => {
                  const date = formatShortDate(nearestSchedule.dateKey);
                  const relativeLabel = getRelativeDayLabel(
                    nearestSchedule.dateKey,
                    jakartaNow,
                  );

                  return (
                    <button
                      type="button"
                      className={`nx-next-event nx-next-event--${nearestSchedule.type.toLowerCase()}`}
                      onClick={() => openScheduleDetail(nearestSchedule)}
                    >
                      <div className="nx-next-event__signal">
                        <span>NEXT</span>
                        <i />
                      </div>

                      <div className="nx-next-event__date">
                        <span>{date.weekday}</span>
                        <strong>{date.day}</strong>
                        <small>{date.month}</small>
                      </div>

                      <div className="nx-next-event__icon">
                        <ScheduleIcon type={nearestSchedule.type} />
                      </div>

                      <div className="nx-next-event__copy">
                        <div>
                          <span>{formatType(nearestSchedule.type)}</span>
                          <i>{relativeLabel}</i>
                        </div>
                        <h2>{nearestSchedule.title}</h2>
                        <p>
                          {formatTeam(nearestSchedule.team)} ·{" "}
                          {nearestSchedule.startTime}
                          {nearestSchedule.endTime !== "--:--"
                            ? `–${nearestSchedule.endTime}`
                            : ""}{" "}
                          WIB
                        </p>
                      </div>

                      <span className="nx-next-event__arrow" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    </button>
                  );
                })()
              : null}

            <div className="nx-schedule-section-heading">
              <div>
                <span>MONTHLY TIMELINE</span>
                <h2>
                  {MONTHS[month - 1]} <strong>{year}</strong>
                </h2>
              </div>
              <p>
                Menampilkan <strong>{visibleSchedules.length}</strong> dari{" "}
                {availableSchedules.length} agenda
              </p>
            </div>

            <section className="nx-timeline" aria-label="Timeline jadwal JKT48">
              {Object.entries(groupedSchedules).map(([dateKey, items]) => {
                const date = formatShortDate(dateKey);
                const isToday = dateKey === jakartaNow.key;

                return (
                  <article
                    className={`nx-timeline-day ${isToday ? "is-today" : ""}`}
                    key={dateKey}
                  >
                    <header className="nx-timeline-date">
                      <div>
                        <span>{isToday ? "HARI INI" : date.weekday}</span>
                        <strong>{date.day}</strong>
                        <small>{date.month}</small>
                      </div>
                      <p>{formatLongDate(dateKey)}</p>
                      <i>{items.length} agenda</i>
                    </header>

                    <div className="nx-timeline-events">
                      {items.map((schedule) => {
                        const temporalState = getScheduleTemporalState(
                          schedule,
                          jakartaNow,
                        );
                        const relativeLabel = getRelativeDayLabel(
                          schedule.dateKey,
                          jakartaNow,
                        );

                        return (
                          <button
                            type="button"
                            className={`nx-event-row nx-event-row--${schedule.type
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "-")} is-${temporalState}`}
                            key={getScheduleIdentity(schedule)}
                            onClick={() => openScheduleDetail(schedule)}
                          >
                            <div className="nx-event-row__time">
                              <strong>{schedule.startTime}</strong>
                              <span>
                                {schedule.endTime !== "--:--"
                                  ? schedule.endTime
                                  : "WIB"}
                              </span>
                            </div>

                            <div className="nx-event-row__marker">
                              <ScheduleIcon type={schedule.type} />
                            </div>

                            <div className="nx-event-row__copy">
                              <div className="nx-event-row__tags">
                                <span>{formatType(schedule.type)}</span>
                                <i>{formatTeam(schedule.team)}</i>
                                {schedule.birthday ? <b>BIRTHDAY</b> : null}
                              </div>
                              <h3>{schedule.title}</h3>
                              <div className="nx-event-row__meta">
                                <span>{relativeLabel}</span>
                                {schedule.referenceCode ? (
                                  <small>{schedule.referenceCode}</small>
                                ) : null}
                              </div>
                            </div>

                            <span className="nx-event-row__arrow" aria-hidden="true">
                              <svg viewBox="0 0 24 24">
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </main>

      {selectedSchedule ? (
        <div
          className="nx-detail-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeScheduleDetail();
          }}
        >
          <section
            ref={dialogRef}
            className="nx-schedule-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nx-schedule-title"
          >
            <div className="nx-schedule-sheet__handle" aria-hidden="true" />
            <div className="nx-schedule-sheet__accent" />

            <header
              className={`nx-schedule-sheet__head ${visiblePoster ? "has-poster" : ""}`}
            >
              {visiblePoster ? (
                <figure className="nx-setlist-poster">
                  <img
                    src={visiblePoster.src}
                    alt={`Poster setlist ${visiblePoster.label}`}
                    loading="eager"
                    decoding="async"
                    style={{ objectPosition: visiblePoster.position }}
                    onError={() => setPosterFailed(true)}
                  />
                  <figcaption>SETLIST POSTER</figcaption>
                </figure>
              ) : (
                <div className="nx-schedule-sheet__badge">
                  <ScheduleIcon type={selectedSchedule.type} />
                </div>
              )}

              <div className="nx-schedule-sheet__title">
                <div className="nx-schedule-sheet__eyebrow">
                  <span>{formatType(selectedSchedule.type)}</span>
                  <i>{formatTeam(selectedSchedule.team)}</i>
                  {selectedSchedule.birthday ? <b>BIRTHDAY</b> : null}
                </div>
                <h2 id="nx-schedule-title">{selectedSchedule.title}</h2>
                <p>
                  {formatLongDate(selectedSchedule.dateKey)} ·{" "}
                  {selectedSchedule.startTime}
                  {selectedSchedule.endTime !== "--:--"
                    ? `–${selectedSchedule.endTime}`
                    : ""}{" "}
                  WIB
                </p>
                {visiblePoster ? (
                  <small className="nx-setlist-poster-name">
                    {visiblePoster.label}
                  </small>
                ) : null}
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className="nx-schedule-sheet__close"
                onClick={closeScheduleDetail}
                aria-label="Tutup detail"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <div className="nx-schedule-sheet__body">
              {detailLoading ? (
                <div className="nx-detail-loading">
                  <span />
                  <strong>Memuat detail show...</strong>
                  <small>Mengambil lineup dan informasi tiket.</small>
                </div>
              ) : detailError ? (
                <div className="nx-detail-error">
                  <span>!</span>
                  <strong>Detail show belum dapat dimuat</strong>
                  <p>{detailError}</p>
                  <button
                    type="button"
                    onClick={() => openScheduleDetail(selectedSchedule)}
                  >
                    Coba lagi
                  </button>
                </div>
              ) : (
                <>
                  {selectedSchedule.type === "SHOW" ? (
                    <section className="nx-detail-overview">
                      <div>
                        <span>Waktu mulai</span>
                        <strong>{selectedSchedule.startTime} WIB</strong>
                      </div>
                      <div>
                        <span>Open gate</span>
                        <strong>
                          {detailData
                            ? formatReceptionTime(detailData.receptionStartTime)
                            : "Belum tersedia"}
                        </strong>
                      </div>
                      <div>
                        <span>Harga tiket</span>
                        <strong>
                          {detailData
                            ? formatRupiah(detailData.price)
                            : "Lihat situs resmi"}
                        </strong>
                      </div>
                      <div>
                        <span>Total kuota</span>
                        <strong>
                          {detailData?.quotaSummary?.totalQuota != null
                            ? `${detailData.quotaSummary.totalQuota} tiket`
                            : "Belum tersedia"}
                        </strong>
                      </div>
                    </section>
                  ) : (
                    <section className="nx-detail-overview nx-detail-overview--event">
                      <div>
                        <span>Tanggal</span>
                        <strong>{formatLongDate(selectedSchedule.dateKey)}</strong>
                      </div>
                      <div>
                        <span>Waktu</span>
                        <strong>{selectedSchedule.startTime} WIB</strong>
                      </div>
                      <div>
                        <span>Kategori</span>
                        <strong>{formatType(selectedSchedule.type)}</strong>
                      </div>
                      <div>
                        <span>Tim</span>
                        <strong>{formatTeam(selectedSchedule.team)}</strong>
                      </div>
                    </section>
                  )}

                  {selectedSchedule.type === "SHOW" &&
                  detailData?.quotaSummary?.hasData ? (
                    <section
                      className="nx-ticket-quota"
                      aria-labelledby="ticket-quota-title"
                    >
                      <div className="nx-block-title">
                        <div>
                          <span>TICKET CAPACITY</span>
                          <h3 id="ticket-quota-title">Kuota tiket</h3>
                        </div>
                        <strong>{detailData.quotaSummary.totalQuota ?? "—"}</strong>
                      </div>

                      <div
                        className={`nx-ticket-quota__grid ${
                          detailData.quotaSummary.hasFcfs ? "has-fcfs" : ""
                        }`}
                      >
                        <article>
                          <span>TOTAL KUOTA</span>
                          <strong>{detailData.quotaSummary.totalQuota ?? "—"}</strong>
                          <small>kapasitas awal</small>
                        </article>
                        <article>
                          <span>OFC</span>
                          <strong>{detailData.quotaSummary.ofcQuota ?? "—"}</strong>
                          <small>fan club</small>
                        </article>
                        <article>
                          <span>GENERAL</span>
                          <strong>{detailData.quotaSummary.generalQuota ?? "—"}</strong>
                          <small>penjualan umum</small>
                        </article>
                        {detailData.quotaSummary.hasFcfs ? (
                          <article className="is-remaining">
                            <span>SISA KUOTA</span>
                            <strong>
                              {detailData.quotaSummary.remainingQuota ?? "—"}
                            </strong>
                            <small>dibuka lewat FCFS</small>
                          </article>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  {selectedSchedule.description ? (
                    <section className="nx-detail-copy">
                      <span>INFORMASI JADWAL</span>
                      <p>{selectedSchedule.description}</p>
                    </section>
                  ) : null}

                  {detailData?.lineup?.length ? (
                    <section className="nx-lineup-block">
                      {favoriteLineup.length ? (
                        <div className="nx-favorite-lineup-note">
                          <span>★ FAVORITMU ADA DI LINEUP</span>
                          <strong>
                            {favoriteLineup.map((member) => member.name).join(", ")}
                          </strong>
                        </div>
                      ) : null}

                      <div className="nx-block-title">
                        <div>
                          <span>PERFORMING MEMBERS</span>
                          <h3>Lineup</h3>
                        </div>
                        <strong>{detailData.lineup.length}</strong>
                      </div>

                      <div className="nx-lineup-grid">
                        {detailData.lineup.map((member, index) => {
                          const favorite = isFavorite(member);

                          return (
                            <div
                              className={favorite ? "is-favorite" : ""}
                              key={member.id}
                            >
                              <span>{String(index + 1).padStart(2, "0")}</span>
                              <p>
                                <strong>{member.name}</strong>
                                <small>{formatTeam(member.type)}</small>
                              </p>
                              <button
                                type="button"
                                className={favorite ? "is-active" : ""}
                                onClick={() => toggleFavorite(member)}
                                aria-label={
                                  favorite
                                    ? `Hapus ${member.name} dari favorit`
                                    : `Tambahkan ${member.name} ke favorit`
                                }
                                aria-pressed={favorite}
                              >
                                ★
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ) : selectedSchedule.type === "SHOW" ? (
                    <div className="nx-empty-lineup">Lineup belum tersedia.</div>
                  ) : null}

                  {detailData?.birthdayMembers?.length ? (
                    <section className="nx-birthday-note">
                      <span>✦ BIRTHDAY SHOW</span>
                      <strong>{detailData.birthdayMembers.join(", ")}</strong>
                    </section>
                  ) : null}

                  {detailData?.salesPeriods?.length ? (
                    <section className="nx-sales-block">
                      <div className="nx-block-title">
                        <div>
                          <span>TICKET SALES</span>
                          <h3>Periode penjualan</h3>
                        </div>
                        <strong>{detailData.salesPeriods.length}</strong>
                      </div>

                      <div className="nx-sales-list">
                        {detailData.salesPeriods.map((period, index) => (
                          <div
                            className="nx-sales-row"
                            key={`${period.label}-${index}`}
                          >
                            <div>
                              <strong>{period.label || `Periode ${index + 1}`}</strong>
                              <span>{period.method || "ONLINE"}</span>
                            </div>
                            <p>
                              {formatSalesDate(period.startDate)}
                              <br />
                              sampai {formatSalesDate(period.endDate)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </>
              )}
            </div>

            <footer className="nx-schedule-sheet__footer">
              <div>
                <span>REFERENCE CODE</span>
                <strong>{selectedSchedule.referenceCode || "Tidak tersedia"}</strong>
              </div>
              {getOfficialJkt48ScheduleUrl(selectedSchedule.link) ? (
                <a
                  href={getOfficialJkt48ScheduleUrl(selectedSchedule.link)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka jadwal resmi
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14 5h5v5M19 5l-9 9" />
                    <path d="M19 13v6H5V5h6" />
                  </svg>
                </a>
              ) : null}
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
