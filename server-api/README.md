# Server API PinjamKampus (untuk mahasiswa)

Server tiruan layanan peminjaman ruang dan alat kampus. Tanpa instalasi; hanya butuh **Node.js 18 atau lebih baru** (`node --version`).

```bash
node server-api/server.mjs --persona C
```

Ganti `C` dengan persona yang kamu undi (A sampai E). Server berjalan di `http://localhost:8080`.

| Opsi | Fungsi |
|---|---|
| `--persona A..E` | **Wajib.** Memilih perilaku dan endpoint tambahan sesuai kartu persona |
| `--cr A..C` | Dipakai setelah menerima lembar change request (sesuai lembar yang kamu dapat) |
| `--delay 800` | Menunda setiap respons 800 ms, untuk melihat tampilan "Memuat..." |
| `--port 8081` | Mengganti port (alamat di kodemu harus ikut berubah) |

Catatan:

- Data disimpan di memori dan **hilang saat server dihentikan** (Ctrl+C). Itu normal.
- Server mengizinkan permintaan dari browser (CORS), jadi `npm run dev` Vite bisa langsung memanggilnya.
- Setiap permintaan dicatat di terminal server beserta kode statusnya; berguna untuk melihat apa yang sebenarnya dikirim aplikasimu.
- Kesalahan selalu berbentuk `{"error": "pesan"}` dengan status 400, 404, atau 409.
- Jangan mengubah `api-core.mjs`. Yang dinilai adalah aplikasi React kamu, dan pengujian memakai versi aslinya.
