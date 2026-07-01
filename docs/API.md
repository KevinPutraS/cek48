# Internal API Reference

Semua endpoint internal menggunakan prefix `/api` dan menerima method `GET` kecuali dinyatakan lain.

> Response upstream dapat berubah. Frontend harus tetap memvalidasi struktur payload dan menyediakan fallback yang jujur.

## Ringkasan endpoint

| Endpoint                   | Parameter       | Fungsi                                   |
| -------------------------- | --------------- | ---------------------------------------- |
| `/api/health`              | —               | Status aplikasi dan konfigurasi service. |
| `/api/jkt48-events`        | —               | Daftar event eksklusif publik.           |
| `/api/jkt48-quota`         | `code`          | Detail quota satu event.                 |
| `/api/jkt48-members`       | —               | Daftar member.                           |
| `/api/jkt48-member-detail` | `id`            | Detail satu member.                      |
| `/api/jkt48-schedules`     | `month`, `year` | Jadwal bulanan.                          |
| `/api/jkt48-theater-show`  | `code`          | Detail theater show.                     |
| `/api/jkt48-image`         | `url`           | Proxy gambar resmi yang tervalidasi.     |

## `/api/health`

```http
GET /api/health
```

Nomor versi endpoint harus disamakan dengan `package.json` pada setiap release.

## `/api/jkt48-events`

```http
GET /api/jkt48-events
```

Meneruskan daftar event eksklusif dari layanan publik JKT48 dan menambahkan metadata `source` serta `fetchedAt`.

## `/api/jkt48-quota`

```http
GET /api/jkt48-quota?code=EX1234
```

`code` harus cocok dengan pola `EX` diikuti 4–12 karakter alfanumerik.

## `/api/jkt48-stocks`

```http
GET /api/jkt48-stocks?codes=EX1234,EX5678
```

- Maksimum 12 kode unik.
- Request dijalankan dalam batch concurrency 3.
- Dapat menghasilkan respons parsial bila beberapa event gagal.

## `/api/jkt48-members`

```http
GET /api/jkt48-members
```

Memvalidasi bahwa payload berisi array member. Endpoint memakai CDN cache lebih panjang karena data member tidak berubah sesering stock.

## `/api/jkt48-member-detail`

```http
GET /api/jkt48-member-detail?id=123
```

`id` harus berupa integer positif maksimal enam digit.

## `/api/jkt48-schedules`

```http
GET /api/jkt48-schedules?month=6&year=2026
```

- `month`: 1–12, default bulan Jakarta saat ini.
- `year`: 2020–2100, default tahun Jakarta saat ini.
- Respons harus memiliki `data` berupa array.

Tanggal yang memakai timezone harus dikonversi ke `Asia/Jakarta` sebelum dibandingkan atau dikelompokkan.

## `/api/jkt48-theater-show`

```http
GET /api/jkt48-theater-show?code=SH1B46
```

Kode harus diawali `SH` dan memenuhi panjang yang divalidasi handler.

Endpoint meneruskan detail sumber. Nilai kosong seperti `birthday_member_name: []` berarti sumber tidak menyediakan informasi; jangan mengubahnya secara manual tanpa keputusan produk yang terdokumentasi.

## `/api/jkt48-image`

```http
GET /api/jkt48-image?url=<encoded-https-url>
```

Pembatasan:

- HTTPS saja;
- host hanya `jkt48.com` atau `www.jkt48.com`;
- path harus diawali `/api/v1/storages/media/`;
- maksimal dua redirect;
- maksimal 8 MiB;
- hanya raster image content type yang diizinkan.

### Scope event

```http

```

### Scope slot

```http

```

Parameter:

- `scope`: `event` atau `slot`, default `slot`;
- `eventCode`: wajib;
- `eventDate`: opsional, format `YYYY-MM-DD`;
- `session` dan `member`: wajib untuk scope slot;
- `lane`: opsional;
- `limit`: 1–50, default 20;
- `offset`: 0–100000.

```http

```

- Maksimum 12 event.
- Concurrency 3.
- Memvalidasi snapshot Video Call sebelum menulis ke database.
- Respons dapat berupa `200`, `207`, `429`, atau error lain sesuai hasil sync.

## Error umum

| Code                     | Makna                                           |
| ------------------------ | ----------------------------------------------- |
| `JKT48_WAITING_ROOM`     | Upstream menerapkan Waiting Room atau HTTP 429. |
| `JKT48_TIMEOUT`          | Upstream melewati batas waktu.                  |
| `JKT48_INVALID_RESPONSE` | Respons bukan JSON yang dapat diproses.         |
| `JKT48_NETWORK_ERROR`    | Koneksi ke upstream gagal.                      |
