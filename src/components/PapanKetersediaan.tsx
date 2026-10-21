import { useEffect, useState, type FormEvent } from 'react'
import { lihatKetersediaan } from '../api/pinjam'
import type { Ketersediaan, SumberDaya } from '../types'
import { tanggalValid } from '../utils/validasi'

interface Props {
  sumberDaya: SumberDaya[]
  revision: number
  onError: (message: string) => void
  onClearError: () => void
}

interface PilihanAktif {
  sumber_daya_id: number
  tanggal: string
}

export default function PapanKetersediaan({ sumberDaya, revision, onError, onClearError }: Props) {
  const [id, setId] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [pilihanAktif, setPilihanAktif] = useState<PilihanAktif | null>(null)
  const [data, setData] = useState<Ketersediaan | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!pilihanAktif) return
    let alive = true
    setLoading(true)
    setData(null)
    void lihatKetersediaan(pilihanAktif.sumber_daya_id, pilihanAktif.tanggal)
      .then((hasil) => { if (alive) setData(hasil) })
      .catch((err: unknown) => {
        if (alive) onError(err instanceof Error ? err.message : 'Gagal mengambil ketersediaan.')
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [pilihanAktif, revision, onError])

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!id || !sumberDaya.some((s) => s.id === Number(id))) {
      onError('Pilih sumber daya (ketersediaan) terlebih dahulu.')
      return
    }
    if (!tanggalValid(tanggal)) {
      onError('Tanggal (ketersediaan) wajib diisi dengan tanggal valid.')
      return
    }
    onClearError()
    setPilihanAktif({ sumber_daya_id: Number(id), tanggal })
  }

  return (
    <section className="panel">
      <h2>Papan ketersediaan — 8 slot</h2>
      <p className="helper">Lihat sisa unit setiap slot pada tanggal yang dipilih. Papan diperbarui setelah peminjaman dibuat, diubah, atau dihapus.</p>
      <form onSubmit={submit} noValidate className="form-grid">
        <label htmlFor="availability-resource">Sumber daya (ketersediaan)</label>
        <select id="availability-resource" value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Pilih sumber daya</option>
          {sumberDaya.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
        </select>
        <label htmlFor="availability-date">Tanggal (ketersediaan)</label>
        <input id="availability-date" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        <button type="submit" disabled={loading}>Lihat ketersediaan</button>
      </form>
      {loading && <p>Memuat...</p>}
      {data && (
        <>
          <p className="helper">Tanggal: <strong>{data.tanggal}</strong></p>
          <ul aria-label="Ketersediaan slot" className="slot-grid">
            {data.slot.map((entry) => (
              <li key={entry.slot} className={entry.tersedia ? 'available' : 'full'}>
                Slot {entry.slot} - Sisa {entry.sisa} - {entry.tersedia ? 'Tersedia' : 'Penuh'}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
