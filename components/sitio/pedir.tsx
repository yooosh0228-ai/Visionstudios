"use client"

import type { AnchorHTMLAttributes, ReactNode } from "react"

import { irAContacto, useSitio } from "./estado"

/**
 * Enlace a «Cuéntanos tu negocio». Si viene con un servicio, lo deja marcado en
 * el formulario; si viene de una ficha, escribe «Me interesa algo como…».
 */
export function Pedir({
  servicio,
  algoAsi,
  children,
  onClick,
  ...rest
}: {
  servicio?: string
  algoAsi?: string
  children: ReactNode
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const pedir = useSitio((s) => s.pedir)
  const cerrarFicha = useSitio((s) => s.cerrarFicha)
  return (
    <a
      href="#contacto"
      onClick={(e) => {
        onClick?.(e)
        pedir(servicio, algoAsi)
        if (useSitio.getState().ficha) {
          e.preventDefault()
          cerrarFicha()
          setTimeout(irAContacto, 60)
        }
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
