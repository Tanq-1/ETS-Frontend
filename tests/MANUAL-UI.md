# Checklist pengujian browser — Persona A + CR-B

Tes otomatis dalam `tests/*.test.mjs` mencakup validator TypeScript, integrasi fungsi client HTTP, kontrak server, dan inspeksi struktur JSX. Pemeriksaan statis JSX **bukan** bukti bahwa klik di browser sudah diuji. Gunakan checklist ini setelah `npm install`, `npm run build`, dan `npm run dev` berhasil. Buka DevTools (F12) > Network > Fetch/XHR.

## Persiapan

Buka terminal pada root project (folder berisi `package.json`).

```bash
# Terminal 1: restart API dengan perubahan CR-B
node server-api/server.mjs --persona A --cr B

# Terminal 2
npm install
npm run build
npm test
npm run dev
```

Buka alamat Vite (biasanya `http://localhost:5173`). Setelah me-restart server API, buat ulang semua data uji karena server memakai memori.

## Kasus uji per fitur

| ID | Aksi di browser | Hasil dan pemeriksaan Network |
|---|---|---|
| UI-01 F1 | Buat `Aula A`, jenis `ruang`, stok `2` | POST `/sumber-daya` status 201; nama di-`trim`, daftar `Daftar sumber daya` menampilkan stok 2; form direset. |
| UI-02 F1 | Coba nama kosong dan stok 0 atau 1.5 | `role=alert`; **tidak** ada POST baru. |
| UI-03 F2 | Pinjam Aula A oleh `Rina`, tanggal `2026-11-02`, slot 3–4, jumlah 1 | POST `/peminjaman` 201; daftar peminjaman diperbarui, nilai di payload adalah number, bukan string. |
| UI-04 F3 | Pilih Filter sumber daya Aula A, Filter tanggal `2026-11-02`, Filter status `aktif` | GET `/peminjaman?sumber_daya_id=1&tanggal=2026-11-02&status=aktif` (ID dapat berbeda); hasil sesuai server. |
| UI-05 F3 | Klik **Detail** pada peminjaman | GET `/peminjaman/{id}` 200; area `aria-label="Detail peminjaman"` tampil. |
| UI-06 F4 | Kosongkan peminjam / tanggal atau atur slot mulai 5, slot selesai 4 | `role=alert` tampil; tidak ada POST/PUT. |
| UI-07 F5 | Pinjam Aula A oleh `Budi`, tanggal dan slot 3–4, jumlah 2 | POST 409; pesan server tampil, form tetap berisi Budi dan daftar tidak bertambah. |
| UI-08 F6 | Edit Rina dari slot 3–4 ke 5–6 | PUT `/peminjaman/{id}` 200; form berubah ke mode `Simpan perubahan`, lalu kembali ke mode buat saat sukses. |
| UI-09 F6 | Hapus peminjaman Rina | DELETE `/peminjaman/{id}` 204 tanpa body; daftar langsung sesuai server. |
| UI-10 F7 | Klik Simpan dua kali cepat, periksa Network | Untuk satu aksi hanya ada satu POST. Ulangi untuk Simpan perubahan / Hapus. |
| UI-11 Persona A | Pilih Aula A, tanggal `2026-11-02`, klik **Lihat ketersediaan** | GET `/sumber-daya/{id}/ketersediaan?tanggal=...` 200; `Ketersediaan slot` memuat 8 `<li>` dari Slot 1 sampai Slot 8. |
| UI-12 Persona A | Setelah papan terlihat, buat/ubah/hapus peminjaman pada tanggal yang sama | Papan melakukan GET ulang otomatis dan nilai sisa/tersedia berubah tanpa perlu klik Lihat ketersediaan lagi. |
| UI-13 Persona A | Klik Lihat ketersediaan dengan sumber daya atau tanggal kosong | `role=alert`; tidak ada GET ketersediaan. |
| UI-14 CR-B | Restart server dari awal, buat `Aula A` stok 2; buat `Rina` slot 3–4 jumlah 1, lalu `Budi` slot 4–5 jumlah 1, lalu coba `Tono` slot 4–5 jumlah 1 | POST ketiga 409 dengan `bentrok_dengan:[1,2]`; `role=alert` memuat error asli, `#1`, `#2`; formulir Tono tidak dikosongkan, daftar hanya dua peminjaman. |
| UI-15 CR-B | Buat peminjaman slot 1–2 yang tidak beririsan, ulangi konflik slot 4–5 | `role=alert` hanya menyebut ID yang terdapat dalam `bentrok_dengan`, bukan ID slot 1–2. |
| UI-16 CR-B | Edit peminjaman ke slot yang penuh | PUT 409; pesan error asli saja (tidak mengarang daftar penghalang); input edit tetap. |
| UI-17 jaringan | Hentikan server (Ctrl+C), reload browser / coba simpan | Pesan mengandung `Gagal` atau `error` tampil; `Memuat...` tidak macet. |
| UI-18 loading | Restart server dengan `node server-api/server.mjs --persona A --cr B --delay 800`, refresh browser | Tulisan `Memuat...` tampil selama load lalu hilang setelah respons berhasil/gagal. |

**Catatan:** ID bukan angka yang selalu sama; server kembali mengeluarkan ID dari 1 setelah restart. Status `409` dari CR-B hanya diubah untuk **POST `/peminjaman`**; respons PUT tidak memiliki perluasan `bentrok_dengan` menurut kontrak.

## Pemeriksaan pengumpulan

- `npm run build` lulus pada perangkat pengumpulan (tidak cukup hanya tes Node).
- Uji layar pada browser secara manual, termasuk `role="alert"`, input yang tidak terhapus ketika 409, dan papan ketersediaan yang auto-refresh.
- Pastikan `README.md` diisi Nama/NRP sendiri dan repo GitHub publik berisi riwayat commit 3 checkpoint.
