import { cn } from "@/lib/utils"

/**
 * Marca de las ramas de Vision Studios: el ojo-obturador de siempre con un
 * tentáculo saliendo de cada aspa, como un pulpo. Verde luminoso. Se usa en
 * todo lo que depende de Vision Studios pero vive aparte (el Estudio, VS Studio).
 */
const OJO = [
  "M 237.1572 133.4565 L 136.2263 191.729 A 250 250 0 0 0 237.1572 197.2233 Z",
  "M 189.6044 148.9074 L 36.7526 60.6583 A 250 250 0 0 0 0 100 A 250 250 0 0 0 122.4624 187.6719 Z",
  "M 152.4472 115.4508 L 152.4472 4.5642 A 250 250 0 0 0 45.3172 53.5993 Z",
  "M 162.8428 66.5435 L 263.7737 8.271 A 250 250 0 0 0 162.8428 2.7767 Z",
  "M 210.3956 51.0926 L 363.2474 139.3417 A 250 250 0 0 0 400 100 A 250 250 0 0 0 277.5376 12.3281 Z",
  "M 247.5528 84.5492 L 247.5528 195.4358 A 250 250 0 0 0 354.6828 146.4007 Z",
] as const

// Un tentáculo por aspa: nace en la punta exterior y se enrosca hacia afuera.
const TENTACULOS = [
  "M 200 6 C 186 -40 232 -62 214 -104 C 206 -122 186 -120 190 -104",
  "M 60 42 C 18 26 4 -18 -36 -26 C -62 -31 -70 -6 -52 0",
  "M 4 112 C -40 122 -58 168 -104 160 C -128 156 -126 132 -108 136",
  "M 396 88 C 438 80 452 36 498 40 C 522 42 524 66 506 64",
  "M 344 158 C 386 180 400 226 450 226 C 476 226 478 200 460 204",
  "M 200 196 C 196 240 156 252 166 296 C 172 318 196 314 190 298",
] as const

export function OctoMark({
  className,
  title,
  animate = true,
}: {
  className?: string
  title?: string
  animate?: boolean
}) {
  return (
    <svg
      viewBox="-140 -130 680 460"
      className={cn("octo-mark h-auto shrink-0", animate && "octo-anima", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g
        fill="none"
        stroke="var(--octo, #3dff8f)"
        strokeLinecap="round"
        strokeWidth="18"
      >
        {TENTACULOS.map((d, i) => (
          <path key={i} d={d} className="octo-tentaculo" style={{ animationDelay: `${i * -0.6}s` }} />
        ))}
      </g>
      <g fill="var(--octo, #3dff8f)">
        {OJO.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}
