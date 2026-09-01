import { useState } from 'react'
import { useAppData } from '@/lib/AppDataContext'
import { ScreenHeader } from '@/components/ScreenHeader'
import { DemoBadge } from '@/components/DemoBadge'
import { EmptyState } from '@/components/EmptyState'
import { AlertTriangleIcon, BellIcon, ClockIcon } from '@/components/icons'
import { formatDateTimeLt } from '@/lib/format'
import { getDataMode } from '@/lib/dataSource'
import { useNotificationPreference } from '@/lib/preferences'
import {
  isPushSupported,
  isPushBackendConfigured,
  requestNotificationPermission,
  subscribeToPush,
  registerSubscriptionWithBackend,
} from '@/lib/pushNotifications'
import type { AlertLevel } from '@/types'

const LEVEL_STYLE: Record<AlertLevel, string> = {
  RAUDONA: 'border-risk-red/40 bg-risk-redBg text-risk-red',
  GELTONA: 'border-risk-yellow/40 bg-risk-yellowBg text-risk-yellow',
  INFO: 'border-base-600 bg-base-800 text-base-300',
}

export default function AlertsScreen() {
  const data = useAppData()
  const mode = getDataMode()
  const alerts = [...data.alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div>
      <ScreenHeader title="Signalai" subtitle="Alert Center ir pranešimų nustatymai" action={mode === 'demo' ? <DemoBadge /> : undefined} />

      <NotificationSettings />

      <h2 className="mb-2 mt-6 flex items-center gap-2 text-sm font-semibold text-base-300">
        <BellIcon className="h-4 w-4" /> Įspėjimų istorija
      </h2>
      {alerts.length === 0 ? (
        <EmptyState title="Nėra reikšmingų pokyčių" hint="Šiuo metu aktyvių įspėjimų nėra." />
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className={`rounded-xl border p-3.5 ${LEVEL_STYLE[a.level]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm font-semibold">{a.title}</p>
                </div>
                <span className="whitespace-nowrap rounded-full border border-current/30 px-2 py-0.5 text-[10px] font-semibold">{a.level}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-base-300">{a.body}</p>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-base-500">
                <ClockIcon className="h-3.5 w-3.5" /> {formatDateTimeLt(a.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NotificationSettings() {
  const { pref, setPref, quiet, setQuiet } = useNotificationPreference()
  const [status, setStatus] = useState<string | null>(null)

  const handleEnable = async () => {
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      setStatus('Pranešimai neleisti naršyklės nustatymuose.')
      return
    }
    if (!isPushBackendConfigured()) {
      setStatus('Leidimas suteiktas. Push prenumerata dar negalima — backend/VAPID raktas dar nesukonfigūruotas.')
      return
    }
    const sub = await subscribeToPush()
    if (!sub) {
      setStatus('Nepavyko sukurti prenumeratos.')
      return
    }
    const registered = await registerSubscriptionWithBackend(sub, pref, quiet)
    setStatus(registered ? 'Push pranešimai įjungti.' : 'Prenumerata sukurta įrenginyje, tačiau nepavyko jos užregistruoti backend’e.')
  }

  return (
    <div className="rounded-2xl border border-base-700 bg-base-850 p-4">
      <p className="text-sm font-medium text-base-200">Pranešimų nustatymai</p>

      <div className="mt-3 space-y-1.5">
        {(
          [
            { key: 'raudona', label: 'Tik RAUDONA' },
            { key: 'geltona_raudona', label: 'GELTONA + RAUDONA' },
            { key: 'visi', label: 'Visi dienos atnaujinimai' },
          ] as const
        ).map((opt) => (
          <label key={opt.key} className="flex items-center gap-2 text-sm text-base-300">
            <input type="radio" name="pref" checked={pref === opt.key} onChange={() => setPref(opt.key)} className="accent-accent" />
            {opt.label}
          </label>
        ))}
      </div>

      <div className="mt-4 border-t border-base-800 pt-3">
        <label className="flex items-center gap-2 text-sm text-base-300">
          <input type="checkbox" checked={quiet.enabled} onChange={(e) => setQuiet({ ...quiet, enabled: e.target.checked })} className="accent-accent" />
          Tylos valandos (quiet hours)
        </label>
        {quiet.enabled && (
          <div className="mt-2 flex items-center gap-2 text-sm text-base-300">
            <input
              type="time"
              value={quiet.from}
              onChange={(e) => setQuiet({ ...quiet, from: e.target.value })}
              className="rounded-md border border-base-700 bg-base-900 px-2 py-1 text-xs"
            />
            <span className="text-base-500">iki</span>
            <input
              type="time"
              value={quiet.to}
              onChange={(e) => setQuiet({ ...quiet, to: e.target.value })}
              className="rounded-md border border-base-700 bg-base-900 px-2 py-1 text-xs"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleEnable}
        disabled={!isPushSupported()}
        className="mt-4 w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Įjungti push pranešimus
      </button>
      {!isPushSupported() && <p className="mt-2 text-[11px] text-base-500">Šis naršyklė nepalaiko push pranešimų.</p>}
      {status && <p className="mt-2 text-[11px] text-base-400">{status}</p>}
    </div>
  )
}
