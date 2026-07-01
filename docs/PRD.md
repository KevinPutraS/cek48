# Product Requirements Document — CEK48 5.4.0

## 1. Ringkasan

CEK48 adalah dashboard independen yang menyederhanakan informasi publik JKT48 menjadi empat pengalaman utama: monitor kuota, direktori member, jadwal, dan informasi aplikasi.

Aplikasi dirancang mobile-first, tidak membutuhkan login akun JKT48, dan tidak melakukan transaksi pembelian.

## 2. Masalah yang diselesaikan

Informasi event, kuota, member, dan jadwal tersedia dalam format serta endpoint yang berbeda. Pengguna membutuhkan tampilan yang:

- cepat dipahami;
- nyaman di layar kecil;
- tidak memerlukan perpindahan halaman berulang;
- mempertahankan kejelasan sumber data;
- tetap aman ketika upstream lambat atau memasang Waiting Room.

## 3. Sasaran pengguna

Pengguna utama adalah penggemar JKT48 yang ingin:

- memantau kuota event eksklusif;
- mencari member dan profil publik;
- menyimpan member favorit secara lokal;
- melihat show dan event dalam kalender bulanan;
- membaca lineup dan detail theater secara ringkas.

## 4. Prinsip produk

1. **Sumber tetap resmi** — CEK48 merangkum data publik dan tidak boleh mengarang fakta.
2. **Tanpa login akun JKT48** — aplikasi tidak meminta username atau password pengguna.
3. **Mobile-first** — interaksi utama harus nyaman pada lebar layar kecil dan perangkat sentuh.
4. **Progressive disclosure** — tampilkan ringkasan lebih dulu, detail ketika diminta.
5. **Resilient** — error upstream harus diterjemahkan menjadi pesan yang jelas dan dapat dicoba ulang.
6. **Aksesibel** — keyboard navigation, focus management, label, dan reduced motion harus dipertahankan.

## 5. Cakupan fitur

### 5.1 Monitor kuota

- Memuat daftar event aktif.
- Memilih kategori dan event.
- Menampilkan sesi serta member yang relevan.
- Menampilkan sisa kuota, tiket terjual, total kuota, dan status.
- Mendukung pencarian member.
- Menampilkan fallback yang jelas ketika Waiting Room atau data tidak lengkap.

### 5.2 Direktori member

- Memuat daftar member publik.
- Pencarian berdasarkan nama, nickname, kode, atau tim.
- Filter tim dan mode favorit.
- Detail profil melalui route query parameter.
- Informasi ulang tahun, tinggi, golongan darah, zodiak, galeri, dan social link ketika tersedia.
- Favorite state disimpan di browser, bukan akun server.
- Birthday cache tidak boleh menyebabkan request detail berulang tanpa henti.

### 5.3 Jadwal

- Memilih bulan dan tahun.
- Filter `Semua`, `Show`, dan `Event`.
- `Event` hanya memuat tipe `EVENT`; tipe `EXCLUSIVE` tetap muncul melalui `Semua`.
- Mendukung beberapa jadwal pada tanggal dan jam yang sama tanpa menghapus salah satunya.
- Detail show mengambil data berdasarkan `reference_code`.
- Menampilkan setlist, lineup, birthday member, periode penjualan, harga, dan ringkasan kuota jika tersedia.
- HTML dari deskripsi upstream tidak boleh tampil sebagai tag mentah.

### 5.4 Halaman informasi

- Menjelaskan fungsi CEK48 dan status independen.
- Menampilkan status health API.
- Menyediakan link menuju halaman utama serta website resmi JKT48.

## 6. Cakupan non-fitur

CEK48 tidak ditujukan untuk:

- login ke akun JKT48;
- membeli tiket atau melakukan checkout;
- melewati Waiting Room, rate limit, atau mekanisme keamanan situs resmi;
- menjamin ketersediaan kuota;
- menggantikan pengumuman resmi;
- menyimpan data pribadi pengguna di server.

## 7. Persyaratan nonfungsional

### Performa

- Route utama menggunakan lazy loading.
- Gambar menggunakan lazy loading bila bukan hero.
- Animasi harus menghormati `prefers-reduced-motion`.
- Tidak boleh ada polling agresif yang membebani upstream.

### Keamanan

- Semua input endpoint divalidasi.
- Secret hanya tersedia di server.
- Proxy gambar memakai allowlist ketat.
- Respons error tidak membocorkan HTML upstream atau credential.

### Reliabilitas

- Request dapat dibatalkan menggunakan `AbortController`.
- Request lama tidak boleh menimpa state dari request terbaru.
- Endpoint harus menangani response non-JSON, timeout, respons kosong, dan HTTP 429.

### Aksesibilitas

- Dialog atau profile sheet memiliki focus trap dan Escape-to-close.
- Tombol, listbox, dan status memiliki label yang dapat dibaca screen reader.
- Kontras dan ukuran target sentuh harus tetap layak.

## 8. Acceptance criteria release

Sebelum release:

```text
[ ] npm run check berhasil
[ ] Semua route dapat dimuat langsung dari URL pada Vercel
[ ] Tidak ada uncaught error di Console
[ ] Tidak ada infinite request ketika membuka detail member atau show
[ ] Dua jadwal dengan tanggal/jam sama tetap tampil sebagai dua item
[ ] Filter Event tidak memasukkan Exclusive/Video Call
[ ] Deskripsi API tidak menampilkan tag HTML mentah
[ ] .env.local dan .vercel tidak masuk ZIP/repository
[ ] Mobile 360–430 px dapat digunakan tanpa overflow horizontal
[ ] Keyboard dan Escape bekerja pada dialog/detail
```

## 9. Sumber kebenaran

- Informasi JKT48: respons layanan publik JKT48.
- Favorit pengguna: local storage browser.
- Kontrak aplikasi: source code dan automated tests pada repository ini.
