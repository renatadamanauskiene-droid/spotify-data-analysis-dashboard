import type { LocationPoint } from '@/types'

export const demoLocations: LocationPoint[] = [
  { id: 'vilnius', name: 'Vilnius', lat: 54.6872, lng: 25.2797, category: 'miestas', region: 'abu', description: 'Lietuvos sostinė, atskaitos taškas atstumams.' },
  { id: 'siena-medininkai', name: 'Lietuvos–Baltarusijos siena (Medininkai)', lat: 54.5747, lng: 25.9585, category: 'siena', region: 'baltarusija', distanceToLtBorderKm: 0, distanceToVilniusKm: 38 },

  { id: 'gardinas', name: 'Gardinas', lat: 53.6884, lng: 23.8258, category: 'aerodromas', region: 'baltarusija', description: 'Regioninis centras, karinis aerodromas netoliese.', distanceToLtBorderKm: 32, distanceToVilniusKm: 165 },
  { id: 'asmena', name: 'Ašmena', lat: 54.4229, lng: 25.9502, category: 'miestas', region: 'baltarusija', distanceToLtBorderKm: 12, distanceToVilniusKm: 68 },
  { id: 'lyda', name: 'Lyda', lat: 53.8898, lng: 25.2996, category: 'aerodromas', region: 'baltarusija', description: 'Karinis aerodromas.', distanceToLtBorderKm: 45, distanceToVilniusKm: 140 },
  { id: 'brestas', name: 'Brestas', lat: 52.0975, lng: 23.7341, category: 'gelezinkelio_mazgas', region: 'baltarusija', description: 'Svarbus geležinkelio mazgas prie ES sienos.', distanceToLtBorderKm: 290, distanceToVilniusKm: 400 },
  { id: 'baranovicai', name: 'Baranovičiai', lat: 53.1325, lng: 26.0159, category: 'aerodromas', region: 'baltarusija', description: 'Karinis aerodromas.', distanceToLtBorderKm: 165, distanceToVilniusKm: 280 },
  { id: 'maciuliscai', name: 'Mačiuliščiai', lat: 53.8419, lng: 27.5031, category: 'aerodromas', region: 'baltarusija', description: 'Karinis aerodromas netoli Minsko.', distanceToLtBorderKm: 190, distanceToVilniusKm: 215 },
  { id: 'luninecas', name: 'Luninecas', lat: 52.2492, lng: 26.7969, category: 'aerodromas', region: 'baltarusija', distanceToLtBorderKm: 260, distanceToVilniusKm: 370 },
  { id: 'zyabrovka', name: 'Zyabrovka', lat: 52.3667, lng: 30.9333, category: 'aerodromas', region: 'baltarusija', description: 'Karinis aerodromas prie Gomelio.', distanceToLtBorderKm: 420, distanceToVilniusKm: 460 },
  { id: 'gozhskij', name: 'Gožskij poligonas', lat: 53.5833, lng: 24.6333, category: 'poligonas', region: 'baltarusija', description: 'Pratybų poligonas netoli Gardino.', distanceToLtBorderKm: 40, distanceToVilniusKm: 155 },
  { id: 'obuz-lesnovskij', name: 'Obuz-Lesnovskij', lat: 52.9333, lng: 25.75, category: 'raketine_pozicija', region: 'baltarusija', description: 'Raketinių pajėgų bazė netoli Baranovičių.', distanceToLtBorderKm: 175, distanceToVilniusKm: 290 },
  { id: 'losvido', name: 'Losvido poligonas', lat: 55.2, lng: 30.05, category: 'poligonas', region: 'baltarusija', description: 'Pratybų poligonas prie Vitebsko.', distanceToLtBorderKm: 210, distanceToVilniusKm: 300 },
  { id: 'gomelis', name: 'Gomelis', lat: 52.4345, lng: 30.9754, category: 'gelezinkelio_mazgas', region: 'baltarusija', description: 'Regiono centras, geležinkelio mazgas, nauja infrastruktūra stebima.', distanceToLtBorderKm: 430, distanceToVilniusKm: 470 },

  { id: 'suvalkai', name: 'Suvalkai (Suwałki)', lat: 54.1017, lng: 22.9309, category: 'miestas', region: 'suvalku_koridorius', distanceToVilniusKm: 210 },
  { id: 'augustavas', name: 'Augustavas (Augustów)', lat: 53.8433, lng: 22.9797, category: 'miestas', region: 'suvalku_koridorius', distanceToVilniusKm: 250 },
  { id: 'seinai', name: 'Seinai (Sejny)', lat: 54.1167, lng: 23.35, category: 'miestas', region: 'suvalku_koridorius', distanceToVilniusKm: 195 },
  { id: 'lazdijai', name: 'Lazdijai', lat: 54.2333, lng: 23.5167, category: 'miestas', region: 'suvalku_koridorius', distanceToVilniusKm: 165 },
  { id: 'druskininkai', name: 'Druskininkai', lat: 54.0167, lng: 23.9667, category: 'miestas', region: 'suvalku_koridorius', distanceToVilniusKm: 130 },
  { id: 'kalvarija', name: 'Kalvarija', lat: 54.4167, lng: 23.2167, category: 'miestas', region: 'suvalku_koridorius', distanceToVilniusKm: 130 },
  { id: 'marijampole', name: 'Marijampolė', lat: 54.5667, lng: 23.35, category: 'miestas', region: 'suvalku_koridorius', distanceToVilniusKm: 105 },
  { id: 'kaliningradas', name: 'Kaliningrado sritis (Černiachovskas)', lat: 54.6333, lng: 21.8167, category: 'aerodromas', region: 'suvalku_koridorius', description: 'Karinis aerodromas Kaliningrado srityje.', distanceToVilniusKm: 320 },
]

export const demoLocationsById = new Map(demoLocations.map((l) => [l.id, l]))

export const kaliningradLocationIds = new Set(['kaliningradas'])
export const belarusWestLocationIds = new Set(['gardinas', 'asmena', 'lyda', 'gozhskij'])
