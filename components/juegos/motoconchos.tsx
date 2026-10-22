"use client"
/* Juegos en tiempo real: el reloj y las referencias se leen a propósito durante el render. */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, react-hooks/purity */

import { useEffect, useRef, useState } from "react"

/*
 * Carrera de motoconchos: de 2 a 4 jugadores en la misma pantalla.
 * Cada quien toca su carril (o su tecla) para acelerar. Cuando el semáforo
 * de tu carril se pone en rojo, ¡quieto! Si aceleras en rojo te para el AMET.
 * Del Monumento al Parque Duarte.
 */

const META = 100
const PASO = 1.6
const TECLAS = ["a", "l", "q", "p"]
const PILOTOS = [
  { nombre: "El Menor", color: "#35B37E" },
  { nombre: "Chichí", color: "#3aa0ff" },
  { nombre: "Papo", color: "#D8A33C" },
  { nombre: "La Doña", color: "#e0577a" },
]
const EVENTOS = ["¡Hoyo en la calle!", "¡Tapón en la Estrella Sadhalá!", "¡Semáforo dañao!", "¡Guagua parada!"]

type Carril = { pos: number; rojo: number; multa: number; aviso: string }

export function Motoconchos() {
  const [n, setN] = useState(2)
  const [fase, setFase] = useState<"menu" | "cuenta" | "carrera" | "fin">("menu")
  const [cuenta, setCuenta] = useState(3)
  const [carriles, setCarriles] = useState<Carril[]>([])
  const [ganador, setGanador] = useState(-1)
  const ref = useRef<Carril[]>([])
  const fase_ = useRef(fase)
  fase_.current = fase

  function iniciar() {
    ref.current = Array.from({ length: n }, () => ({ pos: 0, rojo: 0, multa: 0, aviso: "" }))
    setCarriles(ref.current)
    setGanador(-1)
    setCuenta(3)
    setFase("cuenta")
  }

  useEffect(() => {
    if (fase !== "cuenta") return
    if (cuenta <= 0) {
      setFase("carrera")
      return
    }
    const t = setTimeout(() => setCuenta((c) => c - 1), 800)
    return () => clearTimeout(t)
  }, [fase, cuenta])

  // Semáforos y eventos al azar por carril.
  useEffect(() => {
    if (fase !== "carrera") return
    const t = setInterval(() => {
      const ahora = Date.now()
      ref.current = ref.current.map((c) => {
        if (c.rojo < ahora && Math.random() < 0.09) {
          return { ...c, rojo: ahora + 900 + Math.random() * 900, aviso: EVENTOS[Math.floor(Math.random() * EVENTOS.length)]! }
        }
        return c.rojo < ahora && c.multa < ahora ? { ...c, aviso: "" } : c
      })
      setCarriles(ref.current)
    }, 250)
    return () => clearInterval(t)
  }, [fase])

  function acelerar(i: number) {
    if (fase_.current !== "carrera") return
    const ahora = Date.now()
    const c = ref.current[i]
    if (!c || c.multa > ahora) return
    let sig: Carril
    if (c.rojo > ahora) {
      sig = { ...c, pos: Math.max(0, c.pos - 8), multa: ahora + 1200, rojo: 0, aviso: "🚨 ¡Te paró el AMET!" }
      try {
        navigator.vibrate?.([80, 40, 80])
      } catch {}
    } else {
      sig = { ...c, pos: Math.min(META, c.pos + PASO + Math.random() * 0.6) }
    }
    ref.current = ref.current.map((x, j) => (j === i ? sig : x))
    setCarriles(ref.current)
    if (sig.pos >= META) {
      setGanador(i)
      setFase("fin")
    }
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const i = TECLAS.indexOf(e.key.toLowerCase())
      if (i >= 0 && i < ref.current.length && !e.repeat) acelerar(i)
    }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [])

  if (fase === "menu") {
    return (
      <div className="jg-tarjeta">
        <p className="jg-suave">Del Monumento al Parque Duarte. Toca tu carril lo más rápido que puedas.</p>
        <div className="jg-segmentos" role="radiogroup" aria-label="Cantidad de jugadores">
          {[2, 3, 4].map((x) => (
            <button key={x} role="radio" aria-checked={n === x} className={n === x ? "activo" : ""} onClick={() => setN(x)}>
              {x} jugadores
            </button>
          ))}
        </div>
        <ul className="jg-reglas">
          <li>📱 En el celular: cada quien toca su carril. 💻 En la computadora: teclas {TECLAS.slice(0, n).map((t) => t.toUpperCase()).join(", ")}.</li>
          <li>🔴 Si tu carril se pone en rojo (hoyo, tapón, guagua parada…), ¡no toques!</li>
          <li>🚨 Si aceleras en rojo, te para el AMET: retrocedes y pierdes un segundo.</li>
        </ul>
        <button className="jg-boton vivo grande" onClick={iniciar}>¡Prende el motor!</button>
      </div>
    )
  }

  const ahora = Date.now()
  return (
    <div className="jg-pista-envoltura">
      {fase === "cuenta" ? <div className="jg-cuenta">{cuenta || "¡Dale!"}</div> : null}
      {fase === "fin" ? (
        <div className="jg-cuenta fin">
          <p>🏁 ¡{PILOTOS[ganador]?.nombre} llegó primero al Parque Duarte!</p>
          <div>
            <button className="jg-boton vivo" onClick={iniciar}>Otra carrera</button>
            <button className="jg-boton" onClick={() => setFase("menu")}>Cambiar jugadores</button>
          </div>
        </div>
      ) : null}
      <div className="jg-pista" style={{ gridTemplateRows: `repeat(${n},1fr)` }}>
        {carriles.map((c, i) => {
          const rojo = c.rojo > ahora
          const multado = c.multa > ahora
          return (
            <button
              key={i}
              className={`jg-carril${rojo ? " rojo" : ""}${multado ? " multa" : ""}`}
              style={{ ["--c" as string]: PILOTOS[i]!.color }}
              onPointerDown={(e) => {
                e.preventDefault()
                acelerar(i)
              }}
              aria-label={`Acelerar ${PILOTOS[i]!.nombre}`}
            >
              <span className="jg-piloto">
                {PILOTOS[i]!.nombre} <kbd>{TECLAS[i]!.toUpperCase()}</kbd>
              </span>
              <span className="jg-semaforo" aria-hidden>{rojo ? "🔴" : "🟢"}</span>
              {c.aviso ? <span className="jg-evento">{c.aviso}</span> : null}
              <span className="jg-meta" aria-hidden>🏁</span>
              <span className="jg-moto" style={{ left: `calc(${(c.pos / META) * 88}% )` }} aria-hidden>
                🛵
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
