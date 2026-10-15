"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

/**
 * Ventana de noticias y oferta que sale al entrar a la portada (una vez por
 * visita). Rojo: lo que la persona deja de pagar. Verde: lo que se lleva.
 * Los textos están aquí para cambiarlos sin tocar el diseño.
 */
const CLAVE = "vs-oferta-vista"

export function OfertaEmergente({ regalo }: { regalo: number }) {
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
  return (
    <div className="oferta-fondo" onClick={cerrar}>
      <div
        className="oferta"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oferta-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="oferta-cerrar" aria-label="Cerrar" onClick={cerrar}>
          ×
        </button>
        <p className="oferta-etiqueta">Nuevo en Vision Studios</p>
        <h2 id="oferta-titulo">Tu foto en el trend del momento, sin mensualidad.</h2>
        <ul className="oferta-cifras">
          <li>
            <span className="rojo"><s>US$10/mes</s></span>
            <span>Lo que dejas de pagar en suscripciones de otras apps</span>
          </li>
          <li>
            <span className="verde">RD$0</span>
            <span>de mensualidad: pagas solo lo que creas</span>
          </li>
          {regalo > 0 ? (
            <li>
              <span className="verde">{regalo} créditos</span>
              <span>gratis al entrar con Google, para probar</span>
            </li>
          ) : null}
          <li>
            <span className="verde">5 créditos</span>
            <span>por foto, desde</span>
          </li>
        </ul>
        <p className="oferta-aviso">Más barato que pagar una suscripción mensual que no usas.</p>
        <Link ref={boton} className="boton vivo grande" href="/estudio" onClick={cerrar}>
          Pruébalo gratis
        </Link>
      </div>
    </div>
  )
}
