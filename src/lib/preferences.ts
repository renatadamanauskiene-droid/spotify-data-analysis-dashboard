import { useEffect, useState } from 'react'
import type { NotificationPreference, QuietHours } from '@/types'

const PREF_KEY = 'by-stebesena:notification-preference'
const QUIET_KEY = 'by-stebesena:quiet-hours'

const DEFAULT_PREF: NotificationPreference = 'geltona_raudona'
const DEFAULT_QUIET: QuietHours = { enabled: false, from: '22:00', to: '07:00' }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function useNotificationPreference() {
  const [pref, setPrefState] = useState<NotificationPreference>(() => readJson(PREF_KEY, DEFAULT_PREF))
  const [quiet, setQuietState] = useState<QuietHours>(() => readJson(QUIET_KEY, DEFAULT_QUIET))

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(pref))
    } catch {
      /* ignoruojama */
    }
  }, [pref])

  useEffect(() => {
    try {
      localStorage.setItem(QUIET_KEY, JSON.stringify(quiet))
    } catch {
      /* ignoruojama */
    }
  }, [quiet])

  return { pref, setPref: setPrefState, quiet, setQuiet: setQuietState }
}

const SOURCE_TOGGLES_KEY = 'by-stebesena:source-toggles'

export function useLocalSourceToggles() {
  const [overrides, setOverrides] = useState<Record<string, boolean>>(() => readJson(SOURCE_TOGGLES_KEY, {}))

  useEffect(() => {
    try {
      localStorage.setItem(SOURCE_TOGGLES_KEY, JSON.stringify(overrides))
    } catch {
      /* ignoruojama */
    }
  }, [overrides])

  const toggle = (id: string, current: boolean) => {
    setOverrides((prev) => ({ ...prev, [id]: !current }))
  }

  return { overrides, toggle }
}
