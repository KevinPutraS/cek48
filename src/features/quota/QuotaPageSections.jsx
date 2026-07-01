import { ChevronIcon, SearchIcon, TerminalIcon } from "../../components/Icons";
import { MemberGrid, SessionTabs, SummaryCard } from "./QuotaComponents";
import { CustomDropdown } from "./QuotaFilters";
import { DEFAULT_DATE, SORT_OPTIONS, STATUS_OPTIONS } from "./quotaModel";

export function QuotaControls({ monitor }) {
  const {
    categoryOptions,
    controlsDisabled,
    dateFilter,
    dateScopedItems,
    dateTabOptions,
    eventScopedItems,
    exclusiveEvents,
    favoriteCount,
    favoriteEventCount,
    favoritesOnly,
    filteredEventOptions,
    handleCategoryChange,
    handleDateChange,
    handleEventChange,
    isRefreshing,
    isVideoCallEvent,
    mobileFiltersOpen,
    resetResultFilters,
    search,
    selectedCategory,
    selectedCode,
    selectedEvent,
    sessionFilter,
    sessionTabOptions,
    setFavoritesOnly,
    setMobileFiltersOpen,
    setSearch,
    setSessionFilter,
    setSort,
    setStatusFilter,
    sort,
    statusFilter,
  } = monitor;

  return (
    <section className="query-control" aria-label="Query control">
      <nav className="category-tabs" aria-label="Kategori event">
        {categoryOptions.length ? (
          categoryOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`category-tab ${selectedCategory === option.value ? "is-active" : ""}`}
              onClick={() => handleCategoryChange(option.value)}
              disabled={isRefreshing && !exclusiveEvents.length}
              aria-pressed={selectedCategory === option.value}
            >
              <span>{option.label}</span>
              <strong>{option.count}</strong>
            </button>
          ))
        ) : (
          <span className="category-loading">Memuat kategori event...</span>
        )}
      </nav>

      <section className="desktop-control-panel" aria-label="Kontrol pencarian desktop">
        <CustomDropdown
          label="Event"
          value={selectedCode}
          placeholder={
            selectedCategory
              ? "Pilih event yang ingin dicek"
              : "Pilih kategori terlebih dahulu"
          }
          options={filteredEventOptions}
          onChange={handleEventChange}
          disabled={!selectedCategory || !filteredEventOptions.length}
        />

        <label
          className={`field compact-search-field ${!selectedEvent ? "field-disabled" : ""}`}
        >
          <span>Cari member</span>
          <span className="search-wrap">
            <SearchIcon />
            <input
              type="search"
              placeholder="Nama, nickname, team, atau jalur..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={!selectedEvent}
            />
            <kbd>/</kbd>
          </span>
        </label>

        <CustomDropdown
          label="Status"
          value={statusFilter}
          placeholder="Semua status"
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
          disabled={controlsDisabled}
        />

        <CustomDropdown
          label="Urutkan"
          value={sort}
          placeholder="Pilih urutan"
          options={SORT_OPTIONS}
          onChange={setSort}
          disabled={controlsDisabled}
        />

        <button
          type="button"
          className={`favorite-filter-button ${favoritesOnly ? "is-active" : ""}`}
          onClick={() => setFavoritesOnly((current) => !current)}
          disabled={!selectedEvent || favoriteCount === 0}
          aria-pressed={favoritesOnly}
        >
          <span>★</span>
          <span>
            <strong>FAVORIT</strong>
            <small>{favoriteEventCount} di event</small>
          </span>
        </button>

        <button
          className="reset-button desktop-reset-button"
          type="button"
          onClick={() => resetResultFilters(false)}
          disabled={!selectedEvent}
        >
          RESET
        </button>
      </section>

      <section className="mobile-controls" aria-label="Kontrol pencarian mobile">
        <CustomDropdown
          label="Event"
          value={selectedCode}
          placeholder={
            selectedCategory
              ? "Pilih event yang ingin dicek"
              : "Pilih kategori terlebih dahulu"
          }
          options={filteredEventOptions}
          onChange={handleEventChange}
          disabled={!selectedCategory || !filteredEventOptions.length}
        />

        <div className="mobile-search-row">
          <label
            className={`field mobile-search-field ${!selectedEvent ? "field-disabled" : ""}`}
          >
            <span>Cari member</span>
            <span className="search-wrap">
              <SearchIcon />
              <input
                type="search"
                placeholder="Cari member..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={!selectedEvent}
              />
            </span>
          </label>

          <button
            type="button"
            className={`mobile-filter-toggle ${mobileFiltersOpen ? "is-open" : ""}`}
            onClick={() => setMobileFiltersOpen((current) => !current)}
            aria-expanded={mobileFiltersOpen}
            disabled={!selectedEvent}
          >
            <span>FILTER</span>
            <ChevronIcon />
          </button>
        </div>

        {mobileFiltersOpen && selectedEvent ? (
          <div className="mobile-filter-secondary">
            <CustomDropdown
              label="Status"
              value={statusFilter}
              placeholder="Pilih status"
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
              disabled={controlsDisabled}
            />

            <CustomDropdown
              label="Urutkan"
              value={sort}
              placeholder="Pilih urutan"
              options={SORT_OPTIONS}
              onChange={setSort}
              disabled={controlsDisabled}
            />

            <button
              type="button"
              className={`favorite-filter-button mobile-favorite-filter ${favoritesOnly ? "is-active" : ""}`}
              onClick={() => setFavoritesOnly((current) => !current)}
              disabled={favoriteCount === 0}
              aria-pressed={favoritesOnly}
            >
              <span>★</span>
              <span>
                <strong>FAVORIT SAJA</strong>
                <small>{favoriteEventCount} di event</small>
              </span>
            </button>

            <button
              className="reset-button mobile-reset-button"
              type="button"
              onClick={() => resetResultFilters(true)}
              disabled={!selectedEvent}
            >
              RESET FILTER
            </button>
          </div>
        ) : null}
      </section>

      {selectedEvent ? (
        <div className="slot-control-stack">
          {isVideoCallEvent && dateTabOptions.length ? (
            <SessionTabs
              options={dateTabOptions}
              value={dateFilter}
              onChange={handleDateChange}
              disabled={isRefreshing && !eventScopedItems.length}
              eyebrow="TANGGAL"
              ariaLabel="Daftar tanggal Video Call"
              variant="date"
            />
          ) : null}

          <SessionTabs
            options={sessionTabOptions}
            value={sessionFilter}
            onChange={setSessionFilter}
            disabled={isRefreshing && !dateScopedItems.length}
            eyebrow="SESI"
            ariaLabel="Daftar sesi untuk tanggal terpilih"
          />
        </div>
      ) : null}
    </section>
  );
}

export function QuotaSummary({ monitor }) {
  const { selectedEvent, summary, summaryItems } = monitor;
  if (!selectedEvent) return null;

  return (
    <section className="summary-grid" aria-label="Ringkasan kuota">
      <SummaryCard
        label="Total slot"
        value={summaryItems.length}
        suffix={summary.total ? `${summary.total} kapasitas tiket` : "data event aktif"}
        tone="primary"
      />
      <SummaryCard
        label="Tersedia"
        value={summary.available}
        suffix="slot aman"
        tone="available"
      />
      <SummaryCard
        label="Hampir habis"
        value={summary.low}
        suffix="perlu dipantau"
        tone="warning"
      />
      <SummaryCard
        label="Full slot"
        value={summary.sold}
        suffix={`${summary.unknown} belum terbaca`}
        tone="danger"
      />
    </section>
  );
}

export function QuotaDataPanel({ monitor }) {
  const {
    apiNotice,
    error,
    exclusiveEvents,
    favoriteEventCount,
    favoritesOnly,
    filteredEventOptions,
    filteredItems,
    isFavorite,
    isRefreshing,
    isVideoCallEvent,
    items,
    loadInitialData,
    loadSelectedEventStock,
    selectedCategory,
    selectedCode,
    selectedEvent,
    dateFilter,
    toggleFavorite,
  } = monitor;

  return (
    <section className="data-panel">
      <div className="data-panel-head">
        <div>
          <p>{selectedCode ? "DAFTAR MEMBER" : "MONITOR KUOTA"}</p>
          <h2>
            {selectedEvent
              ? favoritesOnly
                ? "Kuota member favorit pada sesi ini"
                : "Kuota member pada sesi ini"
              : "Pilih kategori dan event untuk melihat kuota"}
          </h2>
        </div>
        <div className="data-panel-actions">
          <span className="result-count">
            {selectedEvent
              ? `${filteredItems.length} RECORDS · ${favoriteEventCount} FAVORIT`
              : "WAITING"}
          </span>
        </div>
      </div>

      {apiNotice && items.length > 0 ? (
        <div className="inline-api-notice">
          <strong>SYNC NOTICE</strong>
          <span>{apiNotice}</span>
        </div>
      ) : null}

      {isRefreshing && !exclusiveEvents.length ? (
        <div className="loading-stack">
          {[1, 2, 3, 4].map((number) => (
            <div className="skeleton-row" key={number} />
          ))}
        </div>
      ) : error && !exclusiveEvents.length ? (
        <div className="empty-state error-state">
          <strong>EVENT LIST ERROR</strong>
          <p>{error}</p>
          <button type="button" onClick={() => loadInitialData(true)}>
            COBA LAGI
          </button>
        </div>
      ) : !selectedCategory ? (
        <div className="selection-empty-state">
          <span className="selection-empty-icon">
            <TerminalIcon size={24} />
          </span>
          <strong>PILIH KATEGORI EVENT</strong>
          <p>Pilih Video Call, Meet &amp; Greet, atau 2-Shot di bagian atas.</p>
        </div>
      ) : !selectedCode ? (
        <div className="selection-empty-state">
          <span className="selection-empty-icon">
            <SearchIcon size={24} />
          </span>
          <strong>
            {filteredEventOptions.length ? "PILIH EVENT" : "BELUM ADA EVENT AKTIF"}
          </strong>
          <p>
            {filteredEventOptions.length
              ? "Pilih salah satu event aktif untuk mengambil data kuota."
              : "Kategori ini tetap tersedia, tetapi semua eventnya sudah selesai atau belum tersedia."}
          </p>
        </div>
      ) : error ? (
        <div className="empty-state error-state">
          <strong>SYNC ERROR</strong>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadSelectedEventStock(selectedEvent, false)}
          >
            COBA LAGI
          </button>
        </div>
      ) : isRefreshing && items.length === 0 ? (
        <div className="loading-stack">
          {[1, 2, 3, 4].map((number) => (
            <div className="skeleton-row" key={number} />
          ))}
        </div>
      ) : apiNotice && items.length === 0 ? (
        <div className="empty-state notice-state">
          <strong>STOCK ENDPOINT READ WARNING</strong>
          <p>{apiNotice}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <strong>
            {favoritesOnly ? "FAVORIT BELUM ADA DI EVENT" : "NO MATCHING RECORD"}
          </strong>
          <p>
            {favoritesOnly
              ? "Member favorit kamu belum tersedia pada event atau sesi ini."
              : "Tidak ada data yang cocok dengan filter kamu."}
          </p>
        </div>
      ) : (
        <MemberGrid
          items={filteredItems}
          showDate={isVideoCallEvent && dateFilter === DEFAULT_DATE}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </section>
  );
}
