import type { FormEvent } from 'react'
import type { PeminjamanInput, SumberDaya } from '../types'

interface Props {
  value: PeminjamanInput
  sumberDaya: SumberDaya[]
  busy: boolean
  editing: boolean
  onChange: (update: Partial<PeminjamanInput>) => void
  onSave: () => Promise<void>
}

export default function PeminjamanForm({ value, sumberDaya, busy, editing, onChange, onSave }: Props) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!busy) void onSave()
  }
  return (
    <form onSubmit={submit} noValidate className="form-grid">
      <label htmlFor="booking-resource">Sumber daya</label>
      <select id="booking-resource" value={value.sumber_daya_id || ''} onChange={(e) => onChange({ sumber_daya_id: Number(e.target.value) })}>
        <option value="">Pilih sumber daya</option>
        {sumberDaya.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
      </select>
      <label htmlFor="booking-name">Peminjam</label>
      <input id="booking-name" value={value.peminjam} maxLength={50} onChange={(e) => onChange({ peminjam: e.target.value })} />
      <label htmlFor="booking-date">Tanggal</label>
      <input id="booking-date" type="date" value={value.tanggal} onChange={(e) => onChange({ tanggal: e.target.value })} />
      <label htmlFor="booking-start">Slot mulai</label>
      <select id="booking-start" value={value.slot_mulai} onChange={(e) => onChange({ slot_mulai: Number(e.target.value) })}>
        {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <label htmlFor="booking-end">Slot selesai</label>
      <select id="booking-end" value={value.slot_selesai} onChange={(e) => onChange({ slot_selesai: Number(e.target.value) })}>
        {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <label htmlFor="booking-count">Jumlah</label>
      <input id="booking-count" type="number" min={1} step={1} value={value.jumlah} onChange={(e) => onChange({ jumlah: Number(e.target.value) })} />
      <button disabled={busy} type="submit">{editing ? 'Simpan perubahan' : 'Simpan peminjaman'}</button>
    </form>
  )
}
