import {
  HomeIcon,
  MapIcon,
  BellIcon,
  RssIcon,
  MoreIcon,
  SatelliteIcon,
  PlaneIcon,
  TrainIcon,
  MissileIcon,
  RadarIcon,
  NotamIcon,
  CorridorIcon,
  SourceIcon,
} from '@/components/icons'
import type { ComponentType, SVGProps } from 'react'

export interface NavItem {
  path: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const primaryNav: NavItem[] = [
  { path: '/', label: 'Dabar', icon: HomeIcon },
  { path: '/zemelapis', label: 'Žemėlapis', icon: MapIcon },
  { path: '/signalai', label: 'Signalai', icon: BellIcon },
  { path: '/srautas', label: 'Srautas', icon: RssIcon },
]

export const moreNav: NavItem[] = [
  { path: '/suvalkai', label: 'Suvalkų koridorius', icon: CorridorIcon },
  { path: '/palydovai', label: 'Palydovų pokyčiai', icon: SatelliteIcon },
  { path: '/aviacija', label: 'Aviacija', icon: PlaneIcon },
  { path: '/gelezinkeliai', label: 'Geležinkeliai', icon: TrainIcon },
  { path: '/raketos', label: 'Raketos ir oro gynyba', icon: MissileIcon },
  { path: '/gnss', label: 'GPS / GNSS ir el. kova', icon: RadarIcon },
  { path: '/notam', label: 'NOTAM / oro erdvė / pratybos', icon: NotamIcon },
  { path: '/saltiniai', label: 'Šaltiniai', icon: SourceIcon },
]

export const allNav: NavItem[] = [...primaryNav.slice(0, 4), ...moreNav]
