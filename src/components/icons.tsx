import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" />
  </svg>
)

export const MapIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
)

export const BellIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
    <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" />
  </svg>
)

export const RssIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="18" r="1.6" fill="currentColor" stroke="none" />
    <path d="M4 11a9 9 0 0 1 9 9" />
    <path d="M4 5.5A14.5 14.5 0 0 1 18.5 20" />
  </svg>
)

export const MoreIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const SatelliteIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" transform="rotate(45 12 12)" />
    <path d="M4 7l3 3M17 14l3 3M6 20l2.5-2.5M15.5 8.5 18 6" />
  </svg>
)

export const PlaneIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 13.5 21 7l-6.5 8-4-1.2L8 17l-2-1 1-4.3-4.5-1Z" />
  </svg>
)

export const TrainIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="4" width="14" height="12" rx="3" />
    <path d="M5 12h14M9 16l-2 4M15 16l2 4" />
    <circle cx="9" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="15" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
  </svg>
)

export const MissileIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.7" fill="currentColor" stroke="none" />
  </svg>
)

export const RadarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 12 20 8" />
    <path d="M12 4a8 8 0 1 0 8 8" />
    <path d="M12 7.5A4.5 4.5 0 1 0 16.5 12" />
  </svg>
)

export const NotamIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 3v18" />
    <path d="M5 4h12l-2.5 3.5L17 11H5" />
  </svg>
)

export const CorridorIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="5" cy="18" r="2" />
    <circle cx="19" cy="6" r="2" />
    <path d="M6.8 16.5 17.2 7.5" strokeDasharray="2.5 2.5" />
  </svg>
)

export const SourceIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="6" rx="7" ry="2.5" />
    <path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
    <path d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
  </svg>
)

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const AlertTriangleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4.5 21 19H3L12 4.5Z" />
    <path d="M12 10v4.2" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)
