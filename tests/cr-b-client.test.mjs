// Perilaku *kode frontend* src/api/pinjam.ts saat menerima berbagai respons.
// Mock fetch untuk menguji juga respons yang tidak dapat dipicu dari server Persona A.
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
const source = readFileSync(new URL('../src/api/pinjam.ts', import.meta.url), 'utf8')
const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const client = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)

const booking = { sumber_daya_id: 1, peminjam: 'Rina', tanggal: '2026-11-02', slot_mulai: 3, slot_selesai: 4, jumlah: 1 }

async function withMock({ status, body, expectedPath, expectedMethod }, operation) {
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = async (url, init = {}) => {
    calls++
    if (expectedPath) assert.equal(new URL(url).pathname, expectedPath)
    if (expectedMethod) assert.equal(init.method ?? 'GET', expectedMethod)
    if (status === 204) return new Response(null, { status: 204 })
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  }
  try { await operation(); assert.equal(calls, 1) }
  finally { globalThis.fetch = original }
}

// Menggunakan concurrency false karena setiap tes mengganti global fetch.
test('CR-B frontend: error 409 + dua ID ditampilkan dengan #', { concurrency: false }, async () => {
  await withMock({ status: 409, body: { error: 'slot sudah terpakai (kapasitas penuh)', bentrok_dengan: [1, 2] }, expectedPath: '/peminjaman', expectedMethod: 'POST' }, async () => {
    await assert.rejects(() => client.tambahPeminjaman(booking), { message: 'slot sudah terpakai (kapasitas penuh). Bentrok dengan peminjaman #1, #2' })
  })
})

test('CR-B frontend: hanya ID dari respons yang ditampilkan', { concurrency: false }, async () => {
  await withMock({ status: 409, body: { error: 'penuh', bentrok_dengan: [2, 7] } }, async () => {
    await assert.rejects(() => client.tambahPeminjaman(booking), { message: 'penuh. Bentrok dengan peminjaman #2, #7' })
  })
})

test('CR-B frontend: array [] mempertahankan error asli', { concurrency: false }, async () => {
  await withMock({ status: 409, body: { error: 'penuh', bentrok_dengan: [] } }, async () => {
    await assert.rejects(() => client.tambahPeminjaman(booking), { message: 'penuh' })
  })
})

test('CR-B frontend: field tidak tersedia mempertahankan error asli', { concurrency: false }, async () => {
  await withMock({ status: 409, body: { error: 'penuh' } }, async () => {
    await assert.rejects(() => client.tambahPeminjaman(booking), { message: 'penuh' })
  })
})

test('CR-B frontend: field tidak berbentuk array tidak merusak aplikasi', { concurrency: false }, async () => {
  await withMock({ status: 409, body: { error: 'penuh', bentrok_dengan: '1,2' } }, async () => {
    await assert.rejects(() => client.tambahPeminjaman(booking), { message: 'penuh' })
  })
})

test('CR-B frontend: hanya id positif integer yang disebut', { concurrency: false }, async () => {
  await withMock({ status: 409, body: { error: 'penuh', bentrok_dengan: [1, 'abc', -2, 3.2, 7] } }, async () => {
    await assert.rejects(() => client.tambahPeminjaman(booking), { message: 'penuh. Bentrok dengan peminjaman #1, #7' })
  })
})

test('CR-B frontend: PUT 409 tidak menggunakan daftar ID meskipun dikirim', { concurrency: false }, async () => {
  await withMock({ status: 409, body: { error: 'penuh', bentrok_dengan: [1] }, expectedPath: '/peminjaman/3', expectedMethod: 'PUT' }, async () => {
    await assert.rejects(() => client.ubahPeminjaman(3, booking), { message: 'penuh' })
  })
})

test('CR-B frontend: status 400 tetap menampilkan error asli', { concurrency: false }, async () => {
  await withMock({ status: 400, body: { error: 'tanggal tidak valid', bentrok_dengan: [1] } }, async () => {
    await assert.rejects(() => client.tambahPeminjaman(booking), { message: 'tanggal tidak valid' })
  })
})

test('CR-B frontend: status 404 tetap menampilkan error asli', { concurrency: false }, async () => {
  await withMock({ status: 404, body: { error: 'data tidak ditemukan' } }, async () => {
    await assert.rejects(() => client.detailPeminjaman(99), { message: 'data tidak ditemukan' })
  })
})

test('CR-B frontend: DELETE 204 diproses tanpa JSON body', { concurrency: false }, async () => {
  await withMock({ status: 204, expectedMethod: 'DELETE' }, async () => {
    assert.equal(await client.hapusPeminjaman(9), undefined)
  })
})

test('CR-B frontend: gagal koneksi menghasilkan pesan ramah', { concurrency: false }, async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => { throw new TypeError('fetch failed') }
  try { await assert.rejects(() => client.tambahPeminjaman(booking), /Gagal menghubungi server/) }
  finally { globalThis.fetch = original }
})
