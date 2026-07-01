# Changelog

Semua perubahan penting pada CEK48 dicatat di file ini.

Format mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) dan versi project mengikuti Semantic Versioning sebisa mungkin.

## [Unreleased]

### Planned

- Dokumentasikan setiap perubahan parser atau kontrak API.
- Tambahkan regression test untuk setiap bug produksi yang berhasil direproduksi.
- Pertahankan sinkronisasi nomor versi antara `package.json`, halaman Info, dan endpoint health.

## [5.4.0] — 2026-06-25

### Changed

- Menjadikan `QuotaPage`, `MembersPage`, dan `SchedulePage` sebagai composition root yang tipis.
- Memindahkan state, fetch orchestration, model, dan tampilan ke feature module masing-masing di `src/features/`.
- Memecah stylesheet Monitor, Member, dan Jadwal berdasarkan komponen dan tanggung jawab.
- Menyamakan nomor versi aplikasi menjadi 5.4.0 pada UI, metadata, dan health endpoint.

### Added

- ESLint flat config dengan aturan React Hooks, React Refresh, dan larangan warning pada CI.
- Prettier beserta pemeriksaan format otomatis.
- GitHub Actions terpisah untuk quality gate dan Playwright E2E.
- Playwright E2E desktop dan mobile untuk alur utama Monitor, Member, dan Jadwal.
- Regression test untuk menjaga route page tetap kecil dan CSS tetap terisolasi.
- Panduan upgrade 5.4.0 di `docs/UPGRADE-5.4.0-MAINTAINABILITY.md`.

### Validation

- 57 unit/integration test.
- Lint dan format check.
- Production build.
- 10 skenario Playwright terdaftar: 5 alur pada desktop dan 5 alur pada mobile.

## [5.3.0] — 2026

### Added

- Performance tracker dan styling optimasi untuk perangkat mobile.
- Direktori member dengan pencarian, filter tim, favorit, detail profil, dan birthday tracker.
- Halaman jadwal bulanan dengan show, event, detail theater, lineup, poster setlist, dan ringkasan kuota.
- Automated tests untuk parser, favorit, member directory, birthday, schedule visibility, theater quota, layout, dan API resilience.

### Security

- Validasi kode event, ID member, kode show, bulan, tahun, pagination, dan URL gambar.
- Timeout, batas ukuran respons, sanitasi pesan error, serta deteksi Waiting Room JKT48.
- Header keamanan dasar pada deployment Vercel.
- Service role key dibatasi untuk server-side dan database menggunakan RLS.

### Notes

## 5.3.0 Stability Hardening — 25 Juni 2026

### Data integrity

- Menambahkan migration aman untuk database lama.
- Menjadikan tanggal event bagian dari unique key agar slot Video Call pada tanggal berbeda tidak saling menimpa.

### Maintainability

- Memecah logic dan komponen besar dari `QuotaPage`, `MembersPage`, dan `SchedulePage` ke folder `src/features/`.
- Mengurangi ukuran ketiga file page tanpa mengubah UI, API, parser, favorit, atau behavior utama.

### Testing

- Menambahkan Playwright E2E untuk desktop dan mobile.
- Mencakup detail member agar tidak fetch berulang, filter Event, dua show pada waktu yang sama, dan sanitasi HTML jadwal.
- Menambahkan GitHub Actions untuk menjalankan unit test, build, serta E2E.
