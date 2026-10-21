import { useState, type FormEvent } from 'react'
import type { JenisSumberDaya, SumberDayaInput } from '../types'

interface Props {
  busy: boolean
  onSave: (input: SumberDayaInput) => Promise<boolean>
}

export default function SumberDayaForm({ busy, onSave }: Props) {
  const [nama, setNama] = useState('')
  const [jenis, setJenis] = useState<JenisSumberDaya>('ruang')
  const [stok, setStok] = useState('1')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    const success = await onSave({ nama: nama.trim(), jenis, stok: Number(stok) })
    if (success) { setNama(''); setJenis('ruang'); setStok('1') }
  }

  return (
    <form onSubmit={submit} noValidate className="form-grid">
      <label htmlFor="nama-sumber">Nama sumber daya</label>
      <input id="nama-sumber" value={nama} maxLength={50} onChange={(e) => setNama(e.target.value)} />
      <label htmlFor="jenis-sumber">Jenis</label>
      <select id="jenis-sumber" value={jenis} onChange={(e) => setJenis(e.target.value as JenisSumberDaya)}>
        <option value="ruang">ruang</option>
        <option value="alat">alat</option>
      </select>
      <label htmlFor="stok-sumber">Stok</label>
      <input id="stok-sumber" type="number" min={1} step={1} value={stok} onChange={(e) => setStok(e.target.value)} />
      <button disabled={busy} type="submit">Simpan sumber daya</button>
    </form>
  )
}
