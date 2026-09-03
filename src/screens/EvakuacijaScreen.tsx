import { useState, useEffect, useMemo, useRef, type RefObject } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { AlertTriangleIcon, ClockIcon } from '@/components/icons'
import { formatDateTimeLt } from '@/lib/format'
import type { Lt72Alert } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Shelter {
  id: string
  name: string
  address: string
  capacity: number | null
  accessible: boolean
  open24h: boolean
  lat: number
  lng: number
  distanceKm?: number
}

interface ExitRoute {
  road: string
  direction: string
  baseNote: string
  danger: boolean
  destLat: number
  destLng: number
  // Entry point: where this road exits Vilnius city boundary
  entryLat: number
  entryLng: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VILNIUS_LAT = 54.6872
const VILNIUS_LNG = 25.2797

const SHELTER_GEOJSON_URL =
  'https://opendata.arcgis.com/datasets/8a1e4b06ca714e2983b67c737c667abe_0.geojson'

const EXIT_ROUTES: ExitRoute[] = [
  {
    road: 'A1',
    direction: 'Kaunas / Klaipėda',
    baseNote: 'Rekomenduojamas',
    danger: false,
    destLat: 54.8985,
    destLng: 23.9036,
    entryLat: 54.6290,
    entryLng: 25.1950,
  },
  {
    road: 'A2',
    direction: 'Panevėžys / Ryga',
    baseNote: 'Rekomenduojamas',
    danger: false,
    destLat: 55.7348,
    destLng: 24.3571,
    entryLat: 54.7600,
    entryLng: 25.2700,
  },
  {
    road: 'A14',
    direction: 'Utena / Ryga',
    baseNote: 'Rekomenduojamas',
    danger: false,
    destLat: 55.4991,
    destLng: 25.6055,
    entryLat: 54.7350,
    entryLng: 25.4500,
  },
  {
    road: 'Vakarinis aplinkkelis',
    direction: 'Klaipėda (vakarai)',
    baseNote: 'Rekomenduojamas',
    danger: false,
    destLat: 55.7033,
    destLng: 21.1443,
    entryLat: 54.7450,
    entryLng: 25.0700,
  },
  {
    road: 'A4',
    direction: 'Druskininkai / Lenkija',
    baseNote: 'Galimas',
    danger: false,
    destLat: 53.991,
    destLng: 23.9714,
    entryLat: 54.6100,
    entryLng: 25.0900,
  },
  {
    road: 'A15',
    direction: 'Lazdijai / Lenkija',
    baseNote: 'Galimas',
    danger: false,
    destLat: 54.2314,
    destLng: 23.5162,
    entryLat: 54.6400,
    entryLng: 25.0300,
  },
  {
    road: 'A3',
    direction: 'Gardinas (Baltarusija)',
    baseNote: '⚠️ Pasienis su Baltarusija — vengti',
    danger: true,
    destLat: 53.6785,
    destLng: 23.8286,
    entryLat: 54.6800,
    entryLng: 25.6000,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function wazeUrl(lat: number, lng: number, originLat?: number, originLng?: number) {
  const dest = `${lat},${lng}`
  if (originLat != null && originLng != null) {
    return `https://waze.com/ul?ll=${dest}&navigate=yes&from=${originLat},${originLng}`
  }
  return `https://waze.com/ul?ll=${dest}&navigate=yes`
}

function gmapsUrl(destLat: number, destLng: number, originLat?: number, originLng?: number) {
  const base = 'https://www.google.com/maps/dir/?api=1'
  const origin = originLat != null ? `&origin=${originLat},${originLng}` : ''
  return `${base}${origin}&destination=${destLat},${destLng}&travelmode=driving`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseShelters(geojson: any): Shelter[] {
  if (!geojson?.features) return []
  return geojson.features
    .map((f: any, i: number) => {
      const p = f.properties ?? {}
      const coords = f.geometry?.coordinates
      if (!coords) return null
      const lng = coords[0]
      const lat = coords[1]
      if (typeof lat !== 'number' || typeof lng !== 'number') return null
      const address = [p.gatve, p.namo_numeris, p.gyvenviete].filter(Boolean).join(' ')
      return {
        id: String(p.objectid ?? i),
        name: p.pavadinimas ?? 'Slėptuvė',
        address,
        capacity: p.gyventoju_skaicius != null ? Number(p.gyventoju_skaicius) : null,
        accessible: Boolean(p.pritaikyta_asmenims_su_negalia),
        open24h: Boolean(p.patekimas_visa_para),
        lat,
        lng,
      } satisfies Shelter
    })
    .filter(Boolean) as Shelter[]
}

// ---------------------------------------------------------------------------
// Map helpers (must be inside MapContainer)
// ---------------------------------------------------------------------------

function MapFlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.6 })
    // lat/lng primitives in deps — avoids object reference instability
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, lat, lng, zoom])
  return null
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Lt72Banner({ alerts }: { alerts: Lt72Alert[] }) {
  const [open, setOpen] = useState(true)
  if (alerts.length === 0) return null
  return (
    <div className="mb-4 rounded-xl border border-risk-red/40 bg-risk-redBg">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="h-4 w-4 text-risk-red" />
          <span className="text-sm font-semibold text-risk-red">
            LT72 aktyvūs perspėjimai ({alerts.length})
          </span>
        </div>
        <span className="text-xs text-risk-red">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="border-t border-risk-red/20 px-4 pb-3 pt-2 space-y-2">
          {alerts.slice(0, 5).map((a) => (
            <li key={a.id}>
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-risk-red hover:underline">
                {a.title}
              </a>
              {a.publishedAt && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-risk-red/60">
                  <ClockIcon className="h-3 w-3" />
                  {formatDateTimeLt(a.publishedAt)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ShelterMapProps {
  shelters: Shelter[]
  userPos: { lat: number; lng: number } | null
  selected: Shelter | null
  onSelect: (s: Shelter) => void
}

function ShelterMap({ shelters, userPos, selected, onSelect }: ShelterMapProps) {
  const center: [number, number] = userPos ? [userPos.lat, userPos.lng] : [55.2, 24.0]
  const zoom = userPos ? 12 : 7

  // Build the set of markers: top 60 by distance + always include selected
  const markers = useMemo(() => {
    const top = shelters.slice(0, 60)
    if (selected && !top.find((s) => s.id === selected.id)) {
      return [...top, selected]
    }
    return top
  }, [shelters, selected])

  return (
    <div className="mb-4 h-64 overflow-hidden rounded-xl border border-base-700">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fly to selected shelter */}
        {selected && <MapFlyTo lat={selected.lat} lng={selected.lng} zoom={15} />}

        {/* User location */}
        {userPos && (
          <CircleMarker
            center={[userPos.lat, userPos.lng]}
            radius={10}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 2 }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]}>
              <span className="text-[11px]">Jūs</span>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Shelter markers */}
        {markers.map((s) => {
          const isSelected = selected?.id === s.id
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={isSelected ? 9 : 5}
              pathOptions={
                isSelected
                  ? { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2 }
                  : { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.7, weight: 1 }
              }
              eventHandlers={{ click: () => onSelect(s) }}
            >
              {isSelected && (
                <Tooltip permanent direction="top" offset={[0, -12]}>
                  <span className="text-[11px] font-semibold">{s.name}</span>
                </Tooltip>
              )}
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{s.name}</p>
                  {s.address && <p className="text-xs text-gray-500">{s.address}</p>}
                  {s.capacity != null && <p className="text-xs">👥 {s.capacity} žm.</p>}
                  {s.accessible && <p className="text-xs">♿ Prieinama neįgaliesiems</p>}
                  {s.open24h && <p className="text-xs">🕐 Prieiga 24/7</p>}
                  <div className="flex gap-1.5 pt-1">
                    <a
                      href={wazeUrl(s.lat, s.lng, userPos?.lat, userPos?.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-amber-500 px-2 py-1 text-[11px] font-semibold text-white"
                    >
                      Waze
                    </a>
                    <a
                      href={gmapsUrl(s.lat, s.lng, userPos?.lat, userPos?.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white"
                    >
                      Maps
                    </a>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}

interface ShelterCardProps {
  s: Shelter
  userPos: { lat: number; lng: number } | null
  selected: boolean
  onSelect: () => void
}

function ShelterCard({ s, userPos, selected, onSelect }: ShelterCardProps) {
  return (
    <li
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border p-3.5 transition-colors ${
        selected
          ? 'border-amber-500/60 bg-amber-500/10'
          : 'border-base-700 bg-base-850 hover:border-base-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {selected && <span className="text-amber-400 text-xs">📍</span>}
            <p className={`truncate text-sm font-semibold ${selected ? 'text-amber-300' : 'text-base-100'}`}>
              {s.name}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-base-400">{s.address}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {s.capacity != null && (
              <span className="rounded-full border border-base-600 px-2 py-0.5 text-[10px] text-base-400">
                👥 {s.capacity} žm.
              </span>
            )}
            {s.accessible && (
              <span className="rounded-full border border-base-600 px-2 py-0.5 text-[10px] text-base-400">
                ♿ Prieinama
              </span>
            )}
            {s.open24h && (
              <span className="rounded-full border border-base-600 px-2 py-0.5 text-[10px] text-base-400">
                🕐 24/7
              </span>
            )}
            {s.distanceKm != null && (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                {s.distanceKm < 1 ? `${Math.round(s.distanceKm * 1000)} m` : `${s.distanceKm.toFixed(1)} km`}
              </span>
            )}
          </div>
        </div>

        {/* Route buttons — always Maps, Waze prominent when selected */}
        <div className="flex shrink-0 flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
          {selected ? (
            <>
              <a
                href={wazeUrl(s.lat, s.lng, userPos?.lat, userPos?.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-amber-400"
              >
                Waze
              </a>
              <a
                href={gmapsUrl(s.lat, s.lng, userPos?.lat, userPos?.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-accent px-3 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-accent/90"
              >
                Maps
              </a>
            </>
          ) : (
            <a
              href={gmapsUrl(s.lat, s.lng, userPos?.lat, userPos?.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
            >
              Eiti
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

interface ShelterTabProps {
  shelters: Shelter[]
  loading: boolean
  userPos: { lat: number; lng: number } | null
  selectedId: string | null
  onSelect: (s: Shelter | null) => void
  mapRef: RefObject<HTMLDivElement>
}

function ShelterTab({ shelters, loading, userPos, selectedId, onSelect, mapRef }: ShelterTabProps) {
  const sorted = useMemo(() => {
    if (!userPos) return shelters
    return [...shelters]
      .map((s) => ({ ...s, distanceKm: haversineKm(userPos.lat, userPos.lng, s.lat, s.lng) }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  }, [shelters, userPos])

  const selected = useMemo(() => sorted.find((s) => s.id === selectedId) ?? null, [sorted, selectedId])

  const handleSelect = (s: Shelter) => {
    // Toggle: clicking selected again deselects
    onSelect(selectedId === s.id ? null : s)
    // Scroll map into view
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-base-500">Kraunamos slėptuvės…</p>
  }
  if (shelters.length === 0) {
    return <p className="py-8 text-center text-sm text-base-500">Nepavyko įkelti slėptuvių duomenų.</p>
  }

  return (
    <>
      <div ref={mapRef}>
        <ShelterMap shelters={sorted} userPos={userPos} selected={selected} onSelect={handleSelect} />
      </div>
      <p className="mb-3 text-xs text-base-500">
        {userPos
          ? `${sorted.length} slėptuvės, surūšiuotos pagal atstumą. Paspauskite ant kortelės — žemėlapyje matysite maršrutą.`
          : `${sorted.length} slėptuvės. Leiskite prieigą prie vietos — rūšiuosime pagal atstumą.`}
      </p>
      <ul className="space-y-2">
        {sorted.slice(0, 30).map((s) => (
          <ShelterCard
            key={s.id}
            s={s}
            userPos={userPos}
            selected={s.id === selectedId}
            onSelect={() => handleSelect(s)}
          />
        ))}
      </ul>
      {sorted.length > 30 && (
        <p className="mt-3 text-center text-xs text-base-500">Rodomos 30 iš {sorted.length} slėptuvių.</p>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Exit routes tab
// ---------------------------------------------------------------------------

interface ScoredRoute extends ExitRoute {
  distanceKm: number
  rank: number
}

function RouteRow({ r, userPos, rank }: { r: ScoredRoute; userPos: { lat: number; lng: number } | null }) {
  const origin = userPos ?? { lat: VILNIUS_LAT, lng: VILNIUS_LNG }
  const isBest = !r.danger && rank === 0
  const isSecond = !r.danger && rank === 1

  return (
    <li className={`rounded-xl border p-3.5 ${r.danger ? 'border-risk-red/30 bg-risk-redBg' : 'border-base-700 bg-base-850'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-sm font-bold ${r.danger ? 'text-risk-red' : 'text-base-100'}`}>{r.road}</span>
            <span className={`text-sm ${r.danger ? 'text-risk-red/80' : 'text-base-300'}`}>→ {r.direction}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {isBest && userPos && (
              <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] font-semibold text-accent">
                ⭐ Artimiausias jūsų vietai
              </span>
            )}
            {isSecond && userPos && (
              <span className="rounded-full border border-base-600 px-2 py-0.5 text-[10px] text-base-400">
                2-as pagal artumą
              </span>
            )}
            <span className={`text-xs ${r.danger ? 'text-risk-red/70' : 'text-base-500'}`}>{r.baseNote}</span>
            {userPos && !r.danger && (
              <span className="text-[10px] text-base-600">
                ~{r.distanceKm < 1 ? `${Math.round(r.distanceKm * 1000)} m` : `${r.distanceKm.toFixed(1)} km`} iki įvažiavimo
              </span>
            )}
          </div>
        </div>
        {!r.danger && (
          <div className="flex shrink-0 gap-1.5">
            <a
              href={wazeUrl(r.destLat, r.destLng, origin.lat, origin.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-base-600 px-2.5 py-1.5 text-[11px] font-semibold text-base-300 transition hover:bg-base-700"
            >
              Waze
            </a>
            <a
              href={gmapsUrl(r.destLat, r.destLng, origin.lat, origin.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-accent/90"
            >
              Maps
            </a>
          </div>
        )}
      </div>
    </li>
  )
}

function RoutesTab({ userPos }: { userPos: { lat: number; lng: number } | null }) {
  const scored = useMemo<ScoredRoute[]>(() => {
    const ref = userPos ?? { lat: VILNIUS_LAT, lng: VILNIUS_LNG }
    const withDist = EXIT_ROUTES.map((r) => ({
      ...r,
      distanceKm: haversineKm(ref.lat, ref.lng, r.entryLat, r.entryLng),
    }))
    // Sort: non-danger by entry distance, danger always last
    const safe = withDist.filter((r) => !r.danger).sort((a, b) => a.distanceKm - b.distanceKm)
    const danger = withDist.filter((r) => r.danger)
    return [...safe, ...danger].map((r, i) => ({ ...r, rank: r.danger ? 999 : i }))
  }, [userPos])

  return (
    <>
      <p className="mb-3 text-xs text-base-400">
        {userPos
          ? 'Maršrutai rūšiuojami pagal artumą jūsų dabartinei vietai.'
          : 'Jūsų vieta nenaudojama. Leiskite prieigą prie vietos — surūšiuosime pagal artumą.'}
        {' '}Eismo informacija realiuoju laiku — Waze / Google Maps.
      </p>
      <ul className="space-y-2">
        {scored.map((r) => (
          <RouteRow key={r.road} r={r} userPos={userPos} rank={r.rank} />
        ))}
      </ul>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function EvakuacijaScreen() {
  const data = useAppData()
  const [tab, setTab] = useState<'sleptuvos' | 'marsrutai'>('sleptuvos')
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [shelterLoading, setShelterLoading] = useState(true)
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  const lt72 = useMemo(
    () =>
      [...data.lt72].sort((a, b) => {
        if (!a.publishedAt) return 1
        if (!b.publishedAt) return -1
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      }),
    [data.lt72],
  )

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Naršyklė nepalaiko vietos nustatymo.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError('Nepavyko gauti vietos — leiskite prieigą naršyklėje.'),
      { timeout: 10_000 },
    )
  }, [])

  // Shelter data
  useEffect(() => {
    const controller = new AbortController()
    fetch(SHELTER_GEOJSON_URL, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => setShelters(parseShelters(json)))
      .catch((err) => {
        if (err.name !== 'AbortError') console.warn('[EvakuacijaScreen] Nepavyko įkelti slėptuvių:', err)
      })
      .finally(() => setShelterLoading(false))
    return () => controller.abort()
  }, [])

  const handleSelectShelter = (s: Shelter | null) => {
    setSelectedShelterId(s?.id ?? null)
  }

  return (
    <div>
      <ScreenHeader title="Evakuacija" subtitle="Oficialios slėptuvės ir išvykimo maršrutai" />

      <Lt72Banner alerts={lt72} />

      {/* Geolocation status */}
      {!userPos && !geoError && (
        <p className="mb-4 rounded-lg border border-base-700 bg-base-850 px-4 py-2.5 text-xs text-base-400">
          Nustatoma Jūsų vieta…
        </p>
      )}
      {geoError && (
        <p className="mb-4 rounded-lg border border-risk-yellow/30 bg-risk-yellowBg px-4 py-2.5 text-xs text-risk-yellow">
          {geoError}
        </p>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-base-700 bg-base-850 p-1">
        {(
          [
            { key: 'sleptuvos', label: '🏠 Slėptuvės' },
            { key: 'marsrutai', label: '🚗 Išvykimo maršrutai' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === t.key ? 'bg-accent text-white' : 'text-base-400 hover:text-base-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sleptuvos' ? (
        <ShelterTab
          shelters={shelters}
          loading={shelterLoading}
          userPos={userPos}
          selectedId={selectedShelterId}
          onSelect={handleSelectShelter}
          mapRef={mapRef}
        />
      ) : (
        <RoutesTab userPos={userPos} />
      )}

      {/* Emergency contacts */}
      <div className="mt-6 rounded-xl border border-base-700 bg-base-850 p-4">
        <p className="mb-2 text-sm font-semibold text-base-200">Pagalbos numeriai</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '112', sub: 'Bendra pagalba' },
            { label: 'LT72', sub: 'lt72.lt' },
            { label: 'PAGD', sub: 'Priešgaisrinė apsauga' },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-base-700 px-3 py-2 text-center">
              <p className="text-base font-bold text-base-100">{c.label}</p>
              <p className="text-[10px] text-base-500">{c.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Legal disclaimer */}
      <p className="mt-4 text-[11px] leading-relaxed text-base-600">
        Rekomenduojami maršrutai pagal dabartinį eismą. Nepriklausoma viešų duomenų ir OSINT platforma.
        Kritiniais atvejais vadovaukitės LT72, 112 ir atsakingų institucijų nurodymais.
      </p>
    </div>
  )
}
