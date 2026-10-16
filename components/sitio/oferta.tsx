"use client"

/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { OctoMark } from "@/components/studio/octo-mark"

/**
 * Ventana de noticias y oferta (una vez por visita). Rojo: lo que la persona
 * deja de pagar. Verde: lo que se lleva. El regalo es el gancho; para seguir
 * creando se recargan créditos.
 */
const CLAVE = "vs-oferta-vista"

export function OfertaEmergente({
  regalo,
  recarga,
  fotos,
}: {
  regalo: number
  recarga: number
  fotos: string[]
}) {
  const [abierta, setAbierta] = useState(false)
  const boton = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    let vista = false
    try {
      vista = sessionStorage.getItem(CLAVE) === "1"
    } catch {}
    if (vista) return
    const t = setTimeout(() => setAbierta(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!abierta) return
    boton.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === "Escape" && cerrar()
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [abierta])

  function cerrar() {
    setAbierta(false)
    try {
      sessionStorage.setItem(CLAVE, "1")
    } catch {}
  }

  if (!abierta) return null
  const cinta = [...fotos, ...fotos]
  return (
    <div className="oferta-fondo" onClick={cerrar}>
      <div
        className="oferta"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oferta-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <OctoMark className="oferta-logo" />
        <button type="button" className="oferta-cerrar" aria-label="Cerrar" onClick={cerrar}>
          ×
        </button>
        <p className="oferta-etiqueta">Nuevo · VS Studio</p>
        <h2 id="oferta-titulo">Tu foto en el trend del momento, sin mensualidad.</h2>
        <div className="oferta-cuerpo">
          <ul className="oferta-cifras">
            <li>
              <b className="rojo"><s>US$10/mes</s></b>
              <span>en suscripciones que dejas de pagar</span>
            </li>
            {regalo > 0 ? (
              <li>
                <b className="verde">{regalo} créditos gratis</b>
                <span>al entrar con Google</span>
              </li>
            ) : null}
            <li>
              <b className="verde">RD$0</b>
              <span>de mensualidad</span>
            </li>
            {recarga > 0 ? (
              <li>
                <b className="verde">Desde RD${recarga}</b>
                <span>recargas para seguir creando</span>
              </li>
            ) : null}
          </ul>
          {fotos.length ? (
            <div className="oferta-cinta" aria-hidden>
              <div className="oferta-cinta-pista">
                {cinta.map((src, i) => (
                  <img key={i} src={src} alt="" loading="lazy" />
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <p className="oferta-aviso">Más barato que una suscripción mensual que no usas.</p>
        <Link ref={boton} className="oferta-boton" href="/estudio" onClick={cerrar}>
          Pruébalo gratis
        </Link>
      </div>
    </div>
  )
}
