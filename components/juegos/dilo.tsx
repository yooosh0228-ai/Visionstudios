"use client"

import { useEffect, useRef, useState } from "react"

import { TARJETAS } from "@/lib/juegos/palabras"
import type { Tarjeta } from "@/lib/juegos/palabras"
import { barajar } from "@/lib/juegos/trivia"

/*
 * «Dilo sin decirlo»: dos equipos y un solo celular. Uno describe la palabra
 * sin decir las prohibidas; su equipo adivina. 60 segundos por turno.
 */

const TIEMPO = 60
const META = 15
const PASES = 3

type Fase = "equipos" | "listo" | "jugando" | "fin-turno" | "ganador"

export function Dilo() {
  const [equipos, setEquipos] = useState(["Los del Cibao", "Los de la Capital"])
  const [puntos, setPuntos] = useState([0, 0])
  const [turno, setTurno] = useState(0)
  const [fase, setFase] = useState<Fase>("equipos")
  const [mazo, setMazo] = useState<Tarjeta[]>([])
  const [carta, setCarta] = useState(0)
  const [fin, setFin] = useState(0)
  const [ahora, setAhora] = useState(() => Date.now())
  const [pases, setPases] = useState(PASES)
  const [historial, setHistorial] = useState<{ palabra: string; r: "ok" | "paso" | "falta" }[]>([])
  const zumbido = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (fase !== "jugando") return
    const t = setInterval(() => {
      const n = Date.now()
      setAhora(n)
      if (n >= fin) {
        pitar(220, 0.6)
        setFase("fin-turno")
      }
    }, 200)
    return () => clearInterval(t)
  }, [fase, fin])

  function pitar(hz: number, dur = 0.12) {
    try {
      zumbido.current ??= new AudioContext()
      const ctx = zumbido.current
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = hz
      g.gain.setValueAtTime(0.15, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      o.connect(g).connect(ctx.destination)
      o.start()
      o.stop(ctx.currentTime + dur)
    } catch {}
    try {
      navigator.vibrate?.(dur > 0.3 ? [200, 80, 200] : 30)
    } catch {}
  }

  function empezarTurno() {
    if (mazo.length - carta < 12) {
      setMazo(barajar(TARJETAS))
      setCarta(0)
    }
    setPases(PASES)
    setHistorial([])
    setFin(Date.now() + TIEMPO * 1000)
    setAhora(Date.now())
    setFase("jugando")
  }

  function marcar(r: "ok" | "paso" | "falta") {
    const t = mazo[carta]
    if (!t) return
    if (r === "paso") {
      if (pases <= 0) return
      setPases((p) => p - 1)
    }
    const delta = r === "ok" ? 1 : r === "falta" ? -1 : 0
    pitar(r === "ok" ? 880 : r === "falta" ? 160 : 440)
    const nuevos = puntos.map((p, i) => (i === turno ? Math.max(0, p + delta) : p))
    setPuntos(nuevos)
    setHistorial((h) => [...h, { palabra: t.palabra, r }])
    setCarta((c) => c + 1)
    if (nuevos[turno]! >= META) setFase("ganador")
  }

  function siguienteEquipo() {
    setTurno((t) => 1 - t)
    setFase("listo")
  }

  const quedan = Math.max(0, Math.ceil((fin - ahora) / 1000))
  const t = mazo[carta]

  if (fase === "equipos") {
    return (
      <div className="jg-tarjeta">
        <p className="jg-suave">Dos equipos, un celular. Gana el primero que llegue a {META}.</p>
        {equipos.map((e, i) => (
          <label className="jg-campo" key={i}>
            <span>Equipo {i + 1}</span>
            <input
              value={e}
              maxLength={22}
              onChange={(ev) => setEquipos((q) => q.map((x, j) => (j === i ? ev.target.value : x)))}
            />
          </label>
        ))}
        <ul className="jg-reglas">
          <li>Uno de tu equipo describe la palabra de arriba.</li>
          <li>No puede decir ninguna de las prohibidas, ni en inglés, ni con señas de letras.</li>
          <li>✅ La cogieron: +1 · 🚫 Dijo una prohibida: −1 · ⏭️ Pasar: 0 (máximo {PASES} por turno).</li>
          <li>El equipo contrario vigila la pantalla. ¡Sin trampa, tíguere!</li>
        </ul>
        <button
          className="jg-boton vivo"
          onClick={() => {
            setMazo(barajar(TARJETAS))
            setCarta(0)
            setPuntos([0, 0])
            setTurno(0)
            setFase("listo")
          }}
        >
          Empezar
        </button>
      </div>
    )
  }

  const marcador = (
    <div className="jg-marcador">
      {equipos.map((e, i) => (
        <div key={i} className={i === turno ? "activo" : ""}>
          <span>{e}</span>
          <b>{puntos[i]}</b>
        </div>
      ))}
    </div>
  )

  if (fase === "listo") {
    return (
      <div className="jg-tarjeta">
        {marcador}
        <h3 className="jg-titulo">Le toca a {equipos[turno]}</h3>
        <p className="jg-suave">Pásale el celular al que va a describir. Que su equipo no vea la pantalla.</p>
        <button className="jg-boton vivo grande" onClick={empezarTurno}>
          ¡Arranca! ({TIEMPO} s)
        </button>
      </div>
    )
  }

  if (fase === "fin-turno" || fase === "ganador") {
    const ganador = puntos[0]! >= META ? 0 : puntos[1]! >= META ? 1 : -1
    return (
      <div className="jg-tarjeta">
        {marcador}
        <h3 className="jg-titulo">{fase === "ganador" && ganador >= 0 ? `🏆 ¡Ganó ${equipos[ganador]}!` : "⏰ ¡Se acabó el tiempo!"}</h3>
        <ul className="jg-historial">
          {historial.map((h, i) => (
            <li key={i} className={h.r}>
              {h.r === "ok" ? "✅" : h.r === "falta" ? "🚫" : "⏭️"} {h.palabra}
            </li>
          ))}
        </ul>
        {fase === "ganador" ? (
          <button className="jg-boton vivo" onClick={() => setFase("equipos")}>Jugar otra vez</button>
        ) : (
          <button className="jg-boton vivo" onClick={siguienteEquipo}>Pasar a {equipos[1 - turno]}</button>
        )}
      </div>
    )
  }

  return (
    <div className="jg-tarjeta">
      {marcador}
      <div className="jg-cabeza">
        <span>{equipos[turno]}</span>
        <span className={`jg-reloj${quedan <= 10 ? " poco" : ""}`}>{quedan}</span>
      </div>
      {t ? (
        <div className="jg-carta">
          <p className="jg-palabra">{t.palabra}</p>
          <p className="jg-suave">No puedes decir:</p>
          <ul>
            {t.prohibidas.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="jg-acciones-dilo">
        <button className="jg-boton falta" onClick={() => marcar("falta")}>🚫 Dijo una</button>
        <button className="jg-boton" onClick={() => marcar("paso")} disabled={pases <= 0}>⏭️ Pasar ({pases})</button>
        <button className="jg-boton vivo" onClick={() => marcar("ok")}>✅ La cogieron</button>
      </div>
    </div>
  )
}
