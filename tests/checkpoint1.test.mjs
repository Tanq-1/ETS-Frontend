// Checkpoint 1: smoke test F1-F3 dari server dosen dan kontrak tampilan frontend.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createApi } from '../server-api/api-core.mjs'
const api = createApi({ persona: 'A' })
const send = (method, path, data) => {
  const u = new URL(path, 'http://localhost')
  return api.handle({ method, path: u.pathname, query: u.searchParams,
    body: data === undefined ? '' : JSON.stringify(data) })
}

test('F1: POST/GET sumber daya dan trim nama', () => {
  assert.deepEqual(send('GET', '/sumber-daya').body, [])
  const result = send('POST', '/sumber-daya', { nama: ' Aula A ', jenis: 'ruang', stok: 2 })
  assert.equal(result.status, 201)
  assert.equal(result.body.nama, 'Aula A')
  assert.equal(send('GET', '/sumber-daya').body.length, 1)
})

test('F2: POST membuat satu peminjaman dan mengembalikan status aktif', () => {
  const result = send('POST', '/peminjaman', { sumber_daya_id: 1, peminjam: 'Rina', tanggal: '2026-11-02', slot_mulai: 3, slot_selesai: 4, jumlah: 1 })
  assert.equal(result.status, 201)
  assert.equal(result.body.status, 'aktif')
  assert.equal(result.body.slot_mulai, 3)
})

test('F3: filter diproses server dan detail menggunakan ID', () => {
  const list = send('GET', '/peminjaman?sumber_daya_id=1&tanggal=2026-11-02&status=aktif')
  assert.equal(list.status, 200)
  assert.equal(list.body.length, 1)
  assert.equal(send('GET', `/peminjaman/${list.body[0].id}`).body.peminjam, 'Rina')
  assert.deepEqual(send('GET', '/peminjaman?status=dibatalkan').body, [])
})

test('F1-F3: teks/label JSX dan batas fetch src/api tersedia', () => {
  const read = (name) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8')
  const res = read('components/SumberDayaForm.tsx')
  const form = read('components/PeminjamanForm.tsx')
  const filters = read('components/FilterPeminjaman.tsx')
  const app = read('App.tsx')
  const list = read('components/DaftarPeminjaman.tsx')
  for (const label of ['Nama sumber daya','Jenis','Stok','Simpan sumber daya']) assert.ok(res.includes(label))
  for (const label of ['Sumber daya','Peminjam','Tanggal','Slot mulai','Slot selesai','Jumlah','Simpan peminjaman']) assert.ok(form.includes(label))
  for (const label of ['Filter sumber daya','Filter tanggal','Filter status']) assert.ok(filters.includes(label))
  assert.ok(app.includes('Daftar sumber daya'))
  assert.ok(list.includes('Daftar peminjaman'))
  assert.ok(list.includes('Detail peminjaman'))
})
