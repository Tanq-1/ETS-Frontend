# PROSES

## 1. Persona dan masalahnya
Persona A adalah petugas gedung yang melayani pertanyaan ketersediaan ruang dan alat pada tanggal tertentu. Ia membutuhkan informasi per slot agar tidak perlu memeriksa semua peminjaman satu per satu. Papan delapan slot akan dibuat pada Checkpoint 2.

## 2. Rancangan komponen dan state
- `App.tsx`: `resources`, `bookings`, `filter`, `form`, `detail`, `error`, `busyResource`, `busyBooking`, `loadingResource`, `loadingBooking`, dan `revision`.
- `SumberDayaForm`: `nama`, `jenis`, `stok` lokal; `busy` dan `onSave` lewat props.
- `PeminjamanForm`: controlled form lewat `value`, `onChange`, dan `onSave`.
- `FilterPeminjaman`: menampilkan controlled filters yang diteruskan melalui props.
- `DaftarPeminjaman`: menampilkan list dan detail; meneruskan ID ke handler `onDetail`.
- `src/api/pinjam.ts`: semua fungsi pemanggilan API; `src/utils/validasi.ts`: validasi input.
- Rencana Checkpoint 2: tambah edit/hapus, penguncian aksi ganda, dan `PapanKetersediaan` dengan state slot pada komponen sendiri.

## 3. Satu keputusan desain
Keputusan: setelah perubahan peminjaman berhasil, daftar diminta ulang dari server, alih-alih hanya mengubah state array secara optimistis. Alasannya, API menentukan hasil final dan filter yang sedang aktif harus tetap konsisten; pendekatan optimistis berisiko menampilkan peminjaman yang seharusnya tidak termasuk hasil filter.

## 4. Bug atau kendala (minimal dua)
### Bug 1
- Gejala: Input HTML `type="number"` tetap mengembalikan string pada `event.target.value`.
- Cara menemukan: Pemeriksaan kontrak API menunjukkan field `stok`, `jumlah`, dan slot wajib bertipe number.
- Penyebab dan solusi: Nilai DOM berbentuk string; form menggunakan `Number(...)` sebelum dikirim, dan validasi memastikan integer serta batasnya.

### Bug 2
- Gejala: Filter lokal saja tidak memenuhi syarat filter diproses server.
- Cara menemukan: Membandingkan implementasi dengan query string `sumber_daya_id`, `tanggal`, `status` pada requirement.
- Penyebab dan solusi: Filter harus dikirim lewat GET `/peminjaman?...` pada setiap perubahan, bukan hanya `.filter()` di frontend.

## 5. Change request

