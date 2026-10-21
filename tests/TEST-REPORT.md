# Bukti pengujian otomatis (oleh asisten)

Kode frontend Persona A, change request **CR-B**.

| Versi | Perintah | Lulus | Gagal | Keterangan |
|---|---|---:|---:|---|
| Checkpoint 1 | `npm test` | 4 | 0 | F1–F3: kontrak server dan keberadaan kontrak JSX |
| Checkpoint 2 | `npm test` | 19 | 0 | F1–F7, papan Persona A, fungsi client HTTP, validator dan inspeksi JSX |
| Checkpoint 3 (CR-B) | `npm test` | 37 | 0 | Seluruh tes regresi + 409 CR-B; perilaku server + formatter frontend + HTTP nyata |
| Checkpoint 3 (CR-B) | `npm run test:api` | 9 | 0 | API contract dan integrasi server `--persona A --cr B` |
| Checkpoint 3 (CR-B) | `npm run test:frontend` | 24 | 0 | Formatter error, client HTTP, validator, inspeksi JSX |

Pengecekan tipe tanpa React juga lulus:

```bash
tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM src/types.ts src/api/pinjam.ts src/utils/validasi.ts
```

**Batas bukti:** Tes JSX menggunakan pemeriksaan statis atas source; pengujian klik, `role=alert` secara DOM, klik ganda sungguhan, dan refresh papan di browser **belum dijalankan**. `npm run build` penuh juga belum bisa dijalankan pada lingkungan asisten karena dependensi React/Vite belum terpasang (akses registry npm gagal `EAI_AGAIN`). Jalankan di komputer pengumpulan dengan `npm install`, `npm run build`, `npm test`, dan checklist `tests/MANUAL-UI.md`.
