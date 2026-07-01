# Implementation Prompt — CEK48

Gunakan dokumen ini ketika meminta AI atau developer lain mengubah CEK48.

## Instruksi utama

Baca seluruh project, `README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, dan test yang relevan sebelum melakukan perubahan.

## Batasan wajib

- Jangan hardcode fakta event, birthday member, quota, lineup, atau jadwal untuk menutupi kekurangan API tanpa persetujuan eksplisit.
- Jika data upstream `null`, tampilkan fallback yang jujur atau perbaiki parser bila field sebenarnya tersedia.
- Jangan menghapus event hanya karena tanggal dan jamnya sama. Identitas jadwal harus mencakup reference code/link, tanggal, waktu, tipe, dan judul.
- Filter `Event` hanya untuk tipe `EVENT`; tipe `EXCLUSIVE` hanya masuk `Semua` kecuali requirement berubah.
- Jangan menggunakan `dangerouslySetInnerHTML` untuk konten upstream tanpa sanitasi yang kuat. Lebih aman ubah rich text menjadi plain text.
- Jangan membuat request effect bergantung pada object yang berubah akibat state hydration. Gunakan identity stabil seperti ID, code, atau route key.
- Jangan menaruh secret di source code, Markdown, frontend bundle, atau file ZIP.
- Jangan mengubah URL resmi menjadi sumber tidak terpercaya.
- Jangan menghapus handling Waiting Room, timeout, abort, validation, dan stale request protection.

## UI/UX

- Mobile-first, nyaman pada layar 360–430 px.
- Tidak boleh ada horizontal overflow.
- Hindari sticky filter yang menutupi konten ketika scroll.
- Pertahankan focus management, Escape-to-close, keyboard navigation, aria labels, dan reduced motion.
- Hindari CSS global baru jika selector dapat dibatasi pada page/component.
- Jangan menumpuk patch CSS berulang. Perbaiki sumber rule yang salah dan hapus rule mati bila aman.

## Workflow implementasi

1. Reproduksi bug atau petakan requirement.
2. Temukan source of truth dan data flow.
3. Buat perubahan sekecil mungkin tetapi lengkap.
4. Tambahkan atau perbarui regression test.
5. Jalankan:

```bash
npm run check
```

6. Periksa Console dan Network pada route yang berubah.
7. Ringkas file yang diubah, alasan, serta risiko yang masih tersisa.

## Format hasil yang diharapkan

- Project tetap dapat dijalankan dengan `npm install && npm run dev`.
- Tidak ada dependency baru kecuali benar-benar perlu.
- Tidak ada file rahasia atau generated directory dalam ZIP.
- Berikan satu ZIP project final, bukan kumpulan file terpisah, bila pengguna meminta hasil siap pakai.
