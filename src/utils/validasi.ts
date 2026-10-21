import type { PeminjamanInput, SumberDaya, SumberDayaInput } from '../types'

export function tanggalValid(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [tahun, bulan, tanggal] = s.split('-').map(Number)
  const d = new Date(0)
  d.setUTCFullYear(tahun, bulan - 1, tanggal)
  return d.getUTCFullYear() === tahun && d.getUTCMonth() === bulan - 1 && d.getUTCDate() === tanggal
}

export function cekSumberDaya(input: SumberDayaInput): string | null {
  const nama = input.nama.trim()
  if (!nama || [...nama].length > 50) return 'Nama sumber daya wajib diisi, maksimal 50 karakter.'
  if (input.jenis !== 'ruang' && input.jenis !== 'alat') return 'Jenis sumber daya tidak valid.'
  if (!Number.isInteger(input.stok) || input.stok < 1) return 'Stok harus bilangan bulat minimal 1.'
  return null
}

export function cekPeminjaman(input: PeminjamanInput, sumberDaya: SumberDaya[]): string | null {
  const resource = sumberDaya.find((r) => r.id === input.sumber_daya_id)
  if (!resource) return 'Pilih sumber daya terlebih dahulu.'
  const nama = input.peminjam.trim()
  if (!nama || [...nama].length > 50) return 'Peminjam wajib diisi, maksimal 50 karakter.'
  if (!tanggalValid(input.tanggal)) return 'Tanggal harus diisi dengan tanggal yang valid.'
  if (!Number.isInteger(input.slot_mulai) || !Number.isInteger(input.slot_selesai)
    || input.slot_mulai < 1 || input.slot_mulai > 8
    || input.slot_selesai < 1 || input.slot_selesai > 8
    || input.slot_mulai > input.slot_selesai) return 'Slot harus 1 sampai 8 dan slot mulai tidak melebihi slot selesai.'
  if (!Number.isInteger(input.jumlah) || input.jumlah < 1 || input.jumlah > resource.stok)
    return `Jumlah harus bilangan bulat antara 1 sampai ${resource.stok}.`
  return null
}
