"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { OctoMark } from "@/components/studio/octo-mark"

import "./proximamente.css"

const AGENTES = [
  ["💬", "Asistente de WhatsApp", "Contesta precios, horarios y pedidos por ti, a cualquier hora."],
  ["📅", "Mes de contenido", "Te arma el calendario y los textos de tus redes del mes."],
  ["📄", "CV y documentos", "Currículum, cartas y cotizaciones listas en minutos."],
] as const

/** Las dos láminas de «Próximamente»: Estudio IA y Agentes IA, que se deslizan. */
export function ProximamenteLaminas({ fotos, inicio = 0 }: { fotos: string[]; inicio?: 0 | 1 }) {
  const pista = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(0)

  useEffect(() => {
    const el = pista.current
    if (!el) return
    if (inicio) el.scrollLeft = el.clientWidth
    const medir = () => setActual(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
    el.addEventListener("scroll", medir, { passive: true })
    return () => el.removeEventListener("scroll", medir)
  }, [inicio])

  const ir = (i: number) => pista.current?.scrollTo({ left: i * pista.current.clientWidth, behavior: "smooth" })

  return (
    <div className="prox">
      <div className="prox-pista" ref={pista}>
        <section className="prox-lamina" aria-label="Estudio IA">
          <span className="prox-sello">Próximamente</span>
          <OctoMark className="prox-octo" title="Estudio IA" />
          <h2>Estudio IA</h2>
          <p>Genera tus imágenes y compártelas con tus amigos. Trends de un toque y videos desde tu celular.</p>
          <div className="prox-fotos" aria-hidden>
            {fotos.slice(0, 6).map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={f + i} src={f} alt="" loading="lazy" decoding="async" />
            ))}
          </div>
        </section>
        <section className="prox-lamina" aria-label="Agentes IA">
          <span className="prox-sello">Próximamente</span>
          <div className="prox-agentes-ico" aria-hidden>🤖</div>
          <h2>Agentes IA</h2>
          <p>Ayudantes que trabajan para tu negocio todo el día.</p>
          <ul className="prox-agentes">
            {AGENTES.map(([e, t, d]) => (
              <li key={t}>
                <span aria-hidden>{e}</span>
                <div>
                  <b>{t}</b>
                  <small>{d}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="prox-puntos" role="tablist" aria-label="Láminas">
        {[0, 1].map((i) => (
          <button key={i} type="button" role="tab" aria-selected={actual === i} aria-label={i ? "Agentes IA" : "Estudio IA"} className={actual === i ? "on" : ""} onClick={() => ir(i)} />
        ))}
      </div>
      {actual === 0 ? <p className="prox-pista-texto">Desliza para ver lo otro que viene →</p> : null}
    </div>
  )
}

/** Sale una vez por visita cuando la persona empieza a bajar. */
export function ProximamenteEmergente({ fotos, instagram }: { fotos: string[]; instagram: string }) {
  const [abierta, setAbierta] = useState(false)
  useEffect(() => {
    let vista = false
    try {
      vista = sessionStorage.getItem("vs-proximamente") === "1"
    } catch {}
    if (vista) return
    const bajar = () => {
      if (window.scrollY < 260) return
      window.removeEventListener("scroll", bajar)
      setAbierta(true)
      try {
        sessionStorage.setItem("vs-proximamente", "1")
      } catch {}
    }
    window.addEventListener("scroll", bajar, { passive: true })
    return () => window.removeEventListener("scroll", bajar)
  }, [])
  useEffect(() => {
    if (!abierta) return
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(false)
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [abierta])
  if (!abierta) return null
  return (
    <div className="hoja-fondo" onClick={() => setAbierta(false)}>
      <div className="prox-ventana" role="dialog" aria-modal="true" aria-label="Próximamente" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="prox-cerrar" aria-label="Cerrar" onClick={() => setAbierta(false)}>
          ✕
        </button>
        <ProximamenteLaminas fotos={fotos} />
        <a className="boton vivo" href={`https://ig.me/m/${instagram}`} target="_blank" rel="noopener">
          Avísame cuando salga
        </a>
      </div>
    </div>
  )
}

/** Página completa de «Próximamente» para /estudio y /servicios mientras no estén abiertos. */
export function PaginaProximamente({ fotos, inicio = 0 }: { fotos: string[]; inicio?: 0 | 1 }) {
  return (
    <main className="prox-pagina">
      <div className="prox-ventana">
        <ProximamenteLaminas fotos={fotos} inicio={inicio} />
        <a className="prox-boton" href="https://ig.me/m/visionstudios.rd" target="_blank" rel="noopener">
          Avísame cuando salga
        </a>
        <p className="prox-volver">
          <Link href="/">← Volver a Vision Studios</Link>
          <Link href="/entrar?a=/admin">Equipo</Link>
        </p>
      </div>
    </main>
  )
}
