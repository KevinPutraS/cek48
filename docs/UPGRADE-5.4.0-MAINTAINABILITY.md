# Upgrade ke CEK48 5.4.0 — Maintainability

Versi ini berfokus pada struktur kode, quality gate, dan regression testing. Kontrak route publik, endpoint, parser utama, sistem favorit, dan behavior aplikasi tetap dipertahankan.

## Ringkasan perubahan

### Route page menjadi composition root

```text
src/pages/
├─ QuotaPage.jsx
├─ MembersPage.jsx
└─ SchedulePage.jsx
```

Ketiga file tersebut hanya merangkai hook dan view. State, request orchestration, model, serta komponen UI berada di:

```text
src/features/
├─ quota/
├─ members/
└─ schedule/
```

### CSS berbasis komponen

Stylesheet halaman besar telah dipisah menjadi file yang lebih kecil:

```text
src/styles/
├─ monitor/
├─ members/
└─ schedule/
```

Urutan import tetap dikontrol oleh `src/styles/index.css`. Jangan mengubah urutannya tanpa memeriksa cascade dan responsive override.

### Quality tools

Perintah utama:

```bash
npm run lint
npm run format:check
npm run test:unit
npm run build
npm run test:e2e
npm run check
npm run check:full
```

- `npm run check` menjalankan validasi struktur, audit identifier, lint, format check, unit/integration test, dan build.
- `npm run check:full` menambahkan Playwright E2E.

Pada mesin baru, pasang browser Playwright sekali:

```bash
npx playwright install chromium
```

## Upgrade lokal

Gunakan Node.js 20 atau lebih baru, lalu jalankan:

```bash
npm install
npx playwright install chromium
npm run check
npm run test:e2e
```

File `.env.local` dari versi sebelumnya dapat dipakai kembali. Jangan menimpa atau memasukkannya ke Git.

## GitHub Actions

Workflow `.github/workflows/ci.yml` memiliki dua job:

1. **Lint, Test, Build** — quality gate tanpa browser.
2. **Playwright E2E** — menjalankan Chromium serta mengunggah report saat gagal.

Push atau pull request dinyatakan aman hanya setelah kedua job lulus.

## Regression coverage utama

Playwright memeriksa:

- Monitor dapat memuat event, menampilkan quota, mencari member, dan mengubah favorit.
- Detail member tidak melakukan request berulang.
- Filter Event tidak memasukkan Show atau Exclusive.
- Dua show pada tanggal dan jam yang sama tetap tampil.
- HTML deskripsi event dibersihkan sebelum dirender.

## Catatan kompatibilitas

- Tidak ada migration database baru khusus 5.4.0.
- Route dan endpoint tidak berubah.
- Deploy Vercel tetap menggunakan konfigurasi sebelumnya.
