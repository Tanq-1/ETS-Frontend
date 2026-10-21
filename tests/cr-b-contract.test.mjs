// Kontrak server dosen untuk Persona A + CR-B (bukan tes UI).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createApi } from '../server-api/api-core.mjs'

function setup() {
  const api = createApi({ persona: 'A', cr: 'B' })
  function send(method, path, body) {
    const url = new URL(path, 'http://localhost:8080')
    return api.handle({ method, path: url.pathname, query: url.searchParams,
      body: body === undefined ? '' : JSON.stringify(body) })
  }
  const source = (nama, stok = 1) => {
    const result = send('POST', '/sumber-daya', { nama, jenis: 'ruang', stok })
    assert.equal(result.status, 201)
    return result.body
  }
  const booking = (id, changes = {}) => ({
    sumber_daya_id: id, peminjam: 'Rina', tanggal: '2026-11-02',
    slot_mulai: 3, slot_selesai: 4, jumlah: 1, ...changes,
  })
  return { send, source, booking }
}

test('CR-B: respons 409 POST memuat error asli dan id peminjaman penghalang', () => {
  const { send, source, booking } = setup()
  const r = source('Aula A')
  const satu = send('POST', '/peminjaman', booking(r.id))
  assert.equal(satu.status, 201)
  const reject = send('POST', '/peminjaman', booking(r.id, { slot_mulai: 4, slot_selesai: 5 }))
  assert.equal(reject.status, 409)
  assert.equal(reject.body.error, 'slot sudah terpakai (kapasitas penuh)')
  assert.deepEqual(reject.body.bentrok_dengan, [satu.body.id])
  assert.equal(send('GET', '/peminjaman').body.length, 1)
})

test('CR-B: hanya ID yang irisan, sumber daya dan tanggal sama, urut naik', () => {
  const { send, source, booking } = setup()
  const a = source('Aula', 3)
  const b = source('Lab')
  const t1 = send('POST', '/peminjaman', booking(a.id, { slot_mulai: 1, slot_selesai: 2 }))
  const t2 = send('POST', '/peminjaman', booking(a.id, { slot_mulai: 3, slot_selesai: 4 }))
  const t3 = send('POST', '/peminjaman', booking(a.id, { slot_mulai: 3, slot_selesai: 5 }))
  const otherResource = send('POST', '/peminjaman', booking(b.id, { slot_mulai: 3, slot_selesai: 4 }))
  const otherDate = send('POST', '/peminjaman', booking(a.id, { tanggal: '2026-11-03', slot_mulai: 3, slot_selesai: 4 }))
  for (const o of [t1, t2, t3, otherResource, otherDate]) assert.equal(o.status, 201)
  const reject = send('POST', '/peminjaman', booking(a.id, { slot_mulai: 4, slot_selesai: 5, jumlah: 2 }))
  assert.equal(reject.status, 409)
  assert.deepEqual(reject.body.bentrok_dengan, [t2.body.id, t3.body.id])
  assert.equal(send('GET', '/peminjaman').body.length, 5)
})

test('CR-B: peminjaman pada slot bersebelahan diterima', () => {
  const { send, source, booking } = setup()
  const r = source('Lab')
  assert.equal(send('POST', '/peminjaman', booking(r.id, { slot_mulai: 1, slot_selesai: 2 })).status, 201)
  assert.equal(send('POST', '/peminjaman', booking(r.id, { slot_mulai: 3, slot_selesai: 4 })).status, 201)
})

test('CR-B: 400 dan 404 tidak memiliki bentrok_dengan', () => {
  const { send, source, booking } = setup()
  const r = source('Lab')
  const bad = send('POST', '/peminjaman', booking(r.id, { tanggal: '2026-02-30' }))
  assert.equal(bad.status, 400)
  assert.equal(Object.hasOwn(bad.body, 'bentrok_dengan'), false)
  const missing = send('GET', '/peminjaman/999')
  assert.equal(missing.status, 404)
  assert.equal(Object.hasOwn(missing.body, 'bentrok_dengan'), false)
})

test('CR-B: PUT bentrok tetap 409 tanpa field baru, data tidak berubah', () => {
  const { send, source, booking } = setup()
  const r = source('Lab')
  const p = send('POST', '/peminjaman', booking(r.id, { slot_mulai: 1, slot_selesai: 2 })).body
  const q = send('POST', '/peminjaman', booking(r.id, { slot_mulai: 3, slot_selesai: 4 })).body
  const rejectedPut = send('PUT', `/peminjaman/${q.id}`, booking(r.id, { slot_mulai: 1, slot_selesai: 2 }))
  assert.equal(rejectedPut.status, 409)
  assert.deepEqual(rejectedPut.body, { error: 'slot sudah terpakai (kapasitas penuh)' })
  assert.deepEqual(send('GET', `/peminjaman/${q.id}`).body, q)
  assert.equal(send('PUT', `/peminjaman/${q.id}`, booking(r.id, { slot_mulai: 3, slot_selesai: 4 })).status, 200)
  assert.equal(send('GET', `/peminjaman/${p.id}`).body.slot_mulai, 1)
})

test('CR-B: setelah DELETE, penghalang hilang dan slot dapat dipinjam', () => {
  const { send, source, booking } = setup()
  const r = source('Lab')
  const first = send('POST', '/peminjaman', booking(r.id)).body
  assert.deepEqual(send('POST', '/peminjaman', booking(r.id)).body.bentrok_dengan, [first.id])
  assert.equal(send('DELETE', `/peminjaman/${first.id}`).status, 204)
  assert.equal(send('POST', '/peminjaman', booking(r.id)).status, 201)
})
