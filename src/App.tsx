import { useCallback, useEffect, useRef, useState } from 'react'
import {
  daftarPeminjaman, daftarSumberDaya, detailPeminjaman, hapusPeminjaman,
  tambahPeminjaman, tambahSumberDaya, ubahPeminjaman,
} from './api/pinjam'
import DaftarPeminjaman from './components/DaftarPeminjaman'
import FilterPeminjaman from './components/FilterPeminjaman'
import PapanKetersediaan from './components/PapanKetersediaan'
import PeminjamanForm from './components/PeminjamanForm'
import SumberDayaForm from './components/SumberDayaForm'
import type { FilterPeminjaman as Filter, Peminjaman, PeminjamanInput, SumberDaya, SumberDayaInput } from './types'
import { cekPeminjaman, cekSumberDaya } from './utils/validasi'
import './style.css'

const formKosong: PeminjamanInput = {
  sumber_daya_id: 0, peminjam: '', tanggal: '', slot_mulai: 1, slot_selesai: 1, jumlah: 1,
}

function pesanError(error: unknown): string {
  return error instanceof Error ? error.message : 'Gagal menjalankan permintaan.'
}

export default function App() {
  const [resources, setResources] = useState<SumberDaya[]>([])
  const [bookings, setBookings] = useState<Peminjaman[]>([])
  const [filter, setFilter] = useState<Filter>({ sumber_daya_id: '', tanggal: '', status: '' })
  const [form, setForm] = useState<PeminjamanInput>({ ...formKosong })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Peminjaman | null>(null)
  const [error, setError] = useState('')
  const [busyResource, setBusyResource] = useState(false)
  const [busyBooking, setBusyBooking] = useState(false)
  const [loadingResource, setLoadingResource] = useState(true)
  const [loadingBooking, setLoadingBooking] = useState(true)
  const [revision, setRevision] = useState(0)
  // Ref mengunci aksi pada tick yang sama, sebelum setState membuat tombol disabled.
  const resourceLock = useRef(false)
  const bookingLock = useRef(false)
  const detailRequest = useRef(0)
  const onBoardError = useCallback((message: string) => setError(message), [])
  const clearBoardError = useCallback(() => setError(''), [])

  useEffect(() => {
    let active = true
    void daftarSumberDaya().then((data) => { if (active) setResources(data) })
      .catch((err: unknown) => { if (active) setError(pesanError(err)) })
      .finally(() => { if (active) setLoadingResource(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setLoadingBooking(true)
    // Perubahan filter membatalkan penerapan hasil request yang lama (race condition).
    void daftarPeminjaman(filter).then((data) => { if (active) setBookings(data) })
      .catch((err: unknown) => { if (active) setError(pesanError(err)) })
      .finally(() => { if (active) setLoadingBooking(false) })
    return () => { active = false }
  }, [filter, revision])

  async function simpanResource(input: SumberDayaInput): Promise<boolean> {
    if (resourceLock.current) return false
    const cleanInput = { ...input, nama: input.nama.trim() }
    const invalid = cekSumberDaya(cleanInput)
    if (invalid) { setError(invalid); return false }
    resourceLock.current = true
    setBusyResource(true)
    setError('')
    try {
      const dibuat = await tambahSumberDaya(cleanInput)
      // Respons POST juga sah, tetapi GET ulang memastikan daftar sama dengan server.
      setResources((prev) => [...prev, dibuat])
      try { setResources(await daftarSumberDaya()) }
      catch (err) { setError(pesanError(err)) }
      return true
    } catch (err) {
      setError(pesanError(err))
      return false
    } finally {
      resourceLock.current = false
      setBusyResource(false)
    }
  }

  async function simpanBooking(): Promise<void> {
    if (bookingLock.current) return
    const input: PeminjamanInput = { ...form, peminjam: form.peminjam.trim() }
    const invalid = cekPeminjaman(input, resources)
    if (invalid) { setError(invalid); return }
    bookingLock.current = true
    setBusyBooking(true)
    setError('')
    try {
      if (editingId === null) await tambahPeminjaman(input)
      else await ubahPeminjaman(editingId, input)
      setForm({ ...formKosong })
      setEditingId(null)
      detailRequest.current++
      setDetail(null)
      setRevision((n) => n + 1)
    } catch (err) {
      // Jika gagal 400/404/409, form edit/buat dan data yang diisi tetap utuh.
      setError(pesanError(err))
    } finally {
      bookingLock.current = false
      setBusyBooking(false)
    }
  }

  async function hapusBooking(id: number): Promise<void> {
    if (bookingLock.current) return
    bookingLock.current = true
    setBusyBooking(true)
    setError('')
    try {
      await hapusPeminjaman(id) // 204: tidak ada body JSON.
      if (editingId === id) { setForm({ ...formKosong }); setEditingId(null) }
      detailRequest.current++
      setDetail(null)
      setRevision((n) => n + 1)
    } catch (err) { setError(pesanError(err)) }
    finally { bookingLock.current = false; setBusyBooking(false) }
  }

  async function lihatDetail(id: number): Promise<void> {
    const requestId = ++detailRequest.current
    setError('')
    try {
      const data = await detailPeminjaman(id)
      if (requestId === detailRequest.current) setDetail(data)
    } catch (err) { if (requestId === detailRequest.current) setError(pesanError(err)) }
  }

  function mulaiEdit(it: Peminjaman) {
    if (bookingLock.current) return
    detailRequest.current++
    setDetail(null)
    setEditingId(it.id)
    setForm({
      sumber_daya_id: it.sumber_daya_id,
      peminjam: it.peminjam,
      tanggal: it.tanggal,
      slot_mulai: it.slot_mulai,
      slot_selesai: it.slot_selesai,
      jumlah: it.jumlah,
    })
    setError('')
  }

  function batalEdit() {
    if (bookingLock.current) return
    setEditingId(null)
    setForm({ ...formKosong })
    setError('')
  }

  return (
    <main className="container">
      <header><p className="eyebrow">ETS Frontend • Persona A</p><h1>PinjamKampus</h1><p>Pengelolaan ruang, alat, dan peminjaman kampus.</p></header>
      {error && <div role="alert" className="alert">{error}</div>}
      {(loadingResource || loadingBooking) && <p>Memuat...</p>}
      <div className="columns">
        <section className="panel"><h2>Sumber daya</h2>
          <SumberDayaForm busy={busyResource} onSave={simpanResource} />
          <ul aria-label="Daftar sumber daya" className="item-list">
            {resources.map((s) => <li key={s.id}><strong>{s.nama}</strong> — {s.jenis} — Stok {s.stok}</li>)}
          </ul>
        </section>
        <section className="panel"><h2>Form peminjaman</h2>
          {editingId !== null && <p className="helper">Mengedit peminjaman #{editingId}</p>}
          <PeminjamanForm value={form} sumberDaya={resources} busy={busyBooking} editing={editingId !== null}
            onChange={(patch) => setForm((v) => ({ ...v, ...patch }))} onSave={simpanBooking} />
          {editingId !== null && <button className="secondary" type="button" onClick={batalEdit} disabled={busyBooking}>Batal edit</button>}
        </section>
      </div>
      <section className="panel"><h2>Daftar peminjaman</h2>
        <FilterPeminjaman value={filter} sumberDaya={resources} onChange={(patch) => setFilter((v) => ({ ...v, ...patch }))} />
        <DaftarPeminjaman peminjaman={bookings} detail={detail}
          onDetail={(id) => { void lihatDetail(id) }}
          onEdit={mulaiEdit}
          onHapus={(id) => { void hapusBooking(id) }}
          deleting={busyBooking} />
      </section>
      <PapanKetersediaan sumberDaya={resources} revision={revision} onError={onBoardError} onClearError={clearBoardError} />
    </main>
  )
}
