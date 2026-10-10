import type { SVGProps } from "react"

import { OJO_PATHS, PALABRA_HORIZONTAL, PALABRA_VERTICAL } from "./marca-paths"

type P = SVGProps<SVGSVGElement>

/** El ojo-obturador solo (para esperas y dibujos). */
export function Ojo(props: P) {
  return (
    <svg viewBox="0 0 400 200" fill="currentColor" aria-hidden="true" {...props}>
      {OJO_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/** Marca horizontal: ojo + VISION STUDIOS. */
export function LogoHorizontal(props: P) {
  return (
    <svg viewBox="0 0 620 100" fill="currentColor" role="img" aria-label="Vision Studios" {...props}>
      <g transform="scale(.5)">
        {OJO_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path transform="translate(224 35)" d={PALABRA_HORIZONTAL} />
    </svg>
  )
}

/** Marca vertical: ojo arriba, VISION STUDIOS abajo. */
export function LogoVertical(props: P) {
  return (
    <svg viewBox="0 0 400 255" fill="currentColor" role="img" aria-label="Vision Studios" {...props}>
      {OJO_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
      <path transform="translate(0 226)" d={PALABRA_VERTICAL} />
    </svg>
  )
}

const trazo = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const

export const Icono = {
  check: (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={2.2} aria-hidden="true" {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  play: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  ),
  app: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...p}>
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M10.5 18.5h3" strokeLinecap="round" />
    </svg>
  ),
  marca: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...p}>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  mas: (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={2.4} aria-hidden="true" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  afuera: (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={2} aria-hidden="true" {...p}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  ),
  "desde-cero": (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={1.8} aria-hidden="true" {...p}>
      <path d="M4 20l4-1 11-11-3-3L5 16l-1 4Z" />
      <path d="M14 7l3 3" />
    </svg>
  ),
  tuyo: (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={1.8} aria-hidden="true" {...p}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8-8M16 7l2 2M14 9l2 2" />
    </svg>
  ),
  manual: (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={1.8} aria-hidden="true" {...p}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
    </svg>
  ),
  chat: (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={2} aria-hidden="true" {...p}>
      <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.5a8.3 8.3 0 0 1-.9-3.9A8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" />
    </svg>
  ),
  cerrar: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true" {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  sonidoSi: (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={2} aria-hidden="true" {...p}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  ),
  sonidoNo: (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={2} aria-hidden="true" {...p}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 6 6M22 9l-6 6" />
    </svg>
  ),
  persona: (p: P) => (
    <svg viewBox="0 0 24 24" {...trazo} strokeWidth={2} aria-hidden="true" {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
} as const

export type NombreIcono = keyof typeof Icono
