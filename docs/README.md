# Dokumentasi CEK48

Folder ini menyimpan dokumentasi yang tidak perlu berada di root repository.

## Indeks

| Dokumen                                                                | Isi                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`PRD.md`](PRD.md)                                                     | Tujuan produk, pengguna, cakupan, dan acceptance criteria.    |
| [`IMPLEMENTATION_PROMPT.md`](IMPLEMENTATION_PROMPT.md)                 | Instruksi aman untuk AI atau developer saat mengubah project. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md)                                   | Arsitektur frontend, API, data flow, dan boundary.            |
| [`API.md`](API.md)                                                     | Daftar endpoint internal serta parameter penting.             |
| [`DEVELOPMENT.md`](DEVELOPMENT.md)                                     | Setup lokal, workflow, testing, dan aturan coding.            |
| [`DEPLOYMENT.md`](DEPLOYMENT.md)                                       | Deployment Vercel, environment variables, dan cron.           |
| [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)                             | Diagnosis error yang umum terjadi.                            |
| [`UPGRADE-5.4.0-MAINTAINABILITY.md`](UPGRADE-5.4.0-MAINTAINABILITY.md) | Struktur feature, quality tools, CI, dan E2E 5.4.0.           |

## Aturan penempatan file Markdown

- `README.md`, `CHANGELOG.md`, dan `SECURITY.md` berada di root karena harus mudah ditemukan.
- Dokumentasi produk dan teknis berada di `docs/`.
- Dokumentasi tidak diletakkan di `src/`, `public/`, atau `api/` kecuali benar-benar khusus untuk folder tersebut.
- Rahasia, token, dan nilai `.env.local` tidak boleh ditulis ke dokumentasi.
