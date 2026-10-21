# PROSES

## 1. Persona dan masalahnya
Persona A adalah petugas gedung yang perlu menjawab apakah sebuah ruang atau alat masih tersedia pada tanggal dan jam pelajaran tertentu. Sebelumnya petugas harus membaca peminjaman satu per satu, padahal informasi yang dibutuhkan adalah sisa stok di setiap slot. Papan ketersediaan delapan slot membantu petugas melihat jadwal kosong dan penuh dalam satu layar.

## 2. Rancangan komponen dan state
Rancangan awal: `App` sebagai sumber data bersama, form dan daftar dipisah, pemanggilan HTTP terpusat di `src/api/pinjam.ts`. Pada Checkpoint 2 ditambahkan `PapanKetersediaan` dan mode edit.

- `App.tsx` menyimpan `resources`, `bookings`, `filter`, `form`, `editingId`, `detail`, `error`, flag loading/busy, dan `revision`.
- `SumberDayaForm` menyimpan `nama`, `jenis`, dan `stok` secara lokal. Props: `busy`, `onSave`.
- `PeminjamanForm` tidak menduplikasi draft; menggunakan `value`, `onChange`, `onSave`, `editing`, dan `sumberDaya` dari `App`.
- `FilterPeminjaman` menerima `value`, `onChange`, `sumberDaya`; setiap perubahan filter memicu GET `/peminjaman` dengan query string.
- `DaftarPeminjaman` menerima list, detail, serta callback `onDetail`, `onEdit`, `onHapus`. Satu `<li>` memuat tombolnya.
- `PapanKetersediaan` menyimpan `id` dan `tanggal` isian, `pilihanAktif`, `data` delapan slot, dan `loading`. Props `sumberDaya`, `revision`, dan callback penanganan error. Saat `revision` naik setelah POST/PUT/DELETE, papan melakukan GET ulang untuk pilihan terakhir yang telah ditampilkan.
- `src/api/pinjam.ts` berisi **semua fetch**; `src/utils/validasi.ts` memeriksa input tanpa mengirim request.
- Dua `useRef` di App (`resourceLock`, `bookingLock`) mengunci aksi mutasi sebelum state React diperbarui. `detailRequest` mencegah hasil GET detail yang terlambat menimpa UI.

Alur data: `klik tombol -> handler komponen -> callback App -> validasi -> fungsi src/api/ -> server -> setState/revision -> render ulang atau GET ulang`.

## 3. Satu keputusan desain
**Keputusan:** setiap mutasi peminjaman yang sukses meningkatkan `revision`; `useEffect` daftar dan papan mengirim GET ulang ke server. Alternatifnya adalah menyunting array daftar dan sisa slot secara optimistis di browser. Saya memilih GET ulang karena kapasitas dan bentrok dihitung server, serta filter aktif harus tetap benar; ini juga mengurangi risiko papan menunjukkan nilai yang berbeda dari server. Cleanup effect mencegah jawaban request lama menggantikan data dari filter yang baru.

## 4. Bug atau kendala (minimal dua)
### Bug 1
- Gejala: Nilai dari `input type="number"` dan `select` dibaca sebagai string, sedangkan kontrak API meminta angka.
- Cara menemukan: Memeriksa kontrak body API dan penggunaan `event.target.value` pada formulir; `Number.isInteger` dipakai saat validasi.
- Penyebab dan solusi: Nilai DOM tetap string; gunakan `Number(...)` sebelum membuat JSON dan validasi rentang stok/slot. Ini adalah risiko tipe yang diperbaiki pada implementasi, bukan laporan bug produksi yang telah diuji di browser.

### Bug 2
- Gejala: Bila hanya memakai `disabled={busyBooking}`, dua klik dalam render cycle yang sama dapat memanggil handler dua kali sebelum state diperbarui.
- Cara menemukan: Menelusuri alur pembaruan state React dan syarat F7 mengenai klik ganda cepat.
- Penyebab dan solusi: Pembaruan state React tidak harus sinkron pada kedua event. Tambahkan `bookingLock.current` dan `resourceLock.current` yang disetel sebelum `await`, lalu dilepas di `finally`. Risiko ini diantisipasi melalui inspeksi kode, belum diverifikasi melalui uji klik ganda di browser.

### Bug/kendala 3 — port terpakai ketika integrasi HTTP
- Gejala: Tes HTTP awal gagal dengan `EADDRINUSE` saat mencoba memakai port 8080.
- Cara menemukan: Menjalankan tes client `fetch` terhadap `server.mjs` yang sebenarnya; output server menunjukkan port 8080 telah dipakai proses lain.
- Penyebab dan solusi: Tes tidak boleh mengasumsikan port bebas; tes sekarang memilih port sementara secara dinamis dan hanya mengganti `BASE_URL` pada salinan modul yang dikompilasi untuk pengujian. Kode aplikasi tetap mengarah ke port 8080 sesuai kontrak.

### Kendala verifikasi
- Gejala: `npm install` tidak dapat mengambil paket dari registry npm pada lingkungan pengerjaan.
- Cara menemukan: Perintah pengecekan npm gagal karena `EAI_AGAIN` (DNS/akses jaringan).
- Penyebab dan solusi: Paket `react`, `vite`, dan dependensinya belum tersedia di lingkungan ini; instal dan jalankan `npm run build` serta uji browser pada mesin dengan akses ke npm. Jangan menandai build berhasil sebelum diperiksa.

## 5. Change Request B — beri tahu peminjaman yang menghalangi

**Kebutuhan resmi:** Pada **POST `/peminjaman`** yang dibalas 409 karena slot/kapasitas penuh, server dengan `--cr B` memberikan objek `{ "error": "...", "bentrok_dengan": [id, ...] }`. Pesan pada `role="alert"` harus mempertahankan `error` dari server dan menyebut hanya ID di `bentrok_dengan`, masing-masing diawali `#`. Jika daftar kosong/tidak ada, cukup tampilkan `error`. CR-B **tidak mengubah PUT**.

**Keputusan desain pada implementasi:** Penambahan dilakukan di fungsi `pesanKesalahan` dalam `src/api/pinjam.ts`, sebelum pesan error dilempar ke `App`. Dengan demikian komponen tetap menangani semua error melalui satu state `error` yang sama, tanpa membuat state baru untuk daftar penghalang atau mengubah form dan daftar. Formatter diberi guard `status === 409`, `method === 'POST'`, dan `path === '/peminjaman'`, sehingga tidak memodifikasi error lain. Hanya ID numerik bulat positif dari array yang ditampilkan; tidak ada ID yang ditebak lewat pencarian list lokal.

**Alur CR-B:** Klik Simpan peminjaman → `App.simpanBooking` → `src/api/pinjam.ts:tambahPeminjaman` → POST JSON → server mengembalikan 409 `{error, bentrok_dengan}` → `request` mengubahnya menjadi pesan `Error` → `catch` `App.simpanBooking` memanggil `setError` → `<div role="alert">` menampilkan pesan. Karena `setForm` dan `setRevision` hanya dijalankan setelah respons sukses, saat 409 form serta daftar peminjaman tidak dikosongkan/diubah.

**Kendala terkait perubahan:** Semula klien `request` hanya menampilkan properti `error` dan mengabaikan `bentrok_dengan`; hal ini diketahui dari perbandingan source dengan dokumen CR-B, bukan dari klaim adanya bug yang ditemukan pengguna di browser. Penyesuaian dan tes regresi dibuat oleh AI. Tes mencakup dua penghalang, penghalang yang tidak beririsan, field kosong/hilang, respons 400/404, PUT 409 yang tidak berubah, dan penggunaan server HTTP asli dengan `--persona A --cr B`.

## 6. Pemeriksaan yang benar-benar dilakukan oleh asisten

- Checkpoint 1: `npm test` lulus **4** tes dasar F1–F3 (kontrak server dan inspeksi JSX).
- Checkpoint 2: `npm test` lulus **19** tes, termasuk tes regresi Checkpoint 1, API client, validator dan inspeksi JSX.
- Checkpoint 3: `npm test` lulus **37** tes otomatis (kontrak API asli dan CR-B, fungsi client dengan mock, integrasi server HTTP asli, validasi, dan kontrak markup statis).
- `tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM src/types.ts src/api/pinjam.ts src/utils/validasi.ts` lulus untuk kode TypeScript API dan validator yang tidak bergantung pada React.
- Server asli tetap sama; pengujian CR-B menjalankan server dengan `--persona A --cr B` pada port uji sementara.
- **Batas verifikasi:** Runtime belum memiliki paket React/Vite dari npm registry karena sebelumnya terjadi kegagalan jaringan `EAI_AGAIN`. Akibatnya `npm run build` penuh dan uji klik interaktif pada browser **belum diverifikasi**. Tes yang memeriksa teks JSX adalah pemeriksaan **statis**, bukan uji DOM. Terdapat panduan pengujian browser di `tests/MANUAL-UI.md`.

**Kendala yang benar-benar terjadi pada proses asistensi AI:** Pengujian HTTP sebelumnya mengalami `EADDRINUSE` saat mengandalkan port 8080, lalu diubah memakai port sementara. Pengambilan paket npm juga gagal karena kendala koneksi DNS (`EAI_AGAIN`); hal ini tidak diubah menjadi klaim bahwa build berhasil. Risiko klik ganda dan konversi nilai DOM dalam bagian 4 merupakan analisis kode, bukan laporan uji browser yang dilakukan pengguna.
