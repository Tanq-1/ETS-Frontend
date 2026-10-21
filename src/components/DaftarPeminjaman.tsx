import type { Peminjaman } from '../types'

interface Props {
  peminjaman: Peminjaman[]
  detail: Peminjaman | null
  onDetail: (id: number) => void
  onEdit?: (item: Peminjaman) => void
  onHapus?: (id: number) => void
  deleting?: boolean
}

export default function DaftarPeminjaman({ peminjaman, detail, onDetail, onEdit, onHapus, deleting }: Props) {
  return (
    <>
      <ul aria-label="Daftar peminjaman" className="item-list">
        {peminjaman.map((it) => (
          <li key={it.id}>
            <div><strong>{it.peminjam}</strong> — {it.tanggal} — Slot {it.slot_mulai}-{it.slot_selesai} — Jumlah {it.jumlah} — {it.status}</div>
            <div className="actions">
              <button type="button" onClick={() => onDetail(it.id)}>Detail</button>
              {onEdit && it.status === 'aktif' && <button type="button" onClick={() => onEdit(it)}>Edit</button>}
              {onHapus && <button type="button" disabled={deleting} onClick={() => onHapus(it.id)}>Hapus</button>}
            </div>
          </li>
        ))}
      </ul>
      {detail && (
        <section aria-label="Detail peminjaman" className="detail-box">
          <h3>Detail peminjaman #{detail.id}</h3>
          <p>{detail.peminjam} — {detail.tanggal} — Slot {detail.slot_mulai}-{detail.slot_selesai} — Jumlah {detail.jumlah} — {detail.status}</p>
          <p>Sumber daya ID: {detail.sumber_daya_id}</p>
        </section>
      )}
    </>
  )
}
