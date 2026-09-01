import { NavLink } from 'react-router-dom'
import { primaryNav, moreNav } from '@/lib/navigation'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-base-700 bg-base-900 md:flex">
      <div className="px-5 py-6">
        <p className="text-sm font-semibold leading-tight text-base-100">Baltarusijos karinė stebėsena</p>
        <p className="mt-1 text-xs leading-snug text-base-500">Ankstyvojo perspėjimo situacijos centras Lietuvai</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
        {primaryNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-accent-soft text-accent' : 'text-base-300 hover:bg-base-800'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
        <div className="my-3 border-t border-base-800" />
        {moreNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-accent-soft text-accent' : 'text-base-300 hover:bg-base-800'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
