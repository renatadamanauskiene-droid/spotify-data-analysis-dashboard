import L from 'leaflet'
import type { LocationCategory } from '@/types'

const GLYPH: Record<LocationCategory, string> = {
  aerodromas: 'A',
  poligonas: 'P',
  gelezinkelio_mazgas: 'G',
  raketine_pozicija: 'R',
  oro_gynyba: 'O',
  nauja_stovykla: 'S',
  palydovinis_pokytis: 'Sat',
  incidentas: '!',
  miestas: '•',
  pasienio_punktas: 'PP',
  siena: '—',
}

export type MarkerUrgency = 'neutral' | 'geltona' | 'raudona'

const RING_COLOR: Record<MarkerUrgency, string> = {
  neutral: '#334152',
  geltona: '#d1a220',
  raudona: '#c9483f',
}

export function buildDivIcon(category: LocationCategory, urgency: MarkerUrgency): L.DivIcon {
  const glyph = GLYPH[category] || '•'
  const ring = RING_COLOR[urgency]
  const fontSize = glyph.length > 1 ? '9px' : '11px'
  return L.divIcon({
    className: 'by-map-marker',
    html: `<span style="
        display:flex;align-items:center;justify-content:center;
        width:26px;height:26px;border-radius:50%;
        background:#131a22;border:2px solid ${ring};
        color:#e7ecf1;font-size:${fontSize};font-weight:600;
        box-shadow:0 1px 4px rgba(0,0,0,0.5);
      ">${glyph}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  })
}
