# Deployment ke Vercel

## Persiapan

Sebelum deploy:

```bash
npm run check
```

Pastikan repository tidak memuat `.env.local`, `.vercel/`, `node_modules/`, atau token.

## Import project

1. Push source code ke repository Git.
2. Import repository tersebut ke Vercel.
3. Framework preset akan terdeteksi sebagai Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.

`vercel.json` sudah berisi SPA rewrites agar route `/quota`, `/members`, `/schedule`, dan `/info` dapat dibuka langsung.

## Environment variables

Tambahkan melalui Vercel Project Settings:

```text

```

Gunakan value berbeda untuk Development, Preview, dan Production bila diperlukan.

- aplikasi utama tetap dapat digunakan;

## Cron

`vercel.json` menjadwalkan:

```text
0 0 * * *
```

## Post-deploy checks

Buka:

```text
/api/health
/quota
/members
/schedule
/info
```

Periksa:

- health merespons JSON;
- direct route tidak 404;
- gambar member dapat dimuat;
- API tidak membocorkan internal stack atau secret;
- Console dan Network tidak menunjukkan loop request.

## Cache

Beberapa endpoint menggunakan `s-maxage` dan `stale-while-revalidate`. Setelah mengubah parser atau respons API, data lama dapat tetap terlihat sementara di CDN.

Untuk diagnosis:

- uji lokal terlebih dahulu;
- gunakan query berbeda hanya untuk debugging bila diperlukan;
- tunggu cache expiry;
- lakukan redeploy bila source function berubah.

Jangan menonaktifkan seluruh cache tanpa menilai dampak terhadap upstream.

## Rollback

Jika deployment baru bermasalah:

1. buka Vercel Deployments;
2. pilih deployment terakhir yang stabil;
3. gunakan Promote to Production atau rollback;
4. dokumentasikan penyebab dan tambahkan regression test sebelum deploy ulang.
