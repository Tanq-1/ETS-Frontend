// Inti API PinjamKampus (tiruan dari API backend Go), tanpa dependensi.
// Dipakai oleh server.mjs (HTTP sungguhan) dan oleh test dosen (fetch palsu).
//
//   createApi({ persona: 'A'|'B'|'C'|'D'|'E', cr: 'none'|'A'|'B'|'C' })
//     .handle({ method, path, query: URLSearchParams, body: string }) -> { status, body? }
//
// Perilaku mengikuti solusi acuan Go (ets-pinjam-kampus/referensi/<persona><CR>).

const MAX_SLOT = 8

export function createApi({ persona = 'A', cr = 'none' } = {}) {
  const P = String(persona).toUpperCase()
  const CR = String(cr).toUpperCase() === 'NONE' ? 'none' : String(cr).toUpperCase()
  const statusAwal = P === 'C' ? 'diajukan' : 'aktif'

  const st = { res: [], items: [], blokirs: [], nextRes: 1, nextItem: 1, nextPaket: 1, nextBlokir: 1 }

  // ---------------------------------------------------------------- util
  const ok = (status, body) => ({ status, body })
  const err = (status, msg, extra) => ({ status, body: { error: msg, ...(extra || {}) } })
  const noContent = () => ({ status: 204 })

  const trimRunes = (s, max) => {
    const t = s.trim()
    return t === '' || [...t].length > max ? null : t
  }

  function tanggalValid(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
    const [y, m, d] = s.split('-').map(Number)
    const dt = new Date(Date.UTC(2000, 0, 1))
    dt.setUTCFullYear(y, m - 1, d)
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  }

  const parseId = (s) => {
    if (!/^[+-]?\d+$/.test(s)) return null
    const n = Number(s)
    return Number.isSafeInteger(n) ? n : null
  }
  const isInt = (v) => typeof v === 'number' && Number.isInteger(v)
  const isStr = (v) => typeof v === 'string'

  const blocking = (it) => it.status === 'aktif' || it.status === 'diajukan' || it.status === 'disetujui'
  const overlap = (a1, a2, b1, b2) => a1 <= b2 && b1 <= a2
  const findRes = (id) => st.res.find((r) => r.id === id)
  const findItem = (id) => st.items.find((it) => it.id === id)

  function parseBody(text) {
    if (text == null || text === '') return { bad: true }
    try {
      const v = JSON.parse(text)
      return { value: v && typeof v === 'object' && !Array.isArray(v) ? v : null, bad: v === null || typeof v !== 'object' || Array.isArray(v) }
    } catch {
      return { bad: true }
    }
  }

  // Salinan objek peminjaman dengan urutan field yang sama seperti backend.
  function viewItem(it) {
    const o = {
      id: it.id,
      sumber_daya_id: it.sumber_daya_id,
      peminjam: it.peminjam,
      tanggal: it.tanggal,
      slot_mulai: it.slot_mulai,
      slot_selesai: it.slot_selesai,
      jumlah: it.jumlah,
      status: it.status,
    }
    if (P === 'C') o.alasan = it.alasan
    if (P === 'D') o.paket_id = it.paket_id
    return o
  }

  // ---------------------------------------------------------------- validasi peminjaman
  const FIELD_ITEM = { sumber_daya_id: isInt, peminjam: isStr, tanggal: isStr, slot_mulai: isInt, slot_selesai: isInt, jumlah: isInt }

  // Mengembalikan { bad: true } bila tipe salah (gagal decode), atau { in } bila bentuk benar (field boleh hilang).
  function decodeFields(obj, spec) {
    const out = {}
    for (const [k, check] of Object.entries(spec)) {
      const v = obj[k]
      if (v === undefined || v === null) continue
      if (!check(v)) return { bad: true }
      out[k] = v
    }
    return { in: out }
  }

  function validate(inp) {
    const need = ['sumber_daya_id', 'peminjam', 'tanggal', 'slot_mulai', 'slot_selesai', 'jumlah']
    if (need.some((k) => inp[k] === undefined)) return { msg: 'sumber_daya_id, peminjam, tanggal, slot_mulai, slot_selesai, dan jumlah wajib diisi' }
    const peminjam = trimRunes(inp.peminjam, 50)
    if (peminjam === null) return { msg: 'peminjam wajib diisi (maksimal 50 karakter)' }
    if (!tanggalValid(inp.tanggal)) return { msg: 'tanggal harus berformat YYYY-MM-DD dan valid' }
    const m = inp.slot_mulai
    const e = inp.slot_selesai
    if (m < 1 || e > MAX_SLOT || m > e) return { msg: 'slot harus 1 sampai 8 dan slot_mulai <= slot_selesai' }
    if (P === 'B' && e - m + 1 > 3) return { msg: 'durasi maksimal 3 slot' }
    const res = findRes(inp.sumber_daya_id)
    if (!res) return { msg: 'sumber daya tidak ditemukan' }
    if (inp.jumlah < 1 || inp.jumlah > res.stok) return { msg: 'jumlah harus antara 1 dan stok sumber daya' }
    return { q: { res, peminjam, tanggal: inp.tanggal, mulai: m, selesai: e, jumlah: inp.jumlah } }
  }

  function usage(resId, tanggal, slot, exclude) {
    let n = 0
    for (const it of st.items) {
      if (it.id === exclude || !blocking(it) || it.sumber_daya_id !== resId || it.tanggal !== tanggal) continue
      if (slot >= it.slot_mulai && slot <= it.slot_selesai) n += it.jumlah
    }
    return n
  }

  function bentrok(q, exclude) {
    let conflict = false
    for (let sl = q.mulai; sl <= q.selesai; sl++) {
      if (usage(q.res.id, q.tanggal, sl, exclude) + q.jumlah > q.res.stok) conflict = true
    }
    if (P === 'E') {
      for (const b of st.blokirs) {
        if (b.sumber_daya_id === q.res.id && b.tanggal === q.tanggal && overlap(q.mulai, q.selesai, b.slot_mulai, b.slot_selesai)) conflict = true
      }
    }
    const ids = []
    for (const it of st.items) {
      if (it.id === exclude || !blocking(it) || it.sumber_daya_id !== q.res.id || it.tanggal !== q.tanggal) continue
      if (overlap(q.mulai, q.selesai, it.slot_mulai, it.slot_selesai)) ids.push(it.id)
    }
    return { conflict, ids }
  }

  function kuotaPakai(peminjam, tanggal, exclude) {
    let n = 0
    for (const it of st.items) {
      if (it.id !== exclude && blocking(it) && it.peminjam === peminjam && it.tanggal === tanggal) n++
    }
    return n
  }

  function tambah(q, paketId) {
    const it = {
      id: st.nextItem++,
      sumber_daya_id: q.res.id,
      peminjam: q.peminjam,
      tanggal: q.tanggal,
      slot_mulai: q.mulai,
      slot_selesai: q.selesai,
      jumlah: q.jumlah,
      status: statusAwal,
      alasan: '',
      paket_id: paketId,
    }
    st.items.push(it)
    return it
  }

  const msgBentrok = 'slot sudah terpakai (kapasitas penuh)'
  const msgKuota = 'kuota peminjam pada tanggal itu sudah penuh (maksimal 2)'

  // ---------------------------------------------------------------- handler
  function createRes(body) {
    const b = parseBody(body)
    if (b.bad || !b.value) return err(400, 'body bukan JSON yang valid atau ada field yang belum diisi')
    const d = decodeFields(b.value, { nama: isStr, jenis: isStr, stok: isInt })
    if (d.bad || d.in.nama === undefined || d.in.jenis === undefined || d.in.stok === undefined)
      return err(400, 'body bukan JSON yang valid atau ada field yang belum diisi')
    const nama = trimRunes(d.in.nama, 50)
    if (nama === null) return err(400, 'nama wajib diisi (maksimal 50 karakter)')
    if (d.in.jenis !== 'ruang' && d.in.jenis !== 'alat') return err(400, 'jenis harus ruang atau alat')
    if (d.in.stok < 1) return err(400, 'stok minimal 1')
    const r = { id: st.nextRes++, nama, jenis: d.in.jenis, stok: d.in.stok }
    st.res.push(r)
    return ok(201, r)
  }

  function createItem(body) {
    const b = parseBody(body)
    if (b.bad) return err(400, 'body bukan JSON yang valid')
    const d = decodeFields(b.value, FIELD_ITEM)
    if (d.bad) return err(400, 'body bukan JSON yang valid')
    const v = validate(d.in)
    if (v.msg) return err(400, v.msg)
    if (P === 'B' && kuotaPakai(v.q.peminjam, v.q.tanggal, 0) >= 2) return err(409, msgKuota)
    const bt = bentrok(v.q, 0)
    if (bt.conflict) return err(409, msgBentrok, CR === 'B' ? { bentrok_dengan: bt.ids } : null)
    return ok(201, viewItem(tambah(v.q, 0)))
  }

  function listItems(query) {
    let resFilter = 0
    if (query.get('sumber_daya_id') !== null && query.get('sumber_daya_id') !== '') {
      const n = parseId(query.get('sumber_daya_id'))
      if (n === null) return err(400, 'sumber_daya_id harus berupa angka')
      resFilter = n
    }
    const hasRes = (query.get('sumber_daya_id') || '') !== ''
    const tgl = query.get('tanggal') || ''
    const status = query.get('status') || ''
    const out = st.items
      .filter((it) => (!hasRes || it.sumber_daya_id === resFilter) && (!tgl || it.tanggal === tgl) && (!status || it.status === status))
      .map(viewItem)
    return ok(200, out)
  }

  function updateItem(id, body) {
    const it = findItem(id)
    if (!it) return err(404, 'peminjaman tidak ditemukan')
    const b = parseBody(body)
    if (b.bad) return err(400, 'body bukan JSON yang valid')
    const d = decodeFields(b.value, FIELD_ITEM)
    if (d.bad) return err(400, 'body bukan JSON yang valid')
    const v = validate(d.in)
    if (v.msg) return err(400, v.msg)
    if (P === 'B' && kuotaPakai(v.q.peminjam, v.q.tanggal, it.id) >= 2) return err(409, msgKuota)
    if (bentrok(v.q, it.id).conflict) return err(409, msgBentrok)
    it.sumber_daya_id = v.q.res.id
    it.peminjam = v.q.peminjam
    it.tanggal = v.q.tanggal
    it.slot_mulai = v.q.mulai
    it.slot_selesai = v.q.selesai
    it.jumlah = v.q.jumlah
    return ok(200, viewItem(it))
  }

  function deleteItem(id) {
    if (CR === 'C') {
      const it = findItem(id)
      if (!it) return err(404, 'peminjaman tidak ditemukan')
      if (it.status === 'dibatalkan' || it.status === 'ditolak' || it.status === 'selesai') return err(409, 'peminjaman ini sudah tidak aktif')
      it.status = 'dibatalkan'
      return noContent()
    }
    const i = st.items.findIndex((it) => it.id === id)
    if (i < 0) return err(404, 'peminjaman tidak ditemukan')
    st.items.splice(i, 1)
    return noContent()
  }

  function tanggalQuery(query) {
    return query.get('tanggal') || ''
  }

  function ketersediaan(id, query) {
    const rs = findRes(id)
    if (!rs) return err(404, 'sumber daya tidak ditemukan')
    const tgl = tanggalQuery(query)
    if (!tanggalValid(tgl)) return err(400, 'tanggal wajib berformat YYYY-MM-DD dan valid')
    const slot = []
    for (let sl = 1; sl <= MAX_SLOT; sl++) {
      const sisa = rs.stok - usage(rs.id, tgl, sl, 0)
      slot.push({ slot: sl, sisa, tersedia: sisa > 0 })
    }
    return ok(200, { sumber_daya_id: rs.id, tanggal: tgl, slot })
  }

  function kuota(namaRaw, query) {
    const nama = namaRaw.trim()
    if (nama === '') return err(400, 'nama peminjam wajib diisi')
    const tgl = tanggalQuery(query)
    if (!tanggalValid(tgl)) return err(400, 'tanggal wajib berformat YYYY-MM-DD dan valid')
    const terpakai = kuotaPakai(nama, tgl, 0)
    return ok(200, { peminjam: nama, tanggal: tgl, terpakai, maksimal: 2, sisa: Math.max(0, 2 - terpakai) })
  }

  function aksiStatus(id, dari, ke, pesan) {
    const it = findItem(id)
    if (!it) return err(404, 'peminjaman tidak ditemukan')
    if (it.status !== dari) return err(409, pesan)
    it.status = ke
    return ok(200, viewItem(it))
  }

  function tolak(id, body) {
    const it = findItem(id)
    if (!it) return err(404, 'peminjaman tidak ditemukan')
    const b = parseBody(body)
    if (b.bad) return err(400, 'alasan wajib diisi')
    const d = decodeFields(b.value, { alasan: isStr })
    if (d.bad || d.in.alasan === undefined) return err(400, 'alasan wajib diisi')
    const alasan = trimRunes(d.in.alasan, 100)
    if (alasan === null) return err(400, 'alasan wajib diisi (maksimal 100 karakter)')
    if (it.status !== 'diajukan') return err(409, 'hanya peminjaman berstatus diajukan yang bisa ditolak')
    it.status = 'ditolak'
    it.alasan = alasan
    return ok(200, viewItem(it))
  }

  function createPaket(body) {
    const b = parseBody(body)
    if (b.bad) return err(400, 'body bukan JSON yang valid')
    const o = b.value
    const d = decodeFields(o, { peminjam: isStr, tanggal: isStr, slot_mulai: isInt, slot_selesai: isInt })
    if (d.bad) return err(400, 'body bukan JSON yang valid')
    let items = []
    if (o.item !== undefined && o.item !== null) {
      if (!Array.isArray(o.item)) return err(400, 'body bukan JSON yang valid')
      for (const el of o.item) {
        if (el === null || typeof el !== 'object' || Array.isArray(el)) return err(400, 'body bukan JSON yang valid')
        const di = decodeFields(el, { sumber_daya_id: isInt, jumlah: isInt })
        if (di.bad) return err(400, 'body bukan JSON yang valid')
        items.push(di.in)
      }
    }
    const x = d.in
    if (x.peminjam === undefined || x.tanggal === undefined || x.slot_mulai === undefined || x.slot_selesai === undefined || items.length === 0 || items.length > 10)
      return err(400, 'peminjam, tanggal, slot_mulai, slot_selesai, dan 1 sampai 10 item wajib diisi')
    const peminjam = trimRunes(x.peminjam, 50)
    if (peminjam === null) return err(400, 'peminjam wajib diisi (maksimal 50 karakter)')
    if (!tanggalValid(x.tanggal)) return err(400, 'tanggal harus berformat YYYY-MM-DD dan valid')
    const m = x.slot_mulai
    const e = x.slot_selesai
    if (m < 1 || e > MAX_SLOT || m > e) return err(400, 'slot harus 1 sampai 8 dan slot_mulai <= slot_selesai')
    const reqs = []
    const seen = new Set()
    for (const it of items) {
      if (it.sumber_daya_id === undefined || it.jumlah === undefined) return err(400, 'tiap item wajib berisi sumber_daya_id dan jumlah')
      if (seen.has(it.sumber_daya_id)) return err(400, 'sumber daya tidak boleh muncul dua kali dalam satu paket')
      seen.add(it.sumber_daya_id)
      const rs = findRes(it.sumber_daya_id)
      if (!rs) return err(400, 'sumber daya tidak ditemukan')
      if (it.jumlah < 1 || it.jumlah > rs.stok) return err(400, 'jumlah harus antara 1 dan stok sumber daya')
      reqs.push({ res: rs, peminjam, tanggal: x.tanggal, mulai: m, selesai: e, jumlah: it.jumlah })
    }
    for (const q of reqs) {
      if (bentrok(q, 0).conflict) return err(409, 'salah satu sumber daya tidak tersedia; seluruh paket dibatalkan')
    }
    const pid = st.nextPaket++
    const out = reqs.map((q) => viewItem(tambah(q, pid)))
    return ok(201, { paket_id: pid, peminjaman: out })
  }

  function deletePaket(id) {
    const milik = st.items.filter((it) => it.paket_id === id)
    if (CR === 'C') {
      if (milik.length === 0) return err(404, 'paket tidak ditemukan')
      if (!milik.some(blocking)) return err(409, 'seluruh peminjaman dalam paket ini sudah tidak aktif')
      for (const it of milik) if (blocking(it)) it.status = 'dibatalkan'
      return noContent()
    }
    if (milik.length === 0) return err(404, 'paket tidak ditemukan')
    st.items = st.items.filter((it) => it.paket_id !== id)
    return noContent()
  }

  function createBlokir(body) {
    const b = parseBody(body)
    if (b.bad) return err(400, 'body bukan JSON yang valid')
    const d = decodeFields(b.value, { sumber_daya_id: isInt, tanggal: isStr, slot_mulai: isInt, slot_selesai: isInt, keterangan: isStr })
    if (d.bad) return err(400, 'body bukan JSON yang valid')
    const x = d.in
    if (['sumber_daya_id', 'tanggal', 'slot_mulai', 'slot_selesai', 'keterangan'].some((k) => x[k] === undefined))
      return err(400, 'sumber_daya_id, tanggal, slot_mulai, slot_selesai, dan keterangan wajib diisi')
    const ket = trimRunes(x.keterangan, 100)
    if (ket === null) return err(400, 'keterangan wajib diisi (maksimal 100 karakter)')
    if (!tanggalValid(x.tanggal)) return err(400, 'tanggal harus berformat YYYY-MM-DD dan valid')
    const m = x.slot_mulai
    const e = x.slot_selesai
    if (m < 1 || e > MAX_SLOT || m > e) return err(400, 'slot harus 1 sampai 8 dan slot_mulai <= slot_selesai')
    const rs = findRes(x.sumber_daya_id)
    if (!rs) return err(400, 'sumber daya tidak ditemukan')
    for (const bl of st.blokirs) {
      if (bl.sumber_daya_id === rs.id && bl.tanggal === x.tanggal && overlap(m, e, bl.slot_mulai, bl.slot_selesai)) return err(409, 'sudah ada blokir pada slot tersebut')
    }
    const dibatalkan = []
    for (const it of st.items) {
      if (blocking(it) && it.sumber_daya_id === rs.id && it.tanggal === x.tanggal && overlap(m, e, it.slot_mulai, it.slot_selesai)) {
        it.status = 'dibatalkan'
        dibatalkan.push(it.id)
      }
    }
    const bl = { id: st.nextBlokir++, sumber_daya_id: rs.id, tanggal: x.tanggal, slot_mulai: m, slot_selesai: e, keterangan: ket }
    st.blokirs.push(bl)
    return ok(201, { blokir: bl, dibatalkan })
  }

  function deleteBlokir(id) {
    const i = st.blokirs.findIndex((b) => b.id === id)
    if (i < 0) return err(404, 'blokir tidak ditemukan')
    st.blokirs.splice(i, 1)
    return noContent()
  }

  function ringkasan(query) {
    const tgl = tanggalQuery(query)
    if (!tanggalValid(tgl)) return err(400, 'tanggal wajib berformat YYYY-MM-DD dan valid')
    let jumlah = 0
    let unit = 0
    const per = st.res.map((rs) => {
      let n = 0
      for (const it of st.items) {
        if (blocking(it) && it.tanggal === tgl && it.sumber_daya_id === rs.id) {
          n++
          jumlah++
          unit += it.jumlah * (it.slot_selesai - it.slot_mulai + 1)
        }
      }
      return { sumber_daya_id: rs.id, nama: rs.nama, jumlah_peminjaman: n }
    })
    return ok(200, { tanggal: tgl, jumlah_peminjaman: jumlah, total_unit_slot: unit, per_sumber_daya: per })
  }

  // ---------------------------------------------------------------- routing
  function route(method, segs, query, body) {
    const idOr400 = (s, fn) => {
      const id = parseId(s)
      return id === null ? err(400, 'id harus berupa angka') : fn(id)
    }
    const [a, b, c] = segs
    if (a === 'sumber-daya') {
      if (segs.length === 1) {
        if (method === 'POST') return createRes(body)
        if (method === 'GET') return ok(200, st.res.map((r) => ({ ...r })))
      }
      if (segs.length === 2 && method === 'GET') {
        return idOr400(b, (id) => {
          const r = findRes(id)
          return r ? ok(200, { ...r }) : err(404, 'sumber daya tidak ditemukan')
        })
      }
      if (segs.length === 3 && c === 'ketersediaan' && method === 'GET' && P === 'A') return idOr400(b, (id) => ketersediaan(id, query))
    }
    if (a === 'peminjaman') {
      if (segs.length === 1) {
        if (method === 'POST') return createItem(body)
        if (method === 'GET') return listItems(query)
      }
      if (segs.length === 2) {
        if (method === 'GET')
          return idOr400(b, (id) => {
            const it = findItem(id)
            return it ? ok(200, viewItem(it)) : err(404, 'peminjaman tidak ditemukan')
          })
        if (method === 'PUT') return idOr400(b, (id) => updateItem(id, body))
        if (method === 'DELETE') return idOr400(b, (id) => deleteItem(id))
      }
      if (segs.length === 3 && method === 'POST' && P === 'C') {
        if (c === 'setujui') return idOr400(b, (id) => aksiStatus(id, 'diajukan', 'disetujui', 'hanya peminjaman berstatus diajukan yang bisa disetujui'))
        if (c === 'tolak') return idOr400(b, (id) => tolak(id, body))
        if (c === 'selesaikan') return idOr400(b, (id) => aksiStatus(id, 'disetujui', 'selesai', 'hanya peminjaman berstatus disetujui yang bisa diselesaikan'))
      }
    }
    if (a === 'peminjam' && segs.length === 3 && c === 'kuota' && method === 'GET' && P === 'B') return kuota(b, query)
    if (a === 'paket-peminjaman' && P === 'D') {
      if (segs.length === 1 && method === 'POST') return createPaket(body)
      if (segs.length === 2 && method === 'DELETE') return idOr400(b, (id) => deletePaket(id))
    }
    if (a === 'blokir' && P === 'E') {
      if (segs.length === 1 && method === 'POST') return createBlokir(body)
      if (segs.length === 1 && method === 'GET') return ok(200, st.blokirs.map((x) => ({ ...x })))
      if (segs.length === 2 && method === 'DELETE') return idOr400(b, (id) => deleteBlokir(id))
    }
    if (a === 'ringkasan' && segs.length === 1 && method === 'GET' && CR === 'A') return ringkasan(query)
    return err(404, 'endpoint tidak ditemukan: ' + method + ' /' + segs.join('/'))
  }

  function handle({ method, path, query, body }) {
    const mentah = path.split('/').slice(1)
    // Segmen kosong (mis. "/peminjaman/" atau "//") tidak cocok dengan rute mana pun.
    if (mentah.length === 0 || mentah.some((x) => x === '')) return err(404, 'endpoint tidak ditemukan: ' + method + ' ' + path)
    const segs = mentah.map((s) => {
      try {
        return decodeURIComponent(s)
      } catch {
        return s
      }
    })
    return route(String(method).toUpperCase(), segs, query || new URLSearchParams(), body)
  }

  return { handle, persona: P, cr: CR }
}
