import { cn } from "@/lib/utils"

/**
 * The 402 Vision Studios mark: an eye whose iris is a six-blade shutter. The
 * six paths are the canonical geometry; copy, never redraw. The box is always
 * 2:1 (set a width, height follows), one fill via currentColor, no stroke.
 * Minimum 28px wide on screen.
 */
export function BrandMark({
  className,
  title,
}: {
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="currentColor"
      className={cn("aspect-[2/1] h-auto shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M 237.1572 133.4565 L 136.2263 191.729 A 250 250 0 0 0 237.1572 197.2233 Z" />
      <path d="M 189.6044 148.9074 L 36.7526 60.6583 A 250 250 0 0 0 0 100 A 250 250 0 0 0 122.4624 187.6719 Z" />
      <path d="M 152.4472 115.4508 L 152.4472 4.5642 A 250 250 0 0 0 45.3172 53.5993 Z" />
      <path d="M 162.8428 66.5435 L 263.7737 8.271 A 250 250 0 0 0 162.8428 2.7767 Z" />
      <path d="M 210.3956 51.0926 L 363.2474 139.3417 A 250 250 0 0 0 400 100 A 250 250 0 0 0 277.5376 12.3281 Z" />
      <path d="M 247.5528 84.5492 L 247.5528 195.4358 A 250 250 0 0 0 354.6828 146.4007 Z" />
    </svg>
  )
}
