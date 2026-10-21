# PinjamKampus Frontend

- Nama dan NRP: (isi sendiri)
- Persona: A — Petugas gedung
- Cara menjalankan:
  1. Terminal 1: `node server-api/server.mjs --persona A`
  2. Terminal 2: `npm install` lalu `npm run dev`, kemudian buka alamat yang ditampilkan Vite
  3. Validasi build dengan `npm run build` setelah paket terpasang.

## Fitur
- [x] F1 Kelola sumber daya
- [x] F2 Buat peminjaman
- [x] F3 Daftar peminjaman (filter, detail)
- [x] F4 Validasi dan penanganan error
- [x] F5 Tampilan bentrok (409)
- [x] F6 Ubah dan hapus
- [x] F7 Aman klik ganda dan data konsisten
- [x] Fitur khas persona — papan ketersediaan 8 slot yang diperbarui otomatis
- [ ] Change request — belum ada lembar resmi, belum diimplementasikan

## Yang belum selesai
- Change request belum dapat dikerjakan sebelum diketahui lembar CR yang didapat (A/B/C) beserta kontrak tampilannya.
- `npm install`, `npm run build`, dan uji manual browser masih perlu dijalankan di mesin dengan paket npm tersedia; lingkungan pembuatan arsip tidak memiliki akses ke registry npm.
- Nama dan NRP harus diisi sendiri sebelum dikumpulkan.
