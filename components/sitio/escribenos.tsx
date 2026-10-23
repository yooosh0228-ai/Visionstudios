"use client"

import { useEffect, useRef, useState } from "react"

import { Pedir } from "./pedir"

/**
 * «Escríbenos»: abre una hojita con los caminos directos (Instagram DM y
 * WhatsApp) sin mostrar el número, y el formulario como tercera opción.
 */
export function Escribenos({
  instagram,
  whatsapp,
  className = "boton vivo",
  children,
}: {
  instagram: string
  whatsapp: string
  className?: string
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const hoja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    hoja.current?.querySelector<HTMLElement>("a")?.focus()
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false)
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [abierto])

  const saludo = encodeURIComponent("¡Hola Vision Studios! Quiero información sobre sus servicios.")
  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog" aria-expanded={abierto} onClick={() => setAbierto(true)}>
        {children}
      </button>
      {abierto ? (
        <div className="hoja-fondo" onClick={() => setAbierto(false)}>
          <div
            ref={hoja}
            className="hoja"
            role="dialog"
            aria-modal="true"
            aria-label="Escríbenos"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="hoja-asa" aria-hidden />
            <p className="hoja-titulo">¿Por dónde nos escribes?</p>
            <a className="hoja-op ig" href={`https://ig.me/m/${instagram}`} target="_blank" rel="noopener" onClick={() => setAbierto(false)}>
              <span className="hoja-ico" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
              </span>
              <span>
                <b>DM de Instagram</b>
                <small>Te abre el chat con nosotros</small>
              </span>
            </a>
            {whatsapp ? (
              <a className="hoja-op wa" href={`https://wa.me/${whatsapp}?text=${saludo}`} target="_blank" rel="noopener" onClick={() => setAbierto(false)}>
                <span className="hoja-ico" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z"/></svg>
                </span>
                <span>
                  <b>WhatsApp</b>
                  <small>Directo, con un mensaje listo</small>
                </span>
              </a>
            ) : null}
            <Pedir className="hoja-op" onClick={() => setAbierto(false)}>
              <span className="hoja-ico" aria-hidden>✍️</span>
              <span>
                <b>Llenar el formulario</b>
                <small>Un minuto y te escribimos nosotros</small>
              </span>
            </Pedir>
            <button type="button" className="hoja-cerrar" onClick={() => setAbierto(false)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

/** El Monumento de Santiago, en línea, del tamaño de las letras. */
export function Monumento(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M8 1.2v2.2M6.6 2.4 8 3.4l1.4-1" />
      <path d="M6.6 5.2h2.8v2H6.6z" />
      <path d="M6.9 7.2 6.4 18h3.2l-.5-10.8" />
      <path d="M7 10.5h2M6.9 13.5h2.2" />
      <path d="M4.2 18h7.6v3H4.2zM2.6 21h10.8v8.6H2.6z" />
      <path d="M5 23.2v5.2M8 23.2v5.2M11 23.2v5.2M1.2 29.6h13.6" />
    </svg>
  )
}
