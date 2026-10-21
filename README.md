# PinjamKampus Frontend — Persona A (Petugas gedung)

Aplikasi satu halaman memakai React + TypeScript + Vite dan `fetch` bawaan browser untuk API PinjamKampus. Kontrak API mengikuti server yang diberikan, tanpa mengubah `server-api/api-core.mjs` maupun `server-api/server.mjs`.

## Identitas
- Nama: (isi sendiri)
- NRP: (isi sendiri)
- Persona: A — Petugas gedung

## Menjalankan
Persyaratan: Node.js 20+ dan npm. Buka terminal di **root project** (folder yang berisi `package.json`).

```bash
# Terminal pertama
node server-api/server.mjs --persona A

# Terminal kedua, dari root project
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite (biasanya http://localhost:5173). API berjalan pada `http://localhost:8080`. Untuk menguji loading: `node server-api/server.mjs --persona A --delay 800`. Untuk memeriksa TypeScript dan build, jalankan `npm run build`.

## Fitur selesai pada Checkpoint 1
- F1: buat dan lihat sumber daya dari API.
- F2: buat peminjaman; jumlah dan slot memakai tipe numerik; item dimuat ulang.
- F3: filter server menurut sumber daya/tanggal/status dan GET detail peminjaman.

## Fitur belum selesai
- F4-F7 dan papan ketersediaan Persona A (akan dibuat pada Checkpoint 2).
- Change request (lembar belum diserahkan).

## Struktur
- `src/App.tsx`: state dan koordinasi data.
- `src/api/pinjam.ts`: satu-satunya lokasi `fetch`.
- `src/components/`: formulir, filter, dan daftar.
- `src/utils/validasi.ts`: validasi client.
- `AI-LOG.md` dan `PROSES.md`: catatan bantuan AI dan proses.

## Catatan
Data API hanya disimpan di memori dan akan hilang ketika server dihentikan. Server menggunakan `--persona A` tanpa `--cr` sampai lembar perubahan diterima.
