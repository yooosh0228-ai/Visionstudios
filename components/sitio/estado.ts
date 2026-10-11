"use client"

import { create } from "zustand"

/**
 * Lo que comparten las piezas de la portada: qué ficha está abierta y qué
 * servicio dejó marcado un botón «Me interesa» para el formulario.
 */
type EstadoSitio = {
  ficha: string | null
  abrirFicha: (id: string) => void
  cerrarFicha: () => void
  marcados: string[]
  nota: string
  pedir: (servicio?: string, algoAsi?: string) => void
  alternar: (servicio: string) => void
  ponerNota: (nota: string) => void
}

export const useSitio = create<EstadoSitio>((set) => ({
  ficha: null,
  abrirFicha: (id) => set({ ficha: id }),
  cerrarFicha: () => set({ ficha: null }),
  marcados: [],
  nota: "",
  pedir: (servicio, algoAsi) =>
    set((s) => ({
      marcados:
        servicio && !s.marcados.includes(servicio)
          ? [...s.marcados, servicio]
          : s.marcados,
      nota: algoAsi && !s.nota ? `Me interesa algo como «${algoAsi}».` : s.nota,
    })),
  alternar: (servicio) =>
    set((s) => ({
      marcados: s.marcados.includes(servicio)
        ? s.marcados.filter((x) => x !== servicio)
        : [...s.marcados, servicio],
    })),
  ponerNota: (nota) => set({ nota }),
}))

/** Lo que el script de arranque dejó escrito en <html> sobre el dispositivo. */
export function dispositivo() {
  if (typeof document === "undefined")
    return { tipo: "escritorio", so: "otro", ahorro: false, quieto: false }
  const d = document.documentElement.dataset
  return {
    tipo: d.dispositivo ?? "escritorio",
    so: d.so ?? "otro",
    ahorro: d.datos === "ahorro",
    quieto: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  }
}

/** Baja hasta el formulario respetando «reducir movimiento». */
export function irAContacto() {
  const destino = document.getElementById("contacto")
  if (!destino) return
  destino.scrollIntoView({ behavior: dispositivo().quieto ? "auto" : "smooth" })
}
