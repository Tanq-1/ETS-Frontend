// Menjalankan fungsi validasi TypeScript asli tanpa runtime React.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') }
catch { ts = require(join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'typescript')) }
const source = readFileSync(new URL('../src/utils/validasi.ts', import.meta.url), 'utf8')
const output = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { tanggalValid, cekSumberDaya, cekPeminjaman } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)

const s = [{ id: 1, nama: 'Aula', jenis: 'ruang', stok: 2 }]
const peminjaman = { sumber_daya_id: 1, peminjam: 'Rina', tanggal: '2026-11-02', slot_mulai: 3, slot_selesai: 4, jumlah: 1 }

test('cek kalender dengan tahun kabisat dan tanggal mustahil', () => {
  assert.equal(tanggalValid('2024-02-29'), true)
  assert.equal(tanggalValid('2026-02-29'), false)
  assert.equal(tanggalValid('2026-02-30'), false)
  assert.equal(tanggalValid('2026-13-01'), false)
  assert.equal(tanggalValid('2026-11-02'), true)
})

test('validasi sumber daya tidak menerima nama kosong, stok decimal, atau stok nol', () => {
  assert.match(cekSumberDaya({ nama: '   ', jenis: 'ruang', stok: 1 }), /Nama sumber daya/)
  assert.match(cekSumberDaya({ nama: 'Aula', jenis: 'ruang', stok: 1.5 }), /Stok/)
  assert.match(cekSumberDaya({ nama: 'Aula', jenis: 'alat', stok: 0 }), /Stok/)
  assert.equal(cekSumberDaya({ nama: ' Proyektor ', jenis: 'alat', stok: 1 }), null)
})

test('validasi peminjaman menangkap pilihan, slot, tanggal, dan jumlah tidak valid', () => {
  assert.match(cekPeminjaman({ ...peminjaman, sumber_daya_id: 0 }, s), /Pilih sumber daya/)
  assert.match(cekPeminjaman({ ...peminjaman, peminjam: '  ' }, s), /Peminjam/)
  assert.match(cekPeminjaman({ ...peminjaman, tanggal: '' }, s), /Tanggal/)
  assert.match(cekPeminjaman({ ...peminjaman, slot_mulai: 5, slot_selesai: 4 }, s), /Slot/)
  assert.match(cekPeminjaman({ ...peminjaman, jumlah: 3 }, s), /Jumlah/)
  assert.match(cekPeminjaman({ ...peminjaman, jumlah: 1.5 }, s), /Jumlah/)
  assert.equal(cekPeminjaman(peminjaman, s), null)
})

test('batas panjang 50 karakter dihitung setelah trim, termasuk karakter Unicode', () => {
  const fifty = 'X'.repeat(50)
  const fiftyOne = 'X'.repeat(51)
  assert.equal(cekSumberDaya({ nama: ` ${fifty} `, jenis: 'ruang', stok: 1 }), null)
  assert.match(cekSumberDaya({ nama: fiftyOne, jenis: 'ruang', stok: 1 }), /maksimal 50/)
  assert.equal(cekPeminjaman({ ...peminjaman, peminjam: ` ${fifty} ` }, s), null)
  assert.match(cekPeminjaman({ ...peminjaman, peminjam: fiftyOne }, s), /maksimal 50/)
})

test('batas slot 1 dan 8, stok tepat maksimum, dan jumlah nol', () => {
  assert.equal(cekPeminjaman({ ...peminjaman, slot_mulai: 1, slot_selesai: 8, jumlah: 2 }, s), null)
  assert.match(cekPeminjaman({ ...peminjaman, slot_mulai: 0 }, s), /Slot/)
  assert.match(cekPeminjaman({ ...peminjaman, slot_selesai: 9 }, s), /Slot/)
  assert.match(cekPeminjaman({ ...peminjaman, jumlah: 0 }, s), /Jumlah/)
})
