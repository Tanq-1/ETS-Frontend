// Integrasi nyata fungsi fetch frontend ↔ server.mjs Persona A dengan --cr B.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import net from 'node:net'

const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') }
catch { ts = require(join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'typescript')) }
const source = readFileSync(new URL('../src/api/pinjam.ts', import.meta.url), 'utf8')
async function portKosong() {
  const srv = net.createServer()
  await new Promise((resolve, reject) => srv.once('error', reject).listen(0, '127.0.0.1', resolve))
  const address = srv.address()
  if (!address || typeof address === 'string') throw new Error('Gagal memperoleh port tes')
  await new Promise((resolve) => srv.close(resolve))
  return address.port
}
async function siap(child, port) {
  let msg = ''
  child.stdout.on('data', (chunk) => { msg += String(chunk) })
  child.stderr.on('data', (chunk) => { msg += String(chunk) })
  for (let i = 0; i < 80; i++) {
    if (msg.includes(`http://localhost:${port}`)) return
    if (child.exitCode !== null) throw new Error(msg)
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error(`Server tidak siap: ${msg}`)
}

test('HTTP Persona A + CR-B: error yang dilihat frontend memuat hanya ID penghalang yang valid', async () => {
  const port = await portKosong()
  const js = ts.transpileModule(source.replace("const BASE_URL = 'http://localhost:8080'", `const BASE_URL = 'http://localhost:${port}'`),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  const frontendApi = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
  const child = spawn(process.execPath, ['server-api/server.mjs', '--persona', 'A', '--cr', 'B', '--port', String(port)],
    { cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'] })
  try {
    await siap(child, port)
    const r = await frontendApi.tambahSumberDaya({ nama: 'Aula', jenis: 'ruang', stok: 2 })
    const q = { sumber_daya_id: r.id, peminjam: 'Rina', tanggal: '2026-11-02', slot_mulai: 2, slot_selesai: 3, jumlah: 1 }
    const p1 = await frontendApi.tambahPeminjaman(q)
    const p2 = await frontendApi.tambahPeminjaman({ ...q, slot_mulai: 3, slot_selesai: 4 })
    const p3 = await frontendApi.tambahPeminjaman({ ...q, slot_mulai: 6, slot_selesai: 7 })
    await assert.rejects(() => frontendApi.tambahPeminjaman({ ...q, slot_mulai: 3, slot_selesai: 4 }),
      { message: `slot sudah terpakai (kapasitas penuh). Bentrok dengan peminjaman #${p1.id}, #${p2.id}` })
    assert.equal((await frontendApi.daftarPeminjaman({ sumber_daya_id: '', tanggal: '', status: '' })).length, 3)
    // CR-B tidak memodifikasi PUT; pesan server tetap seperti semula.
    await assert.rejects(() => frontendApi.ubahPeminjaman(p3.id, { ...q, slot_mulai: 3, slot_selesai: 4 }),
      { message: 'slot sudah terpakai (kapasitas penuh)' })
    await frontendApi.hapusPeminjaman(p1.id)
    await frontendApi.hapusPeminjaman(p2.id)
    const success = await frontendApi.tambahPeminjaman({ ...q, slot_mulai: 3, slot_selesai: 4 })
    assert.equal(success.status, 'aktif')
  } finally {
    child.kill('SIGTERM')
    await new Promise((resolve) => {
      if (child.exitCode !== null) resolve()
      else child.once('exit', resolve)
    })
  }
})
