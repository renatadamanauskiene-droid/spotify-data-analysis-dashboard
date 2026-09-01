import type { TimeWindow } from '@/types'
import { TIME_WINDOWS } from '@/types'

export function TimeFilter({ value, onChange }: { value: TimeWindow['label']; onChange: (v: TimeWindow['label']) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-base-700 bg-base-900 p-0.5">
      {TIME_WINDOWS.map((w) => (
        <button
          key={w.label}
          onClick={() => onChange(w.label)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            value === w.label ? 'bg-accent text-white' : 'text-base-400 hover:text-base-200'
          }`}
        >
          {w.label}
        </button>
      ))}
    </div>
  )
}
