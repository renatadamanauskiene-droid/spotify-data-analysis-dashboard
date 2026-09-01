export function formatRelativeLt(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'ką tik'
  if (diffMin < 60) return `prieš ${diffMin} min.`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `prieš ${diffH} val.`
  const diffD = Math.round(diffH / 24)
  if (diffD === 1) return 'vakar'
  if (diffD < 30) return `prieš ${diffD} d.`
  const diffMonths = Math.round(diffD / 30)
  return `prieš ${diffMonths} mėn.`
}

export function formatDateTimeLt(iso: string): string {
  return new Date(iso).toLocaleString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateLt(iso: string): string {
  return new Date(iso).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDistanceKm(km?: number): string {
  if (km == null) return '—'
  return `${Math.round(km)} km`
}

const CONFIDENCE_LABELS: Record<string, string> = {
  PATVIRTINTA: 'Patvirtinta',
  TIKETINA: 'Tikėtina',
  NEPATVIRTINTA: 'Nepatvirtinta',
}

export function confidenceLabel(c: string): string {
  return CONFIDENCE_LABELS[c] || c
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  nauja: 'Nauja',
  padidejo: 'Padidėjo',
  sumazejo: 'Sumažėjo',
  nepakito: 'Nepakito',
  nepatvirtinta: 'Nepatvirtinta',
}

export function changeTypeLabel(c: string): string {
  return CHANGE_TYPE_LABELS[c] || c
}

const CATEGORY_LABELS: Record<string, string> = {
  kariai: 'Kariai',
  gelezinkeliai: 'Geležinkeliai',
  aviacija: 'Aviacija',
  raketines_sistemos: 'Raketinės sistemos',
  poligonai: 'Poligonai',
  palydoviniai_pokyciai: 'Palydoviniai pokyčiai',
  gnss_trikdziai: 'GNSS trikdžiai',
  notam_oro_erdve: 'NOTAM / oro erdvė',
  sausumos_pajegos: 'Sausumos pajėgos',
  nato_lt_pl_atsakas: 'NATO / LT / PL atsakas',
}

export function categoryLabel(c: string): string {
  return CATEGORY_LABELS[c] || c
}

const LOCATION_CATEGORY_LABELS: Record<string, string> = {
  aerodromas: 'Aerodromas',
  poligonas: 'Poligonas',
  gelezinkelio_mazgas: 'Geležinkelio mazgas',
  raketine_pozicija: 'Raketinė / oro gynybos pozicija',
  oro_gynyba: 'Oro gynyba',
  nauja_stovykla: 'Nauja stovykla',
  palydovinis_pokytis: 'Palydovinis pokytis',
  incidentas: 'Incidentas',
  miestas: 'Miestas',
  pasienio_punktas: 'Pasienio punktas',
  siena: 'Siena',
}

export function locationCategoryLabel(c: string): string {
  return LOCATION_CATEGORY_LABELS[c] || c
}
