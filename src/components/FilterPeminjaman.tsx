import type { FilterPeminjaman as Filter, SumberDaya } from '../types'

interface Props {
  value: Filter
  sumberDaya: SumberDaya[]
  onChange: (patch: Partial<Filter>) => void
}

export default function FilterPeminjaman({ value, sumberDaya, onChange }: Props) {
  return (
    <div className="filters">
      <div><label htmlFor="filter-resource">Filter sumber daya</label>
        <select id="filter-resource" value={value.sumber_daya_id} onChange={(e) => onChange({ sumber_daya_id: e.target.value })}>
          <option value="">Semua</option>
          {sumberDaya.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
        </select></div>
      <div><label htmlFor="filter-date">Filter tanggal</label>
        <input id="filter-date" type="date" value={value.tanggal} onChange={(e) => onChange({ tanggal: e.target.value })} /></div>
      <div><label htmlFor="filter-status">Filter status</label>
        <select id="filter-status" value={value.status} onChange={(e) => onChange({ status: e.target.value })}>
          <option value="">Semua</option><option value="aktif">aktif</option><option value="dibatalkan">dibatalkan</option>
        </select></div>
    </div>
  )
}
