# CEK48

CEK48 adalah dashboard independen untuk merangkum informasi publik JKT48 dalam tampilan yang lebih ringkas, cepat, dan nyaman digunakan di desktop maupun perangkat mobile.

Versi project saat ini: **5.4.0 — Maintainability**.

> CEK48 bukan aplikasi resmi JKT48. Kuota, jadwal, harga, lineup, dan informasi pembelian tetap perlu dikonfirmasi melalui kanal resmi JKT48.

## Fitur utama

- **Monitor kuota** — memilih event, sesi, dan member serta melihat perubahan stok.
- **Direktori member** — pencarian, filter tim, profil detail, ulang tahun, media sosial, dan favorit lokal.
- **Jadwal** — menampilkan show dan event berdasarkan bulan, beserta detail theater dan lineup.
- **PWA-friendly** — manifest, ikon aplikasi, offline notice, serta layout mobile-first.
- **Serverless API** — endpoint Vercel yang menjadi perantara aman menuju layanan publik JKT48.

## Teknologi

- React 18
- React Router
- Vite 6
- Vercel Serverless Functions
- Node.js test runner
- Playwright untuk E2E desktop dan mobile

## Menjalankan secara lokal

Persyaratan yang disarankan:

- Node.js 20 atau lebih baru
- npm 10 atau lebih baru

```bash
npm install
cp .env.example .env.local
npm run dev
```

Vite akan menjalankan frontend dan endpoint lokal dari folder `api/` melalui plugin yang didefinisikan di `vite.config.js`.

## Environment variables

| Nama | Wajib | Kegunaan |
| ---- | ----: | -------- |

Salin `.env.example` menjadi `.env.local`, lalu isi hanya di perangkat lokal atau melalui Environment Variables di Vercel.

## Perintah npm

```bash
npm run dev       # development server
npm test          # seluruh unit test
npm run build     # production build
npm run preview   # preview hasil build
npm run check     # validasi project, audit identifier, unit/integration test, dan build
npm run test:e2e  # E2E desktop dan mobile
npm run check:full # check + E2E
npm run clean     # menghapus folder dist
```

## Route aplikasi

| Route       | Halaman               |
| ----------- | --------------------- |
| `/quota`    | Monitor kuota         |
| `/members`  | Direktori member      |
| `/schedule` | Jadwal show dan event |
| `/info`     | Informasi aplikasi    |

## Struktur singkat

```text
api/          Serverless API dan integrasi sumber data
public/       Aset statis dan PWA
scripts/      Validasi serta audit project
src/          Frontend React
tests/        Unit dan integration tests
e2e/          Playwright end-to-end tests
docs/         Dokumentasi teknis dan produk
```

Dokumentasi lengkap tersedia di [`docs/README.md`](docs/README.md).

## Validasi sebelum deploy

```bash
npm run check
```

Perintah tersebut harus selesai tanpa error sebelum perubahan didorong ke branch produksi. Untuk validasi lengkap termasuk browser, gunakan `npm run check:full`.

## Keamanan

- Jangan commit `.env.local`, token Vercel, atau service role key.
- Proxy gambar hanya menerima URL HTTPS dari host dan path JKT48 yang diizinkan.

Baca [`SECURITY.md`](SECURITY.md) untuk panduan lebih lengkap.

## Status data

CEK48 membaca layanan publik JKT48. Jika sumber sedang berada di Waiting Room, lambat, atau mengirim data kosong, CEK48 dapat menampilkan kondisi terbatas. Aplikasi tidak boleh mengarang atau mengubah fakta sumber tanpa fallback yang terdokumentasi secara jelas.
