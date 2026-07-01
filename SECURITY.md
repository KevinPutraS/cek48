# Security Policy

## Ruang lingkup

## Jangan pernah dipublikasikan

- `.env.local`
- token Vercel atau `VERCEL_OIDC_TOKEN`
- file di folder `.vercel/`
- log yang memuat authorization header atau kredensial

Jika credential pernah masuk ke ZIP, chat, repository publik, atau screenshot, anggap credential tersebut bocor dan lakukan rotasi.

## Aturan environment variable

Gunakan `.env.example` untuk nama variable dan placeholder. Nilai sebenarnya disimpan melalui:

- `.env.local` untuk development lokal; atau
- Vercel Project Settings → Environment Variables untuk deployment.

## Endpoint sensitif

```http

```

Jangan membuka endpoint tersebut tanpa secret.

### `/api/jkt48-image`

Proxy gambar harus tetap menggunakan allowlist host, protokol HTTPS, path media resmi, batas redirect, batas ukuran, dan daftar content type yang diizinkan. Jangan mengubahnya menjadi proxy URL bebas karena dapat membuka celah SSRF.

## Database

- Role `anon` dan `authenticated` tidak boleh memperoleh akses tulis langsung.
- Operasi sinkronisasi dilakukan menggunakan service role dari serverless function.
- Jangan menaruh service role key di frontend.

## Pelaporan kerentanan

Jangan mempublikasikan detail eksploitasi sebelum perbaikan tersedia. Sertakan:

- endpoint atau file yang terdampak;
- langkah reproduksi aman;
- dampak yang mungkin terjadi;
- versi atau commit yang diuji;
- saran mitigasi bila ada.

## Checklist sebelum membagikan ZIP

```text
[ ] .env.local tidak disertakan
[ ] .vercel/ tidak disertakan
[ ] node_modules/ tidak disertakan
[ ] dist/ tidak disertakan kecuali memang diminta
[ ] tidak ada token di screenshot atau log
[ ] npm run check berhasil
```
