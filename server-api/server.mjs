// Server API PinjamKampus untuk ETS Frontend. Tanpa dependensi, butuh Node.js 18+.
//
//   node server.mjs --persona C
//   node server.mjs --persona C --cr B        (setelah menerima lembar change request)
//   node server.mjs --persona A --port 8080 --delay 300
//
// Data disimpan di memori: hilang saat server dihentikan.
import http from 'node:http'
import { createApi } from './api-core.mjs'

function arg(name, def) {
  const i = process.argv.indexOf('--' + name)
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1]
  const eq = process.argv.find((a) => a.startsWith('--' + name + '='))
  return eq ? eq.slice(name.length + 3) : def
}

const persona = String(arg('persona', '')).toUpperCase()
if (!/^[A-E]$/.test(persona)) {
  console.error('Wajib menyebut persona kalian: node server.mjs --persona A|B|C|D|E')
  process.exit(1)
}
const cr = String(arg('cr', 'none')).toUpperCase()
if (!['NONE', 'A', 'B', 'C'].includes(cr)) {
  console.error('Nilai --cr harus A, B, atau C (atau kosongkan).')
  process.exit(1)
}
const port = Number(arg('port', '8080'))
const delay = Number(arg('delay', '0'))

const api = createApi({ persona, cr: cr === 'NONE' ? 'none' : cr })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS)
    res.end()
    return
  }
  const url = new URL(req.url, 'http://localhost')
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8')
    const hasil = api.handle({ method: req.method, path: url.pathname, query: url.searchParams, body })
    const kirim = () => {
      if (hasil.body === undefined) {
        res.writeHead(hasil.status, CORS)
        res.end()
      } else {
        res.writeHead(hasil.status, { ...CORS, 'Content-Type': 'application/json' })
        res.end(JSON.stringify(hasil.body))
      }
      console.log(`${req.method} ${url.pathname}${url.search} -> ${hasil.status}`)
    }
    if (delay > 0) setTimeout(kirim, delay)
    else kirim()
  })
})

server.listen(port, () => {
  console.log(`PinjamKampus API  persona ${persona}${cr !== 'NONE' ? ' + CR-' + cr : ''}  http://localhost:${port}`)
  console.log('Data disimpan di memori. Hentikan dengan Ctrl+C.')
})
