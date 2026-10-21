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

## 5. Change request
Belum ada lembar CR yang diberikan untuk Persona A. Belum ada perubahan CR pada kode dan server tetap dijalankan tanpa `--cr`. Setelah mendapatkan lembar, bagian ini harus diisi dengan perilaku yang diminta, berkas yang berubah, keputusan desain, dan bukti pengujian yang dilakukan.

## 6. Pemeriksaan yang dilakukan
- `node --test tests/api-contract.test.mjs`: 2 tes kontrak API lulus.
- `tests/api-client.test.mjs`: 1 tes integrasi HTTP dengan kode client `fetch` asli lulus, setelah konflik port awal diperbaiki.
- `tests/validasi.test.mjs`: 3 tes validator lokal menolak input tidak valid dan menerima input benar.
- `tsc --noEmit --strict --target es2022 --module esnext --moduleResolution bundler src/types.ts src/utils/validasi.ts`: lulus untuk tipe dan validator yang tidak bergantung React.
- Semua 10 berkas `.ts/.tsx` diparse oleh TypeScript transpiler: 0 error sintaks.
- Belum mengklaim `npm run build` dan tes browser lulus sampai paket React/Vite dapat dipasang.
