import { useEffect, useState } from 'react'
import { daftarPeminjaman, daftarSumberDaya, detailPeminjaman, tambahPeminjaman, tambahSumberDaya } from './api/pinjam'
import DaftarPeminjaman from './components/DaftarPeminjaman'
import FilterPeminjaman from './components/FilterPeminjaman'
import PeminjamanForm from './components/PeminjamanForm'
import SumberDayaForm from './components/SumberDayaForm'
import type { FilterPeminjaman as Filter, Peminjaman, PeminjamanInput, SumberDaya, SumberDayaInput } from './types'
import { cekPeminjaman, cekSumberDaya } from './utils/validasi'
import './style.css'

const formKosong: PeminjamanInput = { sumber_daya_id: 0, peminjam: '', tanggal: '', slot_mulai: 1, slot_selesai: 1, jumlah: 1 }

function pesanError(error: unknown): string {
  return error instanceof Error ? error.message : 'Gagal menjalankan permintaan.'
}

export default function App() {
  const [resources, setResources] = useState<SumberDaya[]>([])
  const [bookings, setBookings] = useState<Peminjaman[]>([])
  const [filter, setFilter] = useState<Filter>({ sumber_daya_id: '', tanggal: '', status: '' })
  const [form, setForm] = useState<PeminjamanInput>({ ...formKosong })
  const [detail, setDetail] = useState<Peminjaman | null>(null)
  const [error, setError] = useState('')
  const [busyResource, setBusyResource] = useState(false)
  const [busyBooking, setBusyBooking] = useState(false)
  const [loadingResource, setLoadingResource] = useState(true)
  const [loadingBooking, setLoadingBooking] = useState(true)
  const [revision, setRevision] = useState(0)

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
    void daftarPeminjaman(filter).then((data) => { if (active) setBookings(data) })
      .catch((err: unknown) => { if (active) setError(pesanError(err)) })
      .finally(() => { if (active) setLoadingBooking(false) })
    return () => { active = false }
  }, [filter, revision])

  async function simpanResource(input: SumberDayaInput): Promise<boolean> {
    const invalid = cekSumberDaya(input)
    if (invalid) { setError(invalid); return false }
    if (busyResource) return false
    setBusyResource(true); setError('')
    try {
      await tambahSumberDaya(input)
      setResources(await daftarSumberDaya())
      return true
    } catch (err) { setError(pesanError(err)); return false }
    finally { setBusyResource(false) }
  }

  async function simpanBooking(): Promise<void> {
    const input: PeminjamanInput = { ...form, peminjam: form.peminjam.trim() }
    const invalid = cekPeminjaman(input, resources)
    if (invalid) { setError(invalid); return }
    if (busyBooking) return
    setBusyBooking(true); setError('')
    try {
      await tambahPeminjaman(input)
      setForm({ ...formKosong })
      setDetail(null)
      setRevision((n) => n + 1)
    } catch (err) { setError(pesanError(err)) }
    finally { setBusyBooking(false) }
  }

  async function lihatDetail(id: number): Promise<void> {
    setError('')
    try { setDetail(await detailPeminjaman(id)) }
    catch (err) { setError(pesanError(err)) }
  }

  return (
    <main className="container">
      <header><p className="eyebrow">ETS Frontend • Persona A</p><h1>PinjamKampus</h1><p>Pengelolaan ruang, alat, dan peminjaman kampus.</p></header>
      {error && <div role="alert" className="alert">{error}</div>}
      {(loadingResource || loadingBooking) && <p>Memuat...</p>}
      <div className="columns">
        <section className="panel"><h2>Sumber daya</h2><SumberDayaForm busy={busyResource} onSave={simpanResource} />
          <ul aria-label="Daftar sumber daya" className="item-list">
            {resources.map((s) => <li key={s.id}><strong>{s.nama}</strong> — {s.jenis} — Stok {s.stok}</li>)}
          </ul></section>
        <section className="panel"><h2>Form peminjaman</h2>
          <PeminjamanForm value={form} sumberDaya={resources} busy={busyBooking} editing={false} onChange={(patch) => setForm((v) => ({ ...v, ...patch }))} onSave={simpanBooking} />
        </section>
      </div>
      <section className="panel"><h2>Daftar peminjaman</h2>
        <FilterPeminjaman value={filter} sumberDaya={resources} onChange={(patch) => setFilter((v) => ({ ...v, ...patch }))} />
        <DaftarPeminjaman peminjaman={bookings} detail={detail} onDetail={(id) => { void lihatDetail(id) }} />
      </section>
    </main>
  )
}
