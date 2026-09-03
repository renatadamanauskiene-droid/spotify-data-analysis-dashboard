import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { getDataMode } from '@/lib/dataSource'

export function AppShell({ children }: { children: ReactNode }) {
  const mode = getDataMode()

  return (
    <div className="flex min-h-screen bg-base-950">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        {mode === 'demo' && (
          <div className="border-b border-accent/20 bg-accent-soft/60 px-4 py-1.5 text-center text-[11px] font-medium text-accent">
            DEMO REŽIMAS — rodomi pavyzdiniai duomenys, ne realūs žvalgybos faktai. Realūs šaltiniai dar neintegruoti.
          </div>
        )}
        <main className="flex-1 pb-[72px] md:pb-8">
          <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
