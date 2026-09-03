import { NavLink, useLocation } from 'react-router-dom'
import { primaryNav, moreNav } from '@/lib/navigation'
import { MoreIcon } from './icons'
import { useAppData } from '@/lib/AppDataContext'

export function BottomNav() {
  const location = useLocation()
  const data = useAppData()
  const isMoreActive = moreNav.some((item) => item.path === location.pathname) || location.pathname === '/daugiau'

  const hasActiveAlert = !data.loading && (data.lt72.length > 0 || data.alerts.some((a) => a.level === 'RAUDONA'))

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-base-700/70 bg-base-900/96 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-[60px] max-w-md items-stretch">
        {primaryNav.map((item) => {
          const isActive = location.pathname === item.path
          const showBadge = item.path === '/signalai' && hasActiveAlert

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-1 flex-col items-center justify-center gap-[3px]"
            >
              {/* Active top line */}
              {isActive && <span className="absolute inset-x-4 top-0 h-[2px] rounded-b-full bg-accent" />}

              <div className={`relative rounded-xl px-2.5 py-[5px] transition-colors duration-150 ${isActive ? 'bg-accent/12' : ''}`}>
                <item.icon className={`h-5 w-5 transition-colors duration-150 ${isActive ? 'text-accent' : 'text-base-400'}`} />
                {showBadge && (
                  <span className="absolute right-1 top-0.5 flex h-[7px] w-[7px]">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-red opacity-60" />
                    <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-risk-red ring-[1.5px] ring-base-900" />
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-medium leading-none transition-colors duration-150 ${isActive ? 'text-accent' : 'text-base-500'}`}>
                {item.shortLabel ?? item.label}
              </span>
            </NavLink>
          )
        })}

        {/* Daugiau */}
        <NavLink
          to="/daugiau"
          end={false}
          className="relative flex flex-1 flex-col items-center justify-center gap-[3px]"
        >
          {() => {
            const isActive = isMoreActive
            return (
              <>
                {isActive && <span className="absolute inset-x-4 top-0 h-[2px] rounded-b-full bg-accent" />}
                <div className={`rounded-xl px-2.5 py-[5px] transition-colors duration-150 ${isActive ? 'bg-accent/12' : ''}`}>
                  <MoreIcon className={`h-5 w-5 transition-colors duration-150 ${isActive ? 'text-accent' : 'text-base-400'}`} />
                </div>
                <span className={`text-[10px] font-medium leading-none transition-colors duration-150 ${isActive ? 'text-accent' : 'text-base-500'}`}>
                  Daugiau
                </span>
              </>
            )
          }}
        </NavLink>
      </div>
    </nav>
  )
}
