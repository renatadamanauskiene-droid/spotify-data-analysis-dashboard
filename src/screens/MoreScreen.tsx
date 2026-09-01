import { Link } from 'react-router-dom'
import { moreNav } from '@/lib/navigation'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ChevronRightIcon } from '@/components/icons'

export default function MoreScreen() {
  return (
    <div>
      <ScreenHeader title="Daugiau" subtitle="Visi stebėsenos moduliai" />
      <ul className="divide-y divide-base-800 overflow-hidden rounded-2xl border border-base-700 bg-base-850">
        {moreNav.map((item) => (
          <li key={item.path}>
            <Link to={item.path} className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-base-800">
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-base-900 text-base-300">
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm text-base-200">{item.label}</span>
              </span>
              <ChevronRightIcon className="h-4 w-4 text-base-500" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
