"use client"
/* Juegos en tiempo real: el reloj y las referencias se leen a propósito durante el render. */
 

import { useEffect, useState } from "react"
import Link from "next/link"

import { Dilo } from "./dilo"
import { Motoconchos } from "./motoconchos"
import { Trivia } from "./trivia"

const JUEGOS = [
  {
    id: "trivia",
    emoji: "🧠",
    nombre: "¿Tú sabe' o tú no sabe'?",
    sub: "Trivia dominicana en línea · 1 a 8 jugadores, cada uno en su celular",
    C: Trivia,
  },
  {
    id: "dilo",
    emoji: "🗣️",
    nombre: "Dilo sin decirlo",
    sub: "Dos equipos, un celular · adivina la palabra sin decir las prohibidas",
    C: Dilo,
  },
  {
    id: "motoconchos",
    emoji: "🛵",
    nombre: "Carrera de motoconchos",
    sub: "2 a 4 jugadores en la misma pantalla · cuidado con el AMET",
    C: Motoconchos,
  },
] as const

export function Juegos() {
  const [actual, setActual] = useState<string>("trivia")
  useEffect(() => {
    const leer = () => {
      const h = location.hash.slice(1)
      if (JUEGOS.some((j) => j.id === h)) setActual(h)
    }
    leer()
    window.addEventListener("hashchange", leer)
    return () => window.removeEventListener("hashchange", leer)
  }, [])
  const j = JUEGOS.find((x) => x.id === actual)!
  return (
    <div className="jg">
      <header className="jg-barra">
        <Link href="/">← Vision Studios</Link>
        <span>Juegos</span>
      </header>
      <main className="jg-main">
        <h1>Juegos dominicanos</h1>
        <p className="jg-suave">Pa&apos; la junta, el colmado o la fila del banco. Gratis y sin descargar nada.</p>
        <nav className="jg-pestanas" aria-label="Juegos">
          {JUEGOS.map((x) => (
            <button
              key={x.id}
              className={x.id === actual ? "activo" : ""}
              aria-current={x.id === actual ? "page" : undefined}
              onClick={() => {
                setActual(x.id)
                history.replaceState(null, "", `#${x.id}`)
              }}
            >
              <span aria-hidden>{x.emoji}</span>
              {x.nombre}
            </button>
          ))}
        </nav>
        <section aria-labelledby="jg-nombre">
          <h2 id="jg-nombre">{j.emoji} {j.nombre}</h2>
          <p className="jg-suave">{j.sub}</p>
          <j.C key={j.id} />
        </section>
        <aside className="jg-promo">
          <p>
            <b>¿Tienes un negocio?</b> En Vision Studios hacemos videos promocionales,
            apps web y hasta la influencer de tu marca.
          </p>
          <Link href="/#servicios" className="jg-boton vivo">Ver servicios</Link>
        </aside>
      </main>
    </div>
  )
}
