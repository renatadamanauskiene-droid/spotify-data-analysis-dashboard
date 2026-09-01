import type { ReactNode } from 'react'

export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-base-100">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-base-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
