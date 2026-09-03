import { NavLink, useLocation } from 'react-router-dom'
import { primaryNav, moreNav } from '@/lib/navigation'
import { MoreIcon } from './icons'

export function BottomNav() {
  const location = useLocation()
  const isMoreActive = moreNav.some((item) => item.path === location.pathname)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-base-700 bg-base-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {primaryNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? 'text-accent' : 'text-base-400'}`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to="/daugiau"
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${isMoreActive || location.pathname === '/daugiau' ? 'text-accent' : 'text-base-400'}`}
        >
          <MoreIcon className="h-5 w-5" />
          Daugiau
        </NavLink>
      </div>
    </nav>
  )
}
