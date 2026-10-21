# PinjamKampus Frontend — Persona A (Petugas gedung)

Aplikasi React + TypeScript + Vite untuk peminjaman ruang dan alat kampus. Komunikasi memakai `fetch` ke server PinjamKampus yang diberikan. **Kode API asli tidak diubah.**

## Identitas
- Nama: (isi sendiri)
- NRP: (isi sendiri)
- Persona: A — Petugas gedung

## Persyaratan dan cara menjalankan
Node.js 20 atau lebih baru, npm, dan dua terminal pada **root project** (`package.json`).

```bash
# Terminal 1 — API (menyimpan data dalam memori)
node server-api/server.mjs --persona A

# Terminal 2 — frontend
npm install
npm run dev

# Pemeriksaan TypeScript dan build
npm run build
```

Buka URL yang ditampilkan Vite (umumnya `http://localhost:5173`). API harus berjalan di `http://localhost:8080`. Untuk menguji indikator loading, restart server dengan `node server-api/server.mjs --persona A --delay 800`.

## Fitur yang telah diimplementasikan
| Kode | Fungsi | Keterangan |
|---|---|---|
| F1 | Kelola sumber daya | POST dan GET; nama, jenis, stok; form reset setelah berhasil |
| F2 | Buat peminjaman | POST dengan enam field bertipe tepat; daftar diperbarui |
| F3 | Lihat dan filter peminjaman | GET list dengan query string; GET detail berdasarkan ID |
| F4 | Validasi dan error | Validasi sebelum fetch, `role="alert"`, error server dan jaringan |
| F5 | Bentrok (409) | Menampilkan pesan asli server tanpa menghapus input form |
| F6 | Edit/hapus | PUT keenam field, DELETE 204 tanpa JSON, refetch daftar |
| F7 | Aman dan konsisten | `useRef` sebagai kunci klik ganda dan refetch setelah aksi berhasil |
| Persona A | Papan ketersediaan | Delapan slot dari endpoint Persona A; refresh otomatis setelah buat/ubah/hapus |

## Fitur yang belum selesai
- **Change request:** menunggu lembar resmi; tidak menebak CR A/B/C.
- Verifikasi `npm run build` dan uji browser di lingkungan dengan paket npm terpasang belum dapat dilaporkan sebagai lulus.

## Cara menguji secara manual
1. Buat ruang dengan stok 1; pastikan muncul di `Daftar sumber daya`.
2. Isi peminjaman pada tanggal valid dan slot 3–4; pastikan muncul di daftar.
3. Pilih ruang dan tanggal yang sama pada panel ketersediaan, klik **Lihat ketersediaan**; slot 3 dan 4 harus menunjukkan `Sisa 0 - Penuh`.
4. Coba buat peminjaman lain pada slot 3; pesan 409 harus muncul pada `role="alert"`, input tetap terisi.
5. Ubah peminjaman menjadi slot 5–6; setelah PUT berhasil, papan yang sudah ditampilkan harus otomatis berubah tanpa klik lagi.
6. Klik **Hapus**; daftar dan papan harus mencerminkan data terbaru.
7. Gunakan filter sumber daya, tanggal, dan status, lalu perhatikan query GET di tab Network.
8. Tes klik ganda cepat (hanya satu POST), tes validasi kosong, dan matikan server untuk menguji error jaringan.

## Struktur folder
```text
src/
  App.tsx                     state utama, callback aksi, efek reload
  main.tsx                    entry point React
  types.ts                    tipe API dan form
  api/pinjam.ts               seluruh pemanggilan fetch
  utils/validasi.ts           pemeriksaan form dan tanggal
  components/
    SumberDayaForm.tsx        form F1
    PeminjamanForm.tsx        form F2 dan F6
    FilterPeminjaman.tsx      filter F3
    DaftarPeminjaman.tsx      daftar, detail, edit, hapus
    PapanKetersediaan.tsx     fitur khas Persona A
server-api/                   server asli dari dosen
AI-LOG.md                     catatan bantuan AI
PROSES.md                     rancangan, keputusan, kendala
README-mahasiswa.md           checklist sesuai template
```

## Catatan teknis
- Label/tombol/`aria-label` mengikuti dokumen requirement dan kartu Persona A.
- Form React controlled; state array tidak dimutasi langsung; `key` setiap item memakai ID server.
- Tidak memakai React Router, Axios, komponen UI eksternal, atau `any`.
- API menyimpan data dalam memori, sehingga restart server mengosongkan datanya.
- Server baru dijalankan dengan `--cr X` setelah kontrak change request X tersedia.

## Tes kontrak API tanpa dependensi
Jalankan `npm test` setelah `npm install` untuk tes kontrak API, tes client HTTP, dan validasi TypeScript. `npm run test:api` dapat dijalankan tanpa instalasi npm, karena hanya memakai server asli dan Node.js. **Ini bukan tes interaksi UI**, sehingga belum menggantikan pemeriksaan browser atau `npm run build`. Tes client menggunakan port kosong yang dipilih dinamis, sedangkan frontend produksi selalu memakai 8080.
