# PinjamKampus Frontend

- Nama dan NRP: Titan Avery Hamonangan Manurung - 5053241005
- Persona: A — Petugas gedung
- Cara menjalankan:
  1. Terminal 1: `node server-api/server.mjs --persona A --cr B`
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
- [x] Change Request B — POST 409 menampilkan ID peminjaman penghalang dari `bentrok_dengan`

## Tes
- `npm test`: 37 tes otomatis lulus pada lingkungan asisten (regresi F1–F7, Persona A, CR-B, inspeksi JSX).
- `npm run test:api`: tes kontrak server dan integrasi HTTP CR-B.
- `npm run test:frontend`: tes fungsi `fetch`, validator, dan inspeksi statis JSX.
- `tests/MANUAL-UI.md`: panduan pengujian browser sebelum dikumpulkan.

## Yang belum selesai
Semoga semuanya sudah selesai
