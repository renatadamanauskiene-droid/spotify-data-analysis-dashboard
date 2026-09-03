import { useEffect, useState } from 'react'

// Astrava (Ostrovets) NPP is at ~120° bearing from Vilnius (ESE).
// If wind is coming FROM that direction (windDirection 90–160°), air flows
// from Astrava toward Vilnius. We surface a contextual note — not an alarm.
const ASTRAVA_BEARING = 120
const ASTRAVA_WARN_RANGE = 40 // ±40° around 120°

interface WindObs {
  speed: number   // m/s
  gust: number
  direction: number // degrees, meteorological (where wind comes FROM)
  updatedAt: string
}

function compassLabel(deg: number) {
  const dirs = ['Š', 'ŠR', 'R', 'PR', 'P', 'PV', 'V', 'ŠV']
  return dirs[Math.round(deg / 45) % 8]
}

function beaufortDesc(ms: number) {
  if (ms < 0.3) return 'ramu'
  if (ms < 3.4) return 'silpnas'
  if (ms < 7.9) return 'vidutinis'
  if (ms < 13.9) return 'stiprus'
  return 'labai stiprus'
}

function isFromAstravaDirection(dir: number): boolean {
  const diff = Math.abs(((dir - ASTRAVA_BEARING) + 540) % 360 - 180)
  return diff <= ASTRAVA_WARN_RANGE
}

export function WindWidget() {
  const [obs, setObs] = useState<WindObs | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('https://api.meteo.lt/v1/stations/vilniaus-ams/observations/latest')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const arr: Record<string, unknown>[] = data.observations ?? []
        const latest = arr.at(-1)
        if (latest) {
          setObs({
            speed: Number(latest.windSpeed ?? 0),
            gust: Number(latest.windGust ?? 0),
            direction: Number(latest.windDirection ?? 0),
            updatedAt: String(latest.observationTimeUtc ?? ''),
          })
        }
      })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [])

  if (error || !obs) return null

  const warn = isFromAstravaDirection(obs.direction)
  const label = compassLabel(obs.direction)
  const desc = beaufortDesc(obs.speed)

  // Arrow rotates to show where wind is going (opposite of "from" direction)
  const arrowDeg = (obs.direction + 180) % 360

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
      warn
        ? 'border-risk-yellow/30 bg-risk-yellowBg'
        : 'border-base-700 bg-base-850'
    }`}>
      {/* Compass arrow */}
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-base-600 bg-base-800">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          style={{ transform: `rotate(${arrowDeg}deg)` }}
          aria-hidden
        >
          <path
            d="M9 2 L6.5 12 L9 10 L11.5 12 Z"
            fill={warn ? '#d1a220' : '#6b7280'}
          />
        </svg>
        <span className="absolute -bottom-1 -right-1 rounded bg-base-800 px-0.5 text-[8px] font-bold text-base-400">
          {label}
        </span>
      </div>

      {/* Wind data */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-sm font-bold ${warn ? 'text-risk-yellow' : 'text-base-200'}`}>
            {obs.speed.toFixed(1)} m/s
          </span>
          <span className="text-xs text-base-500">({desc})</span>
          {obs.gust > obs.speed + 2 && (
            <span className="text-xs text-base-500">gūsis {obs.gust.toFixed(1)}</span>
          )}
        </div>
        {warn ? (
          <p className="mt-0.5 text-[11px] font-medium text-risk-yellow/80">
            Vėjas iš Astravos AE krypties (~{obs.direction}°) — oro masės iš BA pusės
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] text-base-500">
            Vėjo kryptis: {obs.direction}° ({label}) · Vilniaus AMS
          </p>
        )}
      </div>
    </div>
  )
}
