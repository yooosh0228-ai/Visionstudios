"use client"
/* Juegos en tiempo real: el reloj y las referencias se leen a propósito durante el render. */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, react-hooks/purity */

import { useEffect, useRef, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"

import { barajar, PREGUNTAS } from "@/lib/juegos/trivia"
import type { Pregunta } from "@/lib/juegos/trivia"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

/*
 * «¿Tú sabe' o tú no sabe'?» — trivia en línea.
 * El que crea la sala es el que manda: guarda el estado y lo reparte por un
 * canal de Supabase Realtime. Los demás solo mandan su respuesta.
 */

const RONDAS = 10
const SEGUNDOS = 15
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ"

type Jugador = { id: string; nombre: string; puntos: number; racha: number }
type Fase = "sala" | "pregunta" | "resultado" | "final"
type Estado = {
  fase: Fase
  ronda: number
  pregunta: Pregunta | null
  hasta: number
  jugadores: Jugador[]
  respondieron: string[]
  ultimas: Record<string, { op: number; ganados: number }>
}

const vacio: Estado = { fase: "sala", ronda: 0, pregunta: null, hasta: 0, jugadores: [], respondieron: [], ultimas: {} }
const COLORES = ["#35B37E", "#3aa0ff", "#D8A33C", "#e0577a"]

function nuevoCodigo() {
  return Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join("")
}

export function Trivia() {
  const [yo] = useState(() => Math.random().toString(36).slice(2, 10))
  const [nombre, setNombre] = useState("")
  const [codigo, setCodigo] = useState("")
  const [soyAnfitrion, setSoyAnfitrion] = useState(false)
  const [estado, setEstado] = useState<Estado>(vacio)
  const [mia, setMia] = useState<number | null>(null)
  const [aviso, setAviso] = useState("")
  const [ahora, setAhora] = useState(() => Date.now())
  const canal = useRef<RealtimeChannel | null>(null)
  const est = useRef(estado)
  const preguntas = useRef<Pregunta[]>([])
  est.current = estado

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    try {
      const n = localStorage.getItem("vs-juego-nombre")
      if (n) setNombre(n)
    } catch {}
    return () => {
      canal.current?.unsubscribe()
    }
  }, [])

  function repartir(e: Estado) {
    setEstado(e)
    canal.current?.send({ type: "broadcast", event: "estado", payload: e })
  }

  function entrar(cod: string, anfitrion: boolean) {
    const n = nombre.trim().slice(0, 16)
    if (!n) return setAviso("Ponte un nombre primero.")
    try {
      localStorage.setItem("vs-juego-nombre", n)
    } catch {}
    setAviso("")
    const sb = createSupabaseBrowser()
    const c = sb.channel(`vs-trivia-${cod}`, { config: { broadcast: { self: false }, presence: { key: yo } } })
    c.on("broadcast", { event: "estado" }, ({ payload }) => {
      if (!anfitrion) setEstado(payload as Estado)
    })
    c.on("broadcast", { event: "hola" }, ({ payload }) => {
      if (!anfitrion) return
      const p = payload as { id: string; nombre: string }
      const e = est.current
      if (e.jugadores.some((j) => j.id === p.id)) return repartir(e)
      if (e.fase !== "sala") return repartir(e)
      if (e.jugadores.length >= 8) return
      repartir({ ...e, jugadores: [...e.jugadores, { id: p.id, nombre: p.nombre, puntos: 0, racha: 0 }] })
    })
    c.on("broadcast", { event: "respuesta" }, ({ payload }) => {
      if (anfitrion) recibir(payload as { id: string; op: number })
    })
    c.subscribe((s) => {
      if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
        setAviso("No pudimos conectar la sala. Revisa tu internet y vuelve a intentarlo.")
        return
      }
      if (s !== "SUBSCRIBED") return
      if (anfitrion) {
        repartir({ ...vacio, jugadores: [{ id: yo, nombre: n, puntos: 0, racha: 0 }] })
      } else {
        c.send({ type: "broadcast", event: "hola", payload: { id: yo, nombre: n } })
        setTimeout(() => {
          if (!est.current.jugadores.length) setAviso("No encontramos esa sala. Revisa el código con quien la creó.")
        }, 4000)
      }
    })
    canal.current = c
    setCodigo(cod)
    setSoyAnfitrion(anfitrion)
  }

  function recibir({ id, op }: { id: string; op: number }) {
    const e = est.current
    if (e.fase !== "pregunta" || !e.pregunta || e.respondieron.includes(id)) return
    const restante = Math.max(0, e.hasta - Date.now())
    const bien = op === e.pregunta.ok
    const jugadores = e.jugadores.map((j) => {
      if (j.id !== id) return j
      const racha = bien ? j.racha + 1 : 0
      const ganados = bien ? 500 + Math.round((restante / (SEGUNDOS * 1000)) * 500) + (racha >= 3 ? 200 : 0) : 0
      return { ...j, puntos: j.puntos + ganados, racha }
    })
    const ganados = (jugadores.find((j) => j.id === id)?.puntos ?? 0) - (e.jugadores.find((j) => j.id === id)?.puntos ?? 0)
    const sig = { ...e, jugadores, respondieron: [...e.respondieron, id], ultimas: { ...e.ultimas, [id]: { op, ganados } } }
    if (sig.respondieron.length >= sig.jugadores.length) repartir({ ...sig, fase: "resultado", hasta: Date.now() + 5000 })
    else repartir(sig)
  }

  function arrancar() {
    preguntas.current = barajar(PREGUNTAS, RONDAS)
    const e = est.current
    repartir({
      ...e,
      fase: "pregunta",
      ronda: 1,
      pregunta: preguntas.current[0]!,
      hasta: Date.now() + SEGUNDOS * 1000,
      respondieron: [],
      ultimas: {},
      jugadores: e.jugadores.map((j) => ({ ...j, puntos: 0, racha: 0 })),
    })
    setMia(null)
  }

  // El anfitrión mueve el reloj.
  useEffect(() => {
    if (!soyAnfitrion) return
    const e = estado
    if (e.fase === "pregunta" && ahora >= e.hasta) repartir({ ...e, fase: "resultado", hasta: Date.now() + 5000 })
    else if (e.fase === "resultado" && ahora >= e.hasta) {
      if (e.ronda >= RONDAS) repartir({ ...e, fase: "final" })
      else
        repartir({
          ...e,
          fase: "pregunta",
          ronda: e.ronda + 1,
          pregunta: preguntas.current[e.ronda]!,
          hasta: Date.now() + SEGUNDOS * 1000,
          respondieron: [],
          ultimas: {},
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ahora, soyAnfitrion])

  useEffect(() => {
    if (estado.fase === "pregunta") setMia(null)
  }, [estado.ronda, estado.fase])

  function responder(op: number) {
    if (mia !== null || estado.fase !== "pregunta") return
    setMia(op)
    if (soyAnfitrion) recibir({ id: yo, op })
    else canal.current?.send({ type: "broadcast", event: "respuesta", payload: { id: yo, op } })
  }

  function salir() {
    canal.current?.unsubscribe()
    canal.current = null
    setCodigo("")
    setEstado(vacio)
    setSoyAnfitrion(false)
  }

  const tabla = [...estado.jugadores].sort((a, b) => b.puntos - a.puntos)
  const segundos = Math.max(0, Math.ceil((estado.hasta - ahora) / 1000))

  if (!codigo) {
    return (
      <div className="jg-tarjeta jg-entrada">
        <label className="jg-campo">
          <span>Tu nombre</span>
          <input value={nombre} maxLength={16} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Yosh" autoComplete="nickname" />
        </label>
        <button className="jg-boton vivo" onClick={() => entrar(nuevoCodigo(), true)}>
          Crear sala
        </button>
        <div className="jg-o">o únete con un código</div>
        <form
          className="jg-unirse"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            const c = String(f.get("codigo") || "").toUpperCase().replace(/[^A-Z]/g, "")
            if (c.length === 4) entrar(c, false)
            else setAviso("El código tiene 4 letras.")
          }}
        >
          <input name="codigo" maxLength={4} placeholder="ABCD" aria-label="Código de la sala" autoCapitalize="characters" />
          <button className="jg-boton">Entrar</button>
        </form>
        {aviso ? <p className="jg-aviso" role="alert">{aviso}</p> : null}
      </div>
    )
  }

  if (estado.fase === "sala") {
    return (
      <div className="jg-tarjeta">
        <p className="jg-suave">Código de la sala</p>
        <p className="jg-codigo">{codigo}</p>
        <p className="jg-suave">Mándale este código a tus panas. Entran desde 402visionstudios.com/juegos.</p>
        <ul className="jg-jugadores">
          {estado.jugadores.map((j, i) => (
            <li key={j.id} style={{ borderColor: COLORES[i % 4] }}>
              {j.nombre}
              {j.id === yo ? " (tú)" : ""}
            </li>
          ))}
        </ul>
        {aviso ? <p className="jg-aviso">{aviso}</p> : null}
        {soyAnfitrion ? (
          <button className="jg-boton vivo" onClick={arrancar} disabled={estado.jugadores.length < 1}>
            {estado.jugadores.length < 2 ? "Arrancar solo (o espera a los demás)" : `¡Dale! Arrancar con ${estado.jugadores.length}`}
          </button>
        ) : (
          <p className="jg-esperando">Esperando que {estado.jugadores[0]?.nombre ?? "el anfitrión"} arranque…</p>
        )}
        <button className="jg-enlace" onClick={salir}>Salir</button>
      </div>
    )
  }

  if (estado.fase === "final") {
    const [p1, p2, p3] = tabla
    return (
      <div className="jg-tarjeta">
        <p className="jg-suave">Se acabó</p>
        <h3 className="jg-titulo">🏆 {p1?.nombre} es el más tíguere</h3>
        <ol className="jg-podio">
          {[p2, p1, p3].map((j, i) =>
            j ? (
              <li key={j.id} className={`puesto-${[2, 1, 3][i]}`}>
                <b>{j.nombre}</b>
                <span>{j.puntos.toLocaleString("es-DO")}</span>
              </li>
            ) : null
          )}
        </ol>
        {soyAnfitrion ? (
          <button className="jg-boton vivo" onClick={arrancar}>Otra ronda</button>
        ) : (
          <p className="jg-esperando">Si el anfitrión quiere, arrancan otra.</p>
        )}
        <button className="jg-enlace" onClick={salir}>Salir</button>
      </div>
    )
  }

  const p = estado.pregunta!
  const revelar = estado.fase === "resultado"
  return (
    <div className="jg-tarjeta">
      <div className="jg-cabeza">
        <span>
          Pregunta {estado.ronda}/{RONDAS} · {p.tema}
        </span>
        {!revelar ? <span className={`jg-reloj${segundos <= 5 ? " poco" : ""}`}>{segundos}</span> : null}
      </div>
      {!revelar ? (
        <div className="jg-barra-tiempo" style={{ transform: `scaleX(${Math.max(0, (estado.hasta - ahora) / (SEGUNDOS * 1000))})` }} />
      ) : null}
      <h3 className="jg-pregunta">{p.q}</h3>
      <div className="jg-opciones">
        {p.ops.map((o, i) => {
          const cls = revelar ? (i === p.ok ? "bien" : mia === i ? "mal" : "apagada") : mia === i ? "elegida" : ""
          return (
            <button key={o} className={`jg-op ${cls}`} style={{ ["--c" as string]: COLORES[i] }} onClick={() => responder(i)} disabled={revelar || mia !== null}>
              <i>{"ABCD"[i]}</i>
              {o}
            </button>
          )
        })}
      </div>
      {revelar ? (
        <>
          <p className="jg-dato">💡 {p.dato}</p>
          <ol className="jg-tabla">
            {tabla.map((j) => (
              <li key={j.id}>
                <span>
                  {j.nombre}
                  {j.racha >= 3 ? " 🔥" : ""}
                </span>
                <b>
                  {estado.ultimas[j.id]?.ganados ? <em>+{estado.ultimas[j.id]!.ganados}</em> : null}
                  {j.puntos.toLocaleString("es-DO")}
                </b>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="jg-suave">
          {mia !== null ? "Respuesta enviada. " : ""}
          {estado.respondieron.length}/{estado.jugadores.length} respondieron
        </p>
      )}
    </div>
  )
}
