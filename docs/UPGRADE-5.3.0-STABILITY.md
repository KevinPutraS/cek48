# Upgrade CEK48 — Data Integrity, Refactor, dan E2E

## 1. Upgrade dependency

```bash
npm install
npx playwright install chromium
```

Database lama:

2. Masuk ke **SQL Editor**.
3. Jalankan cron sync atau buka Monitor untuk memastikan snapshot baru tersimpan.

## 3. Verifikasi lokal

```bash
npm run check
npm run test:e2e
```

Hasil yang diharapkan:

- 55 unit/integration test lulus;
- production build berhasil;
- 8 skenario E2E lulus pada desktop dan mobile.

## 4. Deploy

Setelah migration database berhasil, deploy project ke Vercel seperti biasa. Jangan mengunggah `.env.local`; salin environment variable melalui Vercel Project Settings.
