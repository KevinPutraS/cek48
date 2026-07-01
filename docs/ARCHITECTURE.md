# Arsitektur CEK48

## Gambaran umum

```text
Browser
  │
  ├─ React + React Router
  │    ├─ /quota
  │    ├─ /members
  │    ├─ /schedule
  │    └─ /info
  │
  └─ /api/*
       ├─ Vite local middleware saat development
       └─ Vercel Serverless Functions saat production
              │
              ├─ Public JKT48 APIs
```

## Frontend

Entry point berada di `src/main.jsx`, lalu merender `src/App.jsx` dalam `React.StrictMode`.

`App.jsx` menangani:

- BrowserRouter;
- lazy loading page;
- global error boundary;
- desktop dan bottom navigation;
- offline notice;
- route fallback dan legacy redirect.

### Halaman

| File                         | Tanggung jawab                                        |
| ---------------------------- | ----------------------------------------------------- |
| `src/pages/MembersPage.jsx`  | Member directory, favorite, birthday, profile detail. |
| `src/pages/SchedulePage.jsx` | Kalender bulanan, filter tipe, detail theater.        |
| `src/pages/InfoPage.jsx`     | Tentang project dan status layanan.                   |

### Service frontend

| File                    | Fungsi                                                   |
| ----------------------- | -------------------------------------------------------- |
| `quotaApi.js`           | Normalisasi event dan stok dari berbagai bentuk payload. |
| `favoriteMembers.js`    | Penyimpanan serta rekonsiliasi favorit.                  |
| `memberBirthdays.js`    | Perhitungan urutan ulang tahun terdekat.                 |
| `memberDirectory.js`    | Normalisasi tipe member dan filter.                      |
| `scheduleVisibility.js` | Aturan jadwal expired/upcoming.                          |
| `theaterQuota.js`       | Ringkasan quota theater dan periode penjualan.           |
| `externalLinks.js`      | Pembentukan URL official profile/social yang aman.       |

## API layer

Endpoint berada di `api/`. Saat development, `vite.config.js` memasang handler tersebut ke Vite middleware sehingga URL lokal sama dengan production.

Shared utilities:

- `api/_lib/jkt48.js` — timeout, JSON parsing, Waiting Room detection, error mapping, cache header.
- `api/_lib/eventCodes.js` — ekstraksi serta validasi kode event.

## Data flow monitor

```text
/api/jkt48-events
  └─ daftar event aktif

/api/jkt48-quota?code=EX...
  └─ detail satu event

/api/jkt48-stocks?codes=EX...,EX...
  ├─ mengambil beberapa event

```

## Data flow member

```text
/api/jkt48-members
  └─ daftar member

/api/jkt48-member-detail?id=...
  └─ detail profile dan birthday

/api/jkt48-image?url=...
  └─ proxy gambar resmi dengan allowlist
```

Favorite disimpan lokal. Birthday dapat dicache di local storage untuk mengurangi request detail.

## Data flow jadwal

```text
/api/jkt48-schedules?month=M&year=Y
  └─ daftar show/event bulanan

/api/jkt48-theater-show?code=SH...
  └─ detail show ketika pengguna membuka modal
```

Deduplikasi frontend harus menggunakan identity komposit. `reference_code` yang sama dapat muncul pada tanggal berbeda, sementara dua show berbeda dapat memiliki tanggal dan jam yang sama.

## State dan concurrency

Pattern yang dipakai:

- `AbortController` untuk membatalkan request lama;
- request ID/ref untuk mencegah stale response;
- `useMemo` untuk derived data;
- identity stabil untuk effect detail;
- local storage untuk preference non-sensitif.

Hindari dependency effect berupa object yang terus diganti setelah hydration, karena dapat memicu fetch loop.

## Styling

CSS dibagi berdasarkan tanggung jawab dan komponen. File lintas halaman tetap berada langsung di `src/styles/`, sedangkan stylesheet fitur berada dalam subfolder:

```text
src/styles/
├─ base.css
├─ shell.css
├─ info.css
├─ responsive.css
├─ performance.css
├─ monitor/
│  ├─ controls.css
│  ├─ results.css
│  ├─ components.css
│  └─ responsive.css
├─ members/
│  ├─ directory.css
│  ├─ profile.css
│  ├─ stability.css
│  └─ birthdays.css
└─ schedule/
   ├─ hero.css
   ├─ controls.css
   ├─ states.css
   ├─ next-event.css
   ├─ timeline.css
   ├─ detail.css
   ├─ ticket-quota.css
   └─ responsive.css
```

`src/styles/index.css` adalah satu-satunya entry stylesheet. Urutan import dipertahankan agar cascade dan responsive override tetap konsisten. Selector baru harus menggunakan namespace page/component agar tidak bocor ke halaman lain.

## Feature modules

Route page menjadi composition root yang tipis. State, fetch orchestration, model, dan view ditempatkan di feature module masing-masing:

```text
src/features/
├─ quota/
│  ├─ quotaModel.js
│  ├─ useQuotaMonitor.js
│  ├─ QuotaPageSections.jsx
│  ├─ QuotaComponents.jsx
│  └─ QuotaFilters.jsx
├─ members/
│  ├─ memberModel.js
│  ├─ useMembersDirectory.js
│  ├─ MembersPageView.jsx
│  └─ MemberProfileParts.jsx
└─ schedule/
   ├─ scheduleModel.js
   ├─ useSchedulePage.js
   ├─ SchedulePageView.jsx
   └─ ScheduleControls.jsx
```

Batas tanggung jawab:

- `src/pages/` hanya merangkai hook dan view serta mempertahankan route publik.
- `use*.js` menangani state, side effect, request lifecycle, dan action handler.
- `*Model.js` menangani normalisasi, formatter, identity, serta pure helper.
- `*View.jsx` dan komponen terkait menangani render tanpa mengambil data sendiri.

Regression test menjaga setiap route page tetap di bawah 90 baris dan mencegah ketergantungan silang yang tidak disengaja.
