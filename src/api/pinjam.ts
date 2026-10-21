import type {
  FilterPeminjaman, Ketersediaan, Peminjaman, PeminjamanInput, SumberDaya, SumberDayaInput,
} from '../types'

const BASE_URL = 'http://localhost:8080'

interface ApiError { error: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new Error('Gagal menghubungi server. Periksa apakah API berjalan.')
  }

  if (response.status === 204) return undefined as T
  let data: unknown
  try {
    data = await response.json() as unknown
  } catch {
    throw new Error('Gagal membaca respons server.')
  }
  if (!response.ok) {
    const maybe = data as Partial<ApiError> | null
    throw new Error(typeof maybe?.error === 'string' ? maybe.error : `Permintaan gagal (${response.status}).`)
  }
  return data as T
}

export function daftarSumberDaya(): Promise<SumberDaya[]> {
  return request('/sumber-daya')
}

export function tambahSumberDaya(input: SumberDayaInput): Promise<SumberDaya> {
  return request('/sumber-daya', { method: 'POST', body: JSON.stringify(input) })
}

export function daftarPeminjaman(filter: FilterPeminjaman): Promise<Peminjaman[]> {
  const qs = new URLSearchParams()
  if (filter.sumber_daya_id) qs.set('sumber_daya_id', filter.sumber_daya_id)
  if (filter.tanggal) qs.set('tanggal', filter.tanggal)
  if (filter.status) qs.set('status', filter.status)
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return request(`/peminjaman${suffix}`)
}

export function detailPeminjaman(id: number): Promise<Peminjaman> {
  return request(`/peminjaman/${id}`)
}

export function tambahPeminjaman(input: PeminjamanInput): Promise<Peminjaman> {
  return request('/peminjaman', { method: 'POST', body: JSON.stringify(input) })
}

export function ubahPeminjaman(id: number, input: PeminjamanInput): Promise<Peminjaman> {
  return request(`/peminjaman/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function hapusPeminjaman(id: number): Promise<void> {
  return request(`/peminjaman/${id}`, { method: 'DELETE' })
}

export function lihatKetersediaan(id: number, tanggal: string): Promise<Ketersediaan> {
  const qs = new URLSearchParams({ tanggal })
  return request(`/sumber-daya/${id}/ketersediaan?${qs.toString()}`)
}
