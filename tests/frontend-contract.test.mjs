// Pemeriksaan statis struktur frontend terhadap teks/atribut persis di requirement.
// Ini bukan tes interaksi browser; langkah pengujian browser ada di tests/MANUAL-UI.md.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve, relative, sep } from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') }
catch { ts = require(join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'typescript')) }
const root = resolve('src')
const file = (f) => readFileSync(join(root, f), 'utf8')
const app = file('App.tsx')
const resource = file('components/SumberDayaForm.tsx')
const booking = file('components/PeminjamanForm.tsx')
const list = file('components/DaftarPeminjaman.tsx')
const filter = file('components/FilterPeminjaman.tsx')
const board = file('components/PapanKetersediaan.tsx')

function findFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((v) => v.isDirectory()
    ? findFiles(join(dir, v.name))
    : /\.tsx?$/.test(v.name) ? [join(dir, v.name)] : [])
}

test('F1: form sumber daya memuat label dan tombol yang disyaratkan', () => {
  for (const phrase of ['Nama sumber daya', 'Jenis', 'Stok', 'Simpan sumber daya'])
    assert.ok(resource.includes(`>${phrase}<`), `Tidak ditemukan label/tombol: ${phrase}`)
  assert.match(app, /aria-label="Daftar sumber daya"/)
  assert.match(resource, /e\.preventDefault\(\)/)
  assert.match(resource, /onSave\(/)
})

test('F2 dan F6: form peminjaman memuat label dan teks mode edit yang persis', () => {
  for (const phrase of ['Sumber daya', 'Peminjam', 'Tanggal', 'Slot mulai', 'Slot selesai', 'Jumlah'])
    assert.ok(booking.includes(`>${phrase}<`), `Tidak ditemukan label: ${phrase}`)
  assert.match(booking, /Simpan perubahan/)
  assert.match(booking, /Simpan peminjaman/)
  assert.match(booking, /type="date"/)
  assert.match(booking, /e\.preventDefault\(\)/)
  assert.match(app, /ubahPeminjaman\(editingId, input\)/)
  assert.match(app, /hapusPeminjaman\(id\)/)
})

test('F3: label filter, daftar, dan area detail sesuai kontrak', () => {
  for (const phrase of ['Filter sumber daya', 'Filter tanggal', 'Filter status'])
    assert.ok(filter.includes(`>${phrase}<`))
  assert.match(list, /aria-label="Daftar peminjaman"/)
  assert.match(list, /aria-label="Detail peminjaman"/)
  for (const label of ['Detail', 'Edit', 'Hapus']) assert.ok(list.includes(`>${label}<`))
  assert.match(list, /Slot \{it\.slot_mulai\}-\{it\.slot_selesai\}/)
})

test('F4-F5/CR-B: error tampil melalui role alert dan tidak mereset form saat gagal', () => {
  assert.match(app, /role="alert"/)
  assert.match(app, /setError\(pesanError\(err\)\)/)
  const handler = app.match(/async function simpanBooking\(\)[\s\S]*?(?=async function hapusBooking)/)?.[0] ?? ''
  assert.match(handler, /setForm\(\{ \.\.\.formKosong \}\)/)
  assert.match(handler, /catch \(err\) \{[\s\S]*?setError\(pesanError\(err\)\)/)
  assert.doesNotMatch(handler.match(/catch \(err\) \{[\s\S]*?\} finally/)?.[0] ?? '', /setForm\(/)
})

test('F7: guard duplikasi dan refresh berdasarkan data server setelah mutasi', () => {
  assert.match(app, /bookingLock\.current/)
  assert.match(app, /resourceLock\.current/)
  const mutate = app.match(/async function simpanBooking[\s\S]*?async function lihatDetail/)?.[0] ?? ''
  assert.equal((mutate.match(/setRevision\(\(n\) => n \+ 1\)/g) ?? []).length, 2)
  assert.match(app, /\[filter, revision\]/)
})

test('Persona A: papan memuat label dan delapan slot serta efek reload', () => {
  for (const phrase of ['Sumber daya (ketersediaan)', 'Tanggal (ketersediaan)', 'Lihat ketersediaan'])
    assert.ok(board.includes(`>${phrase}<`))
  assert.match(board, /aria-label="Ketersediaan slot"/)
  assert.match(board, /Slot \{entry\.slot\} - Sisa \{entry\.sisa\}/)
  assert.match(board, /\[pilihanAktif, revision, onError\]/)
  assert.match(board, /tanggalValid\(tanggal\)/)
  assert.match(board, /lihatKetersediaan\(pilihanAktif\.sumber_daya_id, pilihanAktif\.tanggal\)/)
})

test('Ketentuan teknis: fetch hanya dalam src/api dan tidak ada tipe any atau library terlarang', () => {
  const files = findFiles(root)
  assert.equal(files.length >= 8, true)
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    if (relative(root, f).split(sep)[0] !== 'api')
      assert.doesNotMatch(src, /\bfetch\s*\(/, `fetch di luar src/api: ${f}`)
    assert.doesNotMatch(src, /window\.(alert|confirm|prompt)\s*\(/)
    const ast = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, f.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    function visit(node) {
      assert.notEqual(node.kind, ts.SyntaxKind.AnyKeyword, `Tipe any di ${f}`)
      ts.forEachChild(node, visit)
    }
    visit(ast)
  }
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const forbidden of ['axios', 'react-router-dom', 'zustand', 'redux', '@mui/material', '@tanstack/react-query', 'zod', 'react-hook-form']) {
    assert.equal(Object.hasOwn({ ...pkg.dependencies, ...pkg.devDependencies }, forbidden), false)
  }
  assert.match(app, /export default function App\(\)/)
})
