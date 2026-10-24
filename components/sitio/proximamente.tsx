"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { OctoMark } from "@/components/studio/octo-mark"
import { suscribir } from "@/lib/vs/acciones-publicas"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

import "./proximamente.css"

const AGENTES = [
  ["💬", "Asistente de WhatsApp", "Contesta precios, horarios y pedidos por ti, a cualquier hora."],
  ["📅", "Mes de contenido", "Te arma el calendario y los textos de tus redes del mes."],
  ["📄", "CV y documentos", "Currículum, cartas y cotizaciones listas en minutos."],
] as const

const JUEGOS = [
  ["🧠", "¿Tú sabe' o tú no sabe'?", "Trivia dominicana en línea con tus panas."],
  ["🗣️", "Dilo sin decirlo", "Adivina la palabra sin decir las prohibidas."],
  ["🛵", "Carrera de motoconchos", "Del Monumento al Parque Duarte. ¡Cuidao con el AMET!"],
] as const

/** Las láminas de «Próximamente»: Estudio IA y Agentes IA, que se deslizan. */
export function ProximamenteLaminas({ fotos, inicio = 0 }: { fotos: string[]; inicio?: 0 | 1 | 2 }) {
  const pista = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(0)

  useEffect(() => {
    const el = pista.current
    if (!el) return
    if (inicio) el.scrollLeft = el.clientWidth * inicio
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
        <section className="prox-lamina" aria-label="Juegos dominicanos">
          <span className="prox-sello">Próximamente</span>
          <div className="prox-agentes-ico" aria-hidden>🎲</div>
          <h2>Juegos dominicanos</h2>
          <p>Pa&apos; la junta, el colmado o la fila del banco. Gratis, desde el celular.</p>
          <ul className="prox-agentes">
            {JUEGOS.map(([e, t, d]) => (
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
        {[0, 1, 2].map((i) => (
          <button key={i} type="button" role="tab" aria-selected={actual === i} aria-label={["Estudio IA", "Agentes IA", "Juegos"][i]} className={actual === i ? "on" : ""} onClick={() => ir(i)} />
        ))}
      </div>
      {actual < 2 ? <p className="prox-pista-texto">Desliza para ver todo lo que viene →</p> : null}
    </div>
  )
}

/**
 * «Avísame cuando salga»: guarda el correo en la lista de espera y, con el
 * mismo correo, le crea su cuenta (enlace mágico). Google va de segundo.
 */
export function Avisame({ fuente = "proximamente" }: { fuente?: string }) {
  const [abierto, setAbierto] = useState(false)
  const [estado, setEstado] = useState<"" | "enviando" | "listo">("")
  const [error, setError] = useState("")

  function marcarDestino() {
    document.cookie = `vs_next=${encodeURIComponent("/cuenta")}; path=/; max-age=900; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("email") || "").trim().toLowerCase()
    setError("")
    setEstado("enviando")
    const r = await suscribir(fd)
    if (!r.ok) {
      setEstado("")
      setError(r.mensaje)
      return
    }
    try {
      marcarDestino()
      await createSupabaseBrowser().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback`, shouldCreateUser: true },
      })
    } catch {}
    setEstado("listo")
  }

  async function google() {
    marcarDestino()
    await createSupabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  if (!abierto)
    return (
      <button type="button" className="prox-boton" onClick={() => setAbierto(true)}>
        Avísame cuando salga
      </button>
    )
  if (estado === "listo")
    return (
      <div className="prox-listo" role="status">
        <b>¡Listo! Estás en la lista.</b>
        <span>Te escribimos cuando salga. Revisa tu correo: te mandamos un enlace para entrar a tu cuenta.</span>
      </div>
    )
  return (
    <form className="prox-form" onSubmit={enviar}>
      <label htmlFor="prox-email">Tu correo</label>
      <input id="prox-email" name="email" type="email" required autoComplete="email" placeholder="tucorreo@gmail.com" autoFocus />
      <input type="hidden" name="fuente" value={fuente} />
      <input type="text" name="sitio-web" tabIndex={-1} autoComplete="off" className="prox-trampa" aria-hidden />
      {error ? <p className="prox-error" role="alert">{error}</p> : null}
      <button className="prox-boton" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Guardando…" : "Avísame y crea mi cuenta"}
      </button>
      <div className="prox-o">o</div>
      <button type="button" className="prox-google" onClick={google}>
        <svg viewBox="0 0 24 24" aria-hidden width="18" height="18"><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10l3.7-2.9Z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4Z"/></svg>
        Continuar con Google
      </button>
      <p className="prox-letra">Solo te escribimos cuando haya algo nuevo. Puedes salirte cuando quieras.</p>
    </form>
  )
}

/** Sale una vez por visita cuando la persona empieza a bajar. */
export function ProximamenteEmergente({ fotos }: { fotos: string[]; instagram?: string }) {
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
        <Avisame fuente="portada" />
      </div>
    </div>
  )
}

/** Página completa de «Próximamente» para /estudio y /servicios mientras no estén abiertos. */
export function PaginaProximamente({ fotos, inicio = 0 }: { fotos: string[]; inicio?: 0 | 1 | 2 }) {
  return (
    <main className="prox-pagina">
      <div className="prox-ventana">
        <ProximamenteLaminas fotos={fotos} inicio={inicio} />
        <Avisame fuente="pagina" />
        <p className="prox-volver">
          <Link href="/">← Volver a Vision Studios</Link>
          <Link href="/entrar?a=/admin">Equipo</Link>
        </p>
      </div>
    </main>
  )
}
