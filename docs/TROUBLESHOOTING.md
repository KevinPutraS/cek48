# Troubleshooting

## `ReferenceError: ComponentName is not defined`

Penyebab umum:

- JSX masih memanggil komponen yang sudah dihapus;
- import belum ditambahkan;
- nama import dan export berbeda.

Cari seluruh referensi:

```bash
rg "ComponentName" src
```

Hapus pemanggilan yang memang tidak digunakan atau pulihkan import/deklarasinya.

## Detail member melakukan sync/fetch terus-menerus

Gejala: membuka profile sheet menghasilkan request detail berulang.

Penyebab umum: effect bergantung pada object `selectedMember`. Setelah birthday atau detail digabung ke state members, object berubah dan effect berjalan kembali.

Perbaikan:

- gunakan ID/code/route key stabil sebagai dependency;
- hindari update state bila nilai birthday/detail sama;
- batalkan request lama;
- tambahkan regression test atau counter Network.

## Jadwal pada tanggal yang sama hilang

Penyebab umum: dedupe memakai `date`, `date + time`, atau `reference_code` saja.

Gunakan identity komposit yang setidaknya mencakup:

```text
referenceCode/link/id + dateKey + startTime + endTime + type + title + team
```

Dua show dapat berlangsung pada tanggal dan jam yang sama.

## Tanggal terlihat bergeser satu hari

Nilai seperti `2026-06-24T17:00:00Z` adalah UTC dan menjadi 25 Juni pukul 00:00 WIB.

Jangan memfilter memakai `String(date).includes("2026-06-24")`. Konversi dahulu melalui `Intl.DateTimeFormat` dengan timezone `Asia/Jakarta`.

## HTML terlihat sebagai teks pada deskripsi event

Upstream dapat mengirim `content_body` berisi `<span style=...>`.

Jangan merender string tersebut langsung sebagai plain paragraph bila masih mengandung markup, dan jangan langsung memakai `dangerouslySetInnerHTML`.

Normalisasikan menjadi plain text dengan:

- menghapus tag;
- decode HTML entity;
- mempertahankan line break yang perlu;
- membatasi panjang.

## Birthday show tidak terdeteksi

Periksa dua endpoint:

```text
/api/jkt48-schedules?month=M&year=Y
/api/jkt48-theater-show?code=SH...
```

Jika sumber mengirim:

```json
{
  "birthday_member": null,
  "birthday_member_name": []
}
```

maka frontend tidak memiliki data birthday. Jangan langsung menambahkan hardcode. Pastikan lebih dulu apakah field tersedia di bagian payload lain atau pengumuman resmi. Fallback manual hanya boleh dibuat setelah keputusan produk dan harus dicatat di changelog/test.

## Filter Event menampilkan Video Call/Exclusive

Pastikan filter:

```text
ALL   → SHOW + EVENT + EXCLUSIVE
SHOW  → SHOW
EVENT → EVENT saja
```

Jangan memakai kondisi `EVENT || EXCLUSIVE` untuk tombol Event bila requirement-nya memisahkan kedua tipe tersebut.

## `JKT48_WAITING_ROOM`

Ini bukan error parser biasa. Upstream sedang menggunakan Waiting Room atau mengembalikan HTTP 429.

Tindakan:

- tampilkan pesan retryable;
- jangan melakukan retry cepat tanpa batas;
- jangan mencoba melewati proteksi upstream;
- coba kembali setelah beberapa saat.

## API lokal 404

Pastikan menjalankan:

```bash
npm run dev
```

Bukan membuka `index.html` secara langsung. Handler lokal dipasang oleh plugin di `vite.config.js`.

## Direct route 404 di Vercel

Periksa `vercel.json` dan pastikan route SPA memiliki rewrite ke `/index.html`.

## Perubahan API belum terlihat setelah deploy

Endpoint memakai CDN cache. Tunggu masa cache atau redeploy. Pastikan yang diubah adalah file di `api/`, bukan hanya salinan lokal yang tidak masuk Git.

## Nomor versi berbeda

Cari seluruh string versi:

```bash
rg "5\\.[0-9]+\\.[0-9]+" package.json src api
```

Samakan minimal:

- `package.json`;
- Info page;
- `/api/health`;
- changelog.
