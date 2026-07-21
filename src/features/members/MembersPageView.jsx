import TopBar from "../../components/TopBar";
import LiveRadar from "./LiveRadar";
import {
  ALL_TYPES,
  formatBirthday,
  formatHeight,
  formatMemberType,
  formatUpdatedTime,
  getMemberIdentity,
  getTeamAccent,
  hasMemberId,
} from "./memberModel";
import { MemberPhoto, ProfileStat } from "./MemberProfileParts";

export default function MembersPageView({ directory, liveMembers, isLoading }) {
  const {
    birthdaySync,
    changeType,
    closeMember,
    detailError,
    detailLoading,
    directoryTab,
    emptyStateCopy,
    error,
    filteredMembers,
    hasActiveFilters,
    isFavorite,
    lastUpdated,
    loadMemberDetail,
    loadMembers,
    loading,
    memberDetail,
    members,
    officialProfileUrl,
    openMember,
    profileCloseRef,
    profileMember,
    profileSheetRef,
    profileSocialLinks,
    resetDirectory,
    search,
    selectedMemberBirthdayCacheKey,
    selectedMemberId,
    selectedType,
    selectedTypeLabel,
    setDirectoryTab,
    setSearch,
    teamSummary,
    toggleFavorite,
    typeOptions,
    upcomingBirthdays,
    validFavoriteCount,
  } = directory;
  return (
    <div className="app-shell">
      <TopBar
        sectionLabel="MEMBER"
        sectionDescription="Direktori member JKT48"
        showControls={false}
      />

      <main id="main-content" className="nx-page nx-members-page">

        {/* --- LOGIKA LOADING RADAR --- */}
        {isLoading ? (
          <div className="radar-skeleton">Memindai sinyal live...</div> 
        ) : (
          <LiveRadar data={liveMembers} />
        )}

        <section className="nx-members-hero nx-members-hero--redesign">
          <div className="nx-members-hero__copy">
            <span className="nx-kicker">MEMBER UNIVERSE</span>
            <h1>Temukan member favoritmu dalam sekali lihat.</h1>
            <p>
              Cari berdasarkan nama, nickname, atau tim. Simpan favorit agar member yang
              penting selalu muncul lebih dulu.
            </p>

            <div
              className="nx-members-hero__signals"
              role="list"
              aria-label="Keunggulan direktori"
            >
              <span role="listitem">
                <i aria-hidden="true" />
                Data publik JKT48
              </span>
              <span role="listitem">
                <i aria-hidden="true" />
                Favorit personal
              </span>
              <span role="listitem">
                <i aria-hidden="true" />
                Mobile first
              </span>
            </div>
          </div>

          <div
            className="nx-members-overview"
            role="list"
            aria-label="Ringkasan direktori member"
          >
            <article className="is-primary" role="listitem">
              <span>MEMBER TERDATA</span>
              <strong>{members.length || "—"}</strong>
              <small>profil aktif</small>
            </article>
            <article role="listitem">
              <span>TIM</span>
              <strong>{teamSummary.size || "—"}</strong>
              <small>kategori tersedia</small>
            </article>
            <article role="listitem">
              <span>FAVORIT</span>
              <strong>{validFavoriteCount}</strong>
              <small>tersimpan</small>
            </article>
          </div>

          <div className="nx-members-hero__glow" aria-hidden="true" />
          <div className="nx-members-hero__grid" aria-hidden="true" />
        </section>

        <section
          className="nx-member-command"
          aria-label="Pencarian dan filter member"
          aria-busy={loading}
        >
          <div className="nx-member-command__main">
            <fieldset
              className="nx-directory-switch"
              aria-label="Mode direktori member"
            >
              <button
                type="button"
                aria-pressed={directoryTab === "all"}
                className={directoryTab === "all" ? "is-active" : ""}
                onClick={() => setDirectoryTab("all")}
              >
                <span>Semua</span>
                <b>{members.length}</b>
              </button>
              <button
                type="button"
                aria-pressed={directoryTab === "favorites"}
                className={directoryTab === "favorites" ? "is-active" : ""}
                onClick={() => setDirectoryTab("favorites")}
              >
                <span>Favorit</span>
                <b>{validFavoriteCount}</b>
              </button>
            </fieldset>

            <label className="nx-member-search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <span className="sr-only">Cari member</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, nickname, atau kode..."
                autoComplete="off"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Hapus pencarian"
                >
                  ×
                </button>
              ) : null}
            </label>

            <button
              type="button"
              className="nx-member-refresh"
              onClick={loadMembers}
              disabled={loading}
              aria-label={
                loading ? "Sedang memperbarui member" : "Perbarui data member"
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 6v5h-5" />
                <path d="M4 18v-5h5" />
                <path d="M18.4 9A7 7 0 0 0 6 6.6L4 9M5.6 15A7 7 0 0 0 18 17.4L20 15" />
              </svg>
              <span>{loading ? "Memuat" : "Refresh"}</span>
            </button>
          </div>

          <div className="nx-member-command__teams">
            <div className="nx-member-command__label">
              <span>FILTER TIM</span>
              <small>{selectedTypeLabel}</small>
            </div>

            <fieldset className="nx-team-scroll" aria-label="Filter tim member">
              {typeOptions.map((type) => {
                const active = selectedType === type;
                const count =
                  type === ALL_TYPES ? members.length : teamSummary.get(type) || 0;

                return (
                  <button
                    type="button"
                    aria-pressed={active}
                    className={active ? "is-active" : ""}
                    key={type}
                    onClick={() => changeType(type)}
                    style={{ "--chip-accent": getTeamAccent(type) }}
                  >
                    <i aria-hidden="true" />
                    <span>
                      {type === ALL_TYPES ? "Semua tim" : formatMemberType(type)}
                    </span>
                    <b>{count}</b>
                  </button>
                );
              })}
            </fieldset>
          </div>
        </section>

        <section
          className="nx-birthday-tracker"
          aria-labelledby="birthday-tracker-title"
        >
          <header className="nx-birthday-tracker__head">
            <div>
              <span>BIRTHDAY RADAR</span>
              <h2 id="birthday-tracker-title">Ulang tahun terdekat</h2>
              <p>Diurutkan otomatis dari tanggal paling dekat sampai paling jauh.</p>
            </div>
            <strong>
              {birthdaySync.loading
                ? `${upcomingBirthdays.length} ditemukan · ${birthdaySync.completed}/${birthdaySync.total} disinkronkan`
                : `${upcomingBirthdays.length} member terlacak`}
            </strong>
          </header>

          {upcomingBirthdays.length ? (
            <div className="nx-birthday-track" aria-label="Urutan ulang tahun member">
              {upcomingBirthdays.map((entry, index) => {
                const member = entry.member;
                const favorite = isFavorite(member);
                const monthLabel = new Intl.DateTimeFormat("id-ID", {
                  month: "short",
                  timeZone: "UTC",
                }).format(entry.nextBirthday);

                return (
                  <button
                    type="button"
                    className={`nx-birthday-card ${index === 0 ? "is-next" : ""} ${
                      entry.daysUntil === 0 ? "is-today" : ""
                    } ${favorite ? "is-favorite" : ""}`}
                    key={getMemberIdentity(member)}
                    onClick={() => openMember(member)}
                    style={{ "--birthday-accent": getTeamAccent(member.type) }}
                    aria-label={`Buka profil ${member.name}, ulang tahun ${entry.daysUntil === 0 ? "hari ini" : `${entry.daysUntil} hari lagi`}`}
                  >
                    <span className="nx-birthday-card__date" aria-hidden="true">
                      <strong>{String(entry.day).padStart(2, "0")}</strong>
                      <small>{monthLabel}</small>
                    </span>
                    <span className="nx-birthday-card__copy">
                      <small>
                        {entry.daysUntil === 0
                          ? "HARI INI"
                          : index === 0
                            ? "PALING DEKAT"
                            : `${entry.daysUntil} HARI LAGI`}
                      </small>
                      <strong>{member.name}</strong>
                      <i>{formatMemberType(member.type)}</i>
                    </span>
                    <span className="nx-birthday-card__count">
                      {favorite ? <b aria-label="Member favorit">★</b> : null}
                      <strong>{entry.daysUntil}</strong>
                      <small>hari</small>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="nx-birthday-tracker__empty" role="status">
              {birthdaySync.loading
                ? `Sedang menyinkronkan tanggal lahir member (${birthdaySync.completed}/${birthdaySync.total})...`
                : birthdaySync.failed > 0
                  ? "Tanggal lahir belum berhasil dimuat. Tekan Refresh untuk mencoba lagi."
                  : "Data tanggal lahir belum tersedia dari sumber member."}
            </div>
          )}
        </section>

        <section className="nx-member-results" aria-live="polite">
          <div>
            <span>
              {directoryTab === "favorites" ? "FAVORITE DIRECTORY" : "MEMBER DIRECTORY"}
            </span>
            <h2>
              {filteredMembers.length} member
              {search.trim() ? ` untuk “${search.trim()}”` : " ditemukan"}
            </h2>
          </div>

          <div className="nx-member-results__meta">
            <span>{selectedTypeLabel}</span>
            <span>{formatUpdatedTime(lastUpdated)}</span>
            {hasActiveFilters ? (
              <button type="button" onClick={resetDirectory}>
                Reset filter
              </button>
            ) : null}
          </div>
        </section>

        {loading && members.length === 0 ? (
          <section
            className="nx-member-grid"
            aria-label="Memuat data member"
            aria-busy="true"
          >
            {Array.from({ length: 10 }, (_, index) => (
              <div className="nx-member-card nx-member-card--skeleton" key={index} />
            ))}
          </section>
        ) : error && members.length === 0 ? (
          <section className="nx-state-card nx-state-card--error">
            <span>!</span>
            <strong>Data member gagal dimuat</strong>
            <p>{error}</p>
            <button type="button" onClick={loadMembers} disabled={loading}>
              {loading ? "Memuat..." : "Coba lagi"}
            </button>
          </section>
        ) : filteredMembers.length ? (
          <section className="nx-member-grid" aria-label="Daftar member JKT48">
            {filteredMembers.map((member) => {
              const favorite = isFavorite(member);
              const memberCode =
                member.code ||
                (hasMemberId(member) ? `ID ${member.id}` : "Profil member");

              return (
                <article
                  className={`nx-member-card ${favorite ? "is-favorite" : ""}`}
                  key={getMemberIdentity(member)}
                  style={{ "--member-accent": getTeamAccent(member.type) }}
                >
                  <button
                    type="button"
                    className="nx-member-card__open"
                    onClick={() => openMember(member)}
                    aria-label={`Buka profil ${member.name}`}
                  >
                    <div className="nx-member-card__visual">
                      <MemberPhoto member={member} />
                      <div className="nx-member-card__shade" aria-hidden="true" />

                      <span className="nx-member-card__team">
                        <i aria-hidden="true" />
                        {formatMemberType(member.type)}
                      </span>

                      {favorite ? (
                        <span className="nx-member-card__saved">
                          <span aria-hidden="true">★</span> Favorit
                        </span>
                      ) : null}
                    </div>

                    <div className="nx-member-card__copy">
                      <div>
                        <strong title={member.name}>{member.name}</strong>
                        <span>{member.nickname || "JKT48 Member"}</span>
                      </div>
                      <footer>
                        <small>{memberCode}</small>
                        <span>
                          Lihat profil <i aria-hidden="true">↗</i>
                        </span>
                      </footer>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`nx-member-favorite ${favorite ? "is-active" : ""}`}
                    onClick={(event) => toggleFavorite(member, event)}
                    aria-pressed={favorite}
                    aria-label={
                      favorite
                        ? `Hapus ${member.name} dari favorit`
                        : `Tambahkan ${member.name} ke favorit`
                    }
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />
                    </svg>
                  </button>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="nx-state-card nx-member-empty">
            <span>⌕</span>
            <strong>Member tidak ditemukan</strong>
            <p>{emptyStateCopy}</p>
            <button type="button" onClick={resetDirectory}>
              Reset semua filter
            </button>
          </section>
        )}

        {error && members.length > 0 ? (
          <section className="nx-member-update-warning" role="status">
            <div>
              <span aria-hidden="true">!</span>
              <p>
                <strong>Pembaruan data gagal.</strong> {error}
              </p>
            </div>
            <button type="button" onClick={loadMembers} disabled={loading}>
              {loading ? "Memuat..." : "Coba lagi"}
            </button>
          </section>
        ) : null}
      </main>

      {profileMember ? (
        <div
          className="nx-profile-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMember();
          }}
        >
          <section
            ref={profileSheetRef}
            className="nx-profile-sheet nx-profile-sheet--redesign"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nx-profile-title"
            aria-describedby="nx-profile-description"
            tabIndex={-1}
            style={{ "--member-accent": getTeamAccent(profileMember.type) }}
          >
            <div className="nx-profile-handle" aria-hidden="true" />

            <button
              ref={profileCloseRef}
              className="nx-profile-close"
              type="button"
              onClick={closeMember}
              aria-label="Tutup profil"
            >
              ×
            </button>

            <div className="nx-profile-visual">
              <div className="nx-profile-orbit" aria-hidden="true" />
              <MemberPhoto member={profileMember} hero />
              <div className="nx-profile-visual__shade" aria-hidden="true" />

              <div className="nx-profile-visual__identity">
                <span>
                  <i aria-hidden="true" />
                  {formatMemberType(profileMember.type)}
                </span>
                <strong>{profileMember.nickname || profileMember.name}</strong>
                <small>{profileMember.code || "JKT48 MEMBER"}</small>
              </div>
            </div>

            <div className="nx-profile-content">
              <header className="nx-profile-heading">
                <div>
                  <span className="nx-kicker">MEMBER PROFILE</span>
                  <h2 id="nx-profile-title">{profileMember.name}</h2>
                  <p id="nx-profile-description">
                    {profileMember.nickname
                      ? `Dikenal sebagai ${profileMember.nickname}`
                      : `${formatMemberType(profileMember.type)} · JKT48`}
                  </p>
                </div>

                <div className="nx-profile-heading__code">
                  <span>MEMBER CODE</span>
                  <strong>{profileMember.code || "—"}</strong>
                  <small>
                    ID {hasMemberId(profileMember) ? profileMember.id : "—"}
                  </small>
                </div>
              </header>

              <div
                className={`nx-profile-detail-state ${detailLoading ? "is-loading" : detailError ? "is-error" : memberDetail ? "is-ready" : "is-idle"}`}
                role="status"
                aria-live="polite"
              >
                <span aria-hidden="true">
                  {detailLoading ? "↻" : detailError ? "!" : memberDetail ? "✓" : "i"}
                </span>
                <div>
                  <strong>
                    {detailLoading
                      ? "Mengambil biodata terbaru"
                      : detailError
                        ? "Biodata lengkap belum tersedia"
                        : memberDetail
                          ? "Biodata detail berhasil dimuat"
                          : "Detail member belum tersedia"}
                  </strong>
                  <small>
                    {detailLoading
                      ? "Profil dasar tetap dapat dilihat sambil menunggu."
                      : detailError
                        ? detailError
                        : memberDetail
                          ? "Sumber: endpoint detail member JKT48."
                          : "ID member tidak tersedia untuk mengambil biodata lengkap."}
                  </small>
                </div>
                {detailError ? (
                  <button
                    type="button"
                    onClick={() =>
                      loadMemberDetail(selectedMemberId, selectedMemberBirthdayCacheKey)
                    }
                    disabled={detailLoading}
                  >
                    Coba lagi
                  </button>
                ) : null}
              </div>

              <section className="nx-profile-facts" aria-label="Biodata member">
                <ProfileStat
                  label="Tanggal lahir"
                  value={formatBirthday(profileMember.birthday)}
                />
                <ProfileStat label="Horoskop" value={profileMember.horoscope} />
                <ProfileStat
                  label="Tinggi"
                  value={formatHeight(profileMember.height)}
                />
                <ProfileStat label="Golongan darah" value={profileMember.bloodType} />
                {profileMember.birthPlace ? (
                  <ProfileStat label="Tempat lahir" value={profileMember.birthPlace} />
                ) : null}
              </section>

              {profileSocialLinks.length ? (
                <section
                  className="nx-profile-socials"
                  aria-labelledby="nx-profile-social-title"
                >
                  <div>
                    <span>OFFICIAL ACCOUNTS</span>
                    <strong id="nx-profile-social-title">
                      Terhubung dengan {profileMember.nickname || profileMember.name}
                    </strong>
                  </div>
                  <nav>
                    {profileSocialLinks.map((social) => (
                      <a
                        key={social.id}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{social.label}</span>
                        <small>{social.account}</small>
                        <i aria-hidden="true">↗</i>
                      </a>
                    ))}
                  </nav>
                </section>
              ) : null}

              <section className="nx-profile-note">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
                <p>
                  Biodata lengkap dimuat ketika profil dibuka. Informasi berasal dari
                  layanan publik JKT48 dan dapat berubah sewaktu-waktu.
                </p>
              </section>

              <div className="nx-profile-actions">
                <button
                  type="button"
                  className={`nx-profile-favorite ${isFavorite(profileMember) ? "is-active" : ""}`}
                  onClick={(event) => toggleFavorite(profileMember, event)}
                  aria-pressed={isFavorite(profileMember)}
                >
                  <span aria-hidden="true">★</span>
                  {isFavorite(profileMember)
                    ? "Tersimpan di favorit"
                    : "Tambahkan ke favorit"}
                </button>

                {officialProfileUrl ? (
                  <a
                    href={officialProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nx-profile-official"
                  >
                    Profil resmi <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
