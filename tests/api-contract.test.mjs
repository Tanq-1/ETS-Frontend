// Tes kontrak server bawaan secara independen dari React.
// Tidak mengubah server dan tidak mengklaim ini sebagai tes browser/frontend.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createApi } from '../server-api/api-core.mjs'

function client() {
  const api = createApi({ persona: 'A' })
  const send = (method, path, obj) => {
    const url = new URL(`http://localhost${path}`)
    return api.handle({ method, path: url.pathname, query: url.searchParams, body: obj === undefined ? '' : JSON.stringify(obj) })
  }
  return { send }
}

const pesan = (sumber_daya_id, data = {}) => ({
  sumber_daya_id, peminjam: 'Rina', tanggal: '2026-11-02', slot_mulai: 3, slot_selesai: 4, jumlah: 1,
  ...data,
})

test('F1/F2/F3 dan board ketersediaan berbagi data server', () => {
  const { send } = client()
  assert.deepEqual(send('GET', '/sumber-daya').body, [])
  const dibuat = send('POST', '/sumber-daya', { nama: ' Aula A ', jenis: 'ruang', stok: 2 })
  assert.equal(dibuat.status, 201)
  assert.equal(dibuat.body.nama, 'Aula A')
  const id = dibuat.body.id

  const pertama = send('POST', '/peminjaman', pesan(id, { jumlah: 2 }))
  assert.equal(pertama.status, 201)
  const k1 = send('GET', `/sumber-daya/${id}/ketersediaan?tanggal=2026-11-02`)
  assert.equal(k1.status, 200)
  assert.equal(k1.body.slot.length, 8)
  assert.deepEqual(k1.body.slot[2], { slot: 3, sisa: 0, tersedia: false })
  assert.deepEqual(k1.body.slot[0], { slot: 1, sisa: 2, tersedia: true })

  const bentrok = send('POST', '/peminjaman', pesan(id, { slot_mulai: 4, slot_selesai: 5 }))
  assert.equal(bentrok.status, 409)
  assert.equal(bentrok.body.error, 'slot sudah terpakai (kapasitas penuh)')
  assert.equal(send('GET', '/peminjaman').body.length, 1)

  const kedua = send('POST', '/peminjaman', pesan(id, { slot_mulai: 5, slot_selesai: 6 }))
  assert.equal(kedua.status, 201)
  const daftar = send('GET', `/peminjaman?sumber_daya_id=${id}&tanggal=2026-11-02&status=aktif`)
  assert.equal(daftar.body.length, 2)
  assert.deepEqual(send('GET', `/peminjaman/${pertama.body.id}`).body, pertama.body)

  const ubah = send('PUT', `/peminjaman/${pertama.body.id}`, pesan(id, { slot_mulai: 1, slot_selesai: 2, jumlah: 2 }))
  assert.equal(ubah.status, 200)
  const k2 = send('GET', `/sumber-daya/${id}/ketersediaan?tanggal=2026-11-02`).body.slot
  assert.equal(k2[0].sisa, 0)
  assert.equal(k2[2].sisa, 2)

  const hapus = send('DELETE', `/peminjaman/${pertama.body.id}`)
  assert.equal(hapus.status, 204)
  assert.equal(hapus.body, undefined)
  assert.equal(send('GET', `/sumber-daya/${id}/ketersediaan?tanggal=2026-11-02`).body.slot[0].sisa, 2)
  assert.equal(send('GET', '/peminjaman').body.length, 1)
})

test('Tanggal tidak valid, id tidak ada, dan validasi error tanpa perubahan data', () => {
  const { send } = client()
  const r = send('POST', '/sumber-daya', { nama: 'Lab', jenis: 'ruang', stok: 1 }).body
  const bad = send('POST', '/peminjaman', pesan(r.id, { tanggal: '2026-02-30' }))
  assert.equal(bad.status, 400)
  assert.match(bad.body.error, /tanggal/)
  assert.equal(send('GET', '/peminjaman').body.length, 0)
  assert.equal(send('GET', `/sumber-daya/${r.id}/ketersediaan?tanggal=`).status, 400)
  assert.equal(send('GET', '/peminjaman/999').status, 404)
})
