# Development Guide

## Setup awal

```bash
npm install
cp .env.example .env.local
npm run dev
```

Aplikasi default tersedia melalui URL yang ditampilkan Vite. Endpoint `/api/*` ikut aktif melalui plugin local API di `vite.config.js`.

## Struktur kerja

- route composition: `src/pages/`
- feature state/model/view: `src/features/`
- reusable global component: `src/components/`
- shared frontend service: `src/services/`
- shared React hook: `src/hooks/`
- component-scoped CSS: `src/styles/<feature>/`
- serverless handler: `api/`
- shared backend helper: `api/_lib/`
- unit/integration tests: `tests/`
- browser E2E tests: `e2e/`

## Aturan perubahan

### State dan fetch

- Batalkan request lama dengan `AbortController`.
- Gunakan request ID/ref bila beberapa request bisa overlap.
- Jangan membiarkan stale response menimpa state terbaru.
- Effect detail harus bergantung pada ID/code yang stabil, bukan object hasil merge/hydration.
- Bersihkan timer, animation frame, event listener, dan controller pada unmount.

### Data upstream

- Anggap semua field dapat kosong atau berubah bentuk.
- Normalisasi di service/helper, bukan tersebar di JSX.
- Jangan menganggap `null` sebagai `false` bila maknanya “tidak diketahui” dan UI perlu membedakannya.
- Jangan hardcode satu event untuk memperbaiki data upstream tanpa requirement eksplisit.
- HTML upstream harus dibersihkan sebelum ditampilkan.

### Jadwal

- Konversi timezone ke Asia/Jakarta.
- Dedupe memakai identity komposit.
- Jangan memakai tanggal/jam saja sebagai key.
- `SHOW`, `EVENT`, dan `EXCLUSIVE` harus tetap dapat dibedakan.

### CSS

- Gunakan namespace page/component.
- Tambahkan rule ke file komponen yang sesuai, bukan membuat patch global.
- Pertahankan urutan import di `src/styles/index.css`.
- Jangan menambah `!important` tanpa alasan kuat.
- Cari rule lama sebelum menambah patch baru.
- Uji desktop, tablet, mobile, touch, dan reduced motion.

## Testing

Jalankan quality gate tanpa browser:

```bash
npm run check
```

Jalankan E2E desktop dan mobile:

```bash
npx playwright install chromium
npm run test:e2e
```

Jalankan seluruh pemeriksaan release:

```bash
npm run check:full
```

Saat memperbaiki bug:

1. tambahkan test yang gagal dengan kondisi lama;
2. lakukan perubahan;
3. pastikan test baru dan seluruh suite berhasil.

## Manual QA minimal

### Monitor

- Event dapat dipilih.
- Sesi dan member sesuai kategori.
- Search bekerja.
- Error Waiting Room tidak merusak halaman.

### Members

- Filter dan favorit bekerja.
- Detail membuka/menutup dengan mouse, touch, keyboard, dan Escape.
- Membuka detail tidak melakukan fetch tanpa henti.
- Focus kembali ke trigger setelah detail ditutup.

### Schedule

- Pindah bulan/tahun bekerja.
- Dua show pada tanggal/jam sama tetap tampil.
- Filter Event tidak menampilkan Exclusive.
- Detail show dapat dibuka.
- Rich text tidak tampil sebagai HTML mentah.

### Global

- Direct route reload berhasil di deployment.
- Tidak ada horizontal overflow pada 360 px.
- Console bebas uncaught error.
- Offline notice tidak menutupi navigasi.

## Commit hygiene

Jangan commit:

```text
node_modules/
dist/
.vercel/
.env.local
*.log
```

Gunakan nama commit yang menjelaskan area dan tujuan, misalnya:

```text
fix(members): stop repeated detail hydration request
fix(schedule): preserve shows sharing the same time
 docs: add deployment and API reference
```

## Testing terbaru

```bash
npm run test:unit
npm run test:e2e
npm run check
npm run check:full
```

Playwright menjalankan skenario desktop dan mobile. Pada mesin baru, pasang browser terlebih dahulu:

```bash
npx playwright install chromium
```

`npm run check:full` menjalankan validasi project, audit identifier, unit/integration test, production build, lalu E2E.
