// Menguji fungsi API yang digunakan frontend terhadap server HTTP asli.
// Butuh TypeScript (tersedia setelah npm install). Bukan tes UI React.
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import net from 'node:net'

const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') }
catch { ts = require(join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'typescript')) }
const source = readFileSync(new URL('../src/api/pinjam.ts', import.meta.url), 'utf8')
async function availablePort() {
  const server = net.createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Port lokal tidak tersedia')
  const port = address.port
  await new Promise((resolve) => server.close(resolve))
  return port
}

async function waitReady(child, port) {
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk.toString() })
  child.stderr.on('data', (chunk) => { output += chunk.toString() })
  for (let i = 0; i < 60; i++) {
    if (output.includes(`http://localhost:${port}`)) return
    if (child.exitCode !== null) throw new Error(`Server gagal dijalankan: ${output}`)
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error(`Server tidak siap: ${output}`)
}

test('fetch client memanggil endpoint Persona A dan memproses 409/204 dengan benar', async () => {
  const port = await availablePort()
  const testSource = source.replace("const BASE_URL = 'http://localhost:8080'", `const BASE_URL = 'http://localhost:${port}'`)
  const compiled = ts.transpileModule(testSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  const client = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
  const child = spawn(process.execPath, ['server-api/server.mjs', '--persona', 'A', '--port', String(port)], {
    cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'],
  })
  try {
    await waitReady(child, port)
    assert.deepEqual(await client.daftarSumberDaya(), [])
    const ruang = await client.tambahSumberDaya({ nama: ' Aula ', jenis: 'ruang', stok: 1 })
    const filter = { sumber_daya_id: String(ruang.id), tanggal: '2026-11-02', status: 'aktif' }
    const body = { sumber_daya_id: ruang.id, peminjam: 'Rina', tanggal: '2026-11-02', slot_mulai: 3, slot_selesai: 4, jumlah: 1 }
    const pinjam = await client.tambahPeminjaman(body)
    assert.equal((await client.daftarPeminjaman(filter)).length, 1)
    assert.deepEqual(await client.detailPeminjaman(pinjam.id), pinjam)
    assert.equal((await client.lihatKetersediaan(ruang.id, body.tanggal)).slot[2].tersedia, false)
    await assert.rejects(() => client.tambahPeminjaman(body), { message: 'slot sudah terpakai (kapasitas penuh)' })
    await client.ubahPeminjaman(pinjam.id, { ...body, slot_mulai: 5, slot_selesai: 6 })
    assert.equal((await client.lihatKetersediaan(ruang.id, body.tanggal)).slot[2].sisa, 1)
    assert.equal(await client.hapusPeminjaman(pinjam.id), undefined)
    assert.deepEqual(await client.daftarPeminjaman(filter), [])
  } finally {
    child.kill('SIGTERM')
  }
})
