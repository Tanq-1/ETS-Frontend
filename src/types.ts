export type JenisSumberDaya = 'ruang' | 'alat'
export type StatusPeminjaman = 'aktif' | 'dibatalkan'

export interface SumberDaya {
  id: number
  nama: string
  jenis: JenisSumberDaya
  stok: number
}

export type SumberDayaInput = Omit<SumberDaya, 'id'>

export interface Peminjaman {
  id: number
  sumber_daya_id: number
  peminjam: string
  tanggal: string
  slot_mulai: number
  slot_selesai: number
  jumlah: number
  status: StatusPeminjaman
}

export type PeminjamanInput = Pick<Peminjaman,
  'sumber_daya_id' | 'peminjam' | 'tanggal' | 'slot_mulai' | 'slot_selesai' | 'jumlah'>

export interface FilterPeminjaman {
  sumber_daya_id: string
  tanggal: string
  status: string
}

export interface SlotKetersediaan {
  slot: number
  sisa: number
  tersedia: boolean
}

export interface Ketersediaan {
  sumber_daya_id: number
  tanggal: string
  slot: SlotKetersediaan[]
}
