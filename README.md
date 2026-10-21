# PinjamKampus Frontend — Persona A (Petugas gedung)

Aplikasi React + TypeScript + Vite untuk peminjaman ruang dan alat kampus. Komunikasi memakai `fetch` ke server PinjamKampus yang diberikan. **Kode API asli tidak diubah.**

## Identitas
- Nama: Titan Avery Hamonangan Manurung
- NRP: 5053241005
- Persona: A — Petugas gedung

## Persyaratan dan cara menjalankan
Node.js 20 atau lebih baru, npm, dan dua terminal pada **root project** (`package.json`).

```bash
# Terminal 1 — API (menyimpan data dalam memori)
node server-api/server.mjs --persona A --cr B

# Terminal 2 — frontend
npm install
npm run dev

# Pemeriksaan TypeScript dan build
npm run build
```

Buka URL yang ditampilkan Vite (umumnya `http://localhost:5173`). API harus berjalan di `http://localhost:8080`. Untuk menguji indikator loading, restart server dengan `node server-api/server.mjs --persona A --cr B --delay 800`.

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
| CR-B | Daftar penghalang | Pada POST 409, menampilkan error asli beserta ID `bentrok_dengan` dengan awalan `#` bila tersedia |

## Fitur yang belum selesai / belum diverifikasi
- Tidak ada fitur requirement yang sengaja ditinggalkan dalam kode.
- Verifikasi `npm run build` dan uji browser setelah paket npm terpasang belum dapat dilaporkan sebagai lulus.
- Isi nama dan NRP sendiri sebelum pengumpulan.

## Cara menguji secara manual
1. Buat ruang dengan stok 1; pastikan muncul di `Daftar sumber daya`.
2. Isi peminjaman pada tanggal valid dan slot 3–4; pastikan muncul di daftar.
3. Pilih ruang dan tanggal yang sama pada panel ketersediaan, klik **Lihat ketersediaan**; slot 3 dan 4 harus menunjukkan `Sisa 0 - Penuh`.
4. Coba buat peminjaman lain pada slot 3; pesan 409 harus muncul pada `role="alert"`, input tetap terisi, dan ID penghalang dari server ditampilkan dalam format `#N`.
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
api-core.mjs                  catatan bantuan AI
server.mjs                    rancangan, keputusan, kendala
README.md                     checklist sesuai template
```

## Catatan teknis
- Label/tombol/`aria-label` mengikuti dokumen requirement dan kartu Persona A.
- Form React controlled; state array tidak dimutasi langsung; `key` setiap item memakai ID server.
- Tidak memakai React Router, Axios, komponen UI eksternal, atau `any`.
- API menyimpan data dalam memori, sehingga restart server mengosongkan datanya.
- CR-B sudah diterapkan: server berjalan dengan `--persona A --cr B`; perluasan pesan bentrok hanya untuk POST `/peminjaman`, bukan PUT.

## Tes otomatis dan manual

Jalankan dari root project:

```bash
npm test                 # 37 tes: F1-F7, Persona A, dan CR-B
npm run test:api         # kontrak server dan integrasi HTTP CR-B
npm run test:frontend    # client fetch, validator, pemeriksaan statis JSX
npm run build            # wajib saat dependensi React/Vite tersedia
```

Tes API memakai Node.js `node:test` dan server asli; tes TypeScript memakai paket `typescript` lokal setelah `npm install` (atau instalasi TypeScript global jika tersedia). Tes HTTP memakai port kosong otomatis agar tidak berbenturan dengan port 8080. **Tes pemeriksaan JSX bersifat statis**, bukan pengujian klik browser. Langkah manual lengkap dan hasil yang diharapkan untuk F1–F7, Persona A, dan CR-B ada di `tests/MANUAL-UI.md`. Pemeriksaan build penuh dan interaksi UI tetap harus dilakukan di komputer Anda setelah dependensi npm terpasang.

## Riwayat checkpoint

Riwayat Git berisi checkpoint 1 (F1–F3 + tes), checkpoint 2 (F4–F7 + Persona A + tes), dan checkpoint 3 (CR-B + tes regresi). `AI-LOG.md` memuat tepat satu entri untuk tiap checkpoint; tidak ada perubahan manual oleh pengguna yang diada-adakan.
