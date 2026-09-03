import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
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
  note: string
  danger: boolean
  destLat: number
  destLng: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VILNIUS_LAT = 54.6872
const VILNIUS_LNG = 25.2797

const SHELTER_GEOJSON_URL =
  'https://opendata.arcgis.com/datasets/8a1e4b06ca714e2983b67c737c667abe_0.geojson'

const EXIT_ROUTES: ExitRoute[] = [
  { road: 'A1', direction: 'Kaunas / Klaipėda', note: 'Rekomenduojamas', danger: false, destLat: 54.8985, destLng: 23.9036 },
  { road: 'A2', direction: 'Panevėžys / Ryga', note: 'Rekomenduojamas', danger: false, destLat: 55.7348, destLng: 24.3571 },
  { road: 'A14', direction: 'Utena / Ryga', note: 'Rekomenduojamas', danger: false, destLat: 55.4991, destLng: 25.6055 },
  { road: 'Vakarinis aplinkkelis', direction: 'Klaipėda (vakarai)', note: 'Rekomenduojamas', danger: false, destLat: 55.7033, destLng: 21.1443 },
  { road: 'A4', direction: 'Druskininkai / Lenkija', note: 'Galimas', danger: false, destLat: 53.991, destLng: 23.9714 },
  { road: 'A15', direction: 'Lazdijai / Lenkija', note: 'Galimas', danger: false, destLat: 54.2314, destLng: 23.5162 },
  { road: 'A3', direction: 'Gardinas (Baltarusija)', note: '⚠️ Pasienis su Baltarusija — vengti', danger: true, destLat: 53.6785, destLng: 23.8286 },
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

function wazeUrl(lat: number, lng: number) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
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

function ShelterMap({ shelters, userPos }: { shelters: Shelter[]; userPos: { lat: number; lng: number } | null }) {
  const center: [number, number] = userPos ? [userPos.lat, userPos.lng] : [55.2, 24.0]
  const zoom = userPos ? 12 : 7

  return (
    <div className="mb-4 h-64 overflow-hidden rounded-xl border border-base-700">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userPos && (
          <CircleMarker
            center={[userPos.lat, userPos.lng]}
            radius={10}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>Jūsų vieta</Popup>
          </CircleMarker>
        )}
        {shelters.slice(0, 80).map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={5}
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.7, weight: 1 }}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {s.address}
              {s.capacity != null && <><br />Talpa: {s.capacity} žm.</>}
              {s.accessible && <><br />♿ Prieinama neįgaliesiems</>}
              {s.open24h && <><br />🕐 Prieiga 24/7</>}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

function ShelterCard({ s, userPos }: { s: Shelter; userPos: { lat: number; lng: number } | null }) {
  return (
    <li className="rounded-xl border border-base-700 bg-base-850 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-base-100">{s.name}</p>
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
        <a
          href={gmapsUrl(s.lat, s.lng, userPos?.lat, userPos?.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
        >
          Eiti
        </a>
      </div>
    </li>
  )
}

function ShelterTab({ shelters, loading, userPos }: { shelters: Shelter[]; loading: boolean; userPos: { lat: number; lng: number } | null }) {
  const sorted = useMemo(() => {
    if (!userPos) return shelters
    return [...shelters]
      .map((s) => ({ ...s, distanceKm: haversineKm(userPos.lat, userPos.lng, s.lat, s.lng) }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  }, [shelters, userPos])

  if (loading) {
    return <p className="py-8 text-center text-sm text-base-500">Kraunamos slėptuvės…</p>
  }
  if (shelters.length === 0) {
    return <p className="py-8 text-center text-sm text-base-500">Nepavyko įkelti slėptuvių duomenų.</p>
  }

  return (
    <>
      <ShelterMap shelters={sorted} userPos={userPos} />
      <p className="mb-3 text-xs text-base-500">
        {userPos ? `Rodomos ${sorted.length} slėptuvės, surūšiuotos pagal atstumą.` : `Rodomos ${sorted.length} slėptuvės. Leiskite prieigą prie vietos — rūšiuosime pagal atstumą.`}
      </p>
      <ul className="space-y-2">
        {sorted.slice(0, 30).map((s) => (
          <ShelterCard key={s.id} s={s} userPos={userPos} />
        ))}
      </ul>
      {sorted.length > 30 && (
        <p className="mt-3 text-center text-xs text-base-500">Rodomos 30 iš {sorted.length} slėptuvių.</p>
      )}
    </>
  )
}

function RouteRow({ r, userPos }: { r: ExitRoute; userPos: { lat: number; lng: number } | null }) {
  const origin = userPos ?? { lat: VILNIUS_LAT, lng: VILNIUS_LNG }
  return (
    <li className={`rounded-xl border p-3.5 ${r.danger ? 'border-risk-red/30 bg-risk-redBg' : 'border-base-700 bg-base-850'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${r.danger ? 'text-risk-red' : 'text-base-100'}`}>{r.road}</span>
            <span className={`text-sm ${r.danger ? 'text-risk-red/80' : 'text-base-300'}`}>→ {r.direction}</span>
          </div>
          <p className={`mt-1 text-xs ${r.danger ? 'text-risk-red/70' : 'text-base-500'}`}>{r.note}</p>
        </div>
        {!r.danger && (
          <div className="flex shrink-0 gap-1.5">
            <a
              href={wazeUrl(r.destLat, r.destLng)}
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
  return (
    <>
      <p className="mb-3 text-xs text-base-400">
        Išvykimo iš Vilniaus maršrutai. Eismo informacija realiuoju laiku — Waze / Google Maps.
        {!userPos && ' Jūsų vieta nenaudojama — maršrutai skaičiuojami nuo Vilniaus centro.'}
      </p>
      <ul className="space-y-2">
        {EXIT_ROUTES.map((r) => (
          <RouteRow key={r.road} r={r} userPos={userPos} />
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
        <ShelterTab shelters={shelters} loading={shelterLoading} userPos={userPos} />
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
