"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Fila que se desliza a los lados: con el dedo en el celular, y en la
 * computadora con flechas, la rueda del mouse (Shift) o arrastrando.
 */
export function Deslizador({
  children,
  className,
  pistaClassName,
  etiqueta = "Galería",
}: {
  children: ReactNode
  className?: string
  pistaClassName?: string
  etiqueta?: string
}) {
  const pista = useRef<HTMLDivElement>(null)
  const [puede, setPuede] = useState({ izq: false, der: false })

  useEffect(() => {
    const el = pista.current
    if (!el) return
    const medir = () =>
      setPuede({
        izq: el.scrollLeft > 4,
        der: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      })
    medir()
    el.addEventListener("scroll", medir, { passive: true })
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    // Arrastrar con el mouse.
    let x0 = 0
    let s0 = 0
    let arrastrando = false
    let movio = false
    const bajar = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      arrastrando = true
      movio = false
      x0 = e.clientX
      s0 = el.scrollLeft
    }
    const mover = (e: PointerEvent) => {
      if (!arrastrando) return
      const dx = e.clientX - x0
      if (Math.abs(dx) > 5) movio = true
      el.scrollLeft = s0 - dx
    }
    const soltar = () => {
      arrastrando = false
    }
    const clic = (e: MouseEvent) => {
      if (movio) {
        e.preventDefault()
        e.stopPropagation()
        movio = false
      }
    }
    el.addEventListener("pointerdown", bajar)
    window.addEventListener("pointermove", mover)
    window.addEventListener("pointerup", soltar)
    el.addEventListener("click", clic, true)
    return () => {
      el.removeEventListener("scroll", medir)
      ro.disconnect()
      el.removeEventListener("pointerdown", bajar)
      window.removeEventListener("pointermove", mover)
      window.removeEventListener("pointerup", soltar)
      el.removeEventListener("click", clic, true)
    }
  }, [])

  const ir = (dir: 1 | -1) => {
    const el = pista.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  const flecha =
    "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-lg backdrop-blur-md transition-opacity hover:bg-black/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none pointer-fine:flex disabled:pointer-events-none disabled:opacity-0"

  return (
    <div className={cn("relative", className)} role="region" aria-label={etiqueta}>
      <button type="button" aria-label="Anterior" className={cn(flecha, "left-1")} disabled={!puede.izq} onClick={() => ir(-1)}>
        <ChevronLeft className="size-5" />
      </button>
      <div
        ref={pista}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] select-none pointer-fine:cursor-grab pointer-fine:active:cursor-grabbing",
          pistaClassName
        )}
      >
        {children}
      </div>
      <button type="button" aria-label="Siguiente" className={cn(flecha, "right-1")} disabled={!puede.der} onClick={() => ir(1)}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
