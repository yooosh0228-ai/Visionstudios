"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import type { ReactNode, VideoHTMLAttributes } from "react"

import { dispositivo } from "./estado"

export type Fuente = { local: string | null; remoto: string | null } | null

function fuentes(f: Fuente) {
  return [f?.local, f?.remoto].filter((x): x is string => !!x)
}

/**
 * Video que solo carga y corre cuando está en pantalla, y nunca solo si la
 * persona pidió menos movimiento o ahorro de datos. Prueba primero el archivo
 * del sitio y después el enlace de respaldo; si ninguno carga, avisa con onFallo.
 */
export const VideoVigilado = forwardRef<
  HTMLVideoElement,
  {
    fuente: Fuente
    poster?: string | null
    activo?: boolean
    onFallo?: () => void
    onCorriendo?: () => void
  } & Omit<VideoHTMLAttributes<HTMLVideoElement>, "src" | "poster">
>(function VideoVigilado(
  { fuente, poster, activo = true, onFallo, onCorriendo, ...rest },
  ref
) {
  const video = useRef<HTMLVideoElement>(null)
  useImperativeHandle(ref, () => video.current as HTMLVideoElement)
  const [enVista, setEnVista] = useState(false)
  const lista = fuentes(fuente)

  useEffect(() => {
    const v = video.current
    if (!v) return
    if (!("IntersectionObserver" in window)) {
      const id = requestAnimationFrame(() => setEnVista(true))
      return () => cancelAnimationFrame(id)
    }
    const io = new IntersectionObserver(
      ([e]) => setEnVista(!!e?.isIntersecting),
      {
        rootMargin: "200px 0px",
        threshold: 0.15,
      }
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const v = video.current
    if (!v) return
    const { quieto, ahorro } = dispositivo()
    if (enVista && activo) {
      if (v.preload !== "auto") {
        v.preload = "auto"
        v.load()
      }
      if (!quieto && !ahorro) v.play().catch(() => {})
    } else if (!v.paused) v.pause()
  }, [enVista, activo])

  return (
    <video
      ref={video}
      muted
      playsInline
      loop
      preload="none"
      poster={poster ?? undefined}
      onPlaying={onCorriendo}
      {...rest}
    >
      {lista.map((src, i) => (
        <source
          key={src}
          src={src}
          type="video/mp4"
          onError={i === lista.length - 1 ? onFallo : undefined}
        />
      ))}
    </video>
  )
})

/**
 * Una página real dibujada a tamaño de iPhone (390 px) y escalada al marco.
 * Se carga solo al acercarse a la pantalla y nunca con ahorro de datos.
 */
export function PantallaEnVivo({
  src,
  titulo,
  alto = 844,
  inmediata = false,
}: {
  src: string
  titulo: string
  alto?: number | "llenar"
  inmediata?: boolean
}) {
  const caja = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(0.65)
  const [altoReal, setAltoReal] = useState(
    typeof alto === "number" ? alto : 694
  )
  const [cargar, setCargar] = useState(inmediata)
  const [lista, setLista] = useState(false)

  useEffect(() => {
    const el = caja.current
    if (!el) return
    const medir = () => {
      const k = el.clientWidth / 390
      if (k > 0) {
        setEscala(k)
        if (alto === "llenar") setAltoReal(el.clientHeight / k)
      }
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [alto])

  useEffect(() => {
    if (inmediata || dispositivo().ahorro) return
    const el = caja.current
    if (!el || !("IntersectionObserver" in window)) {
      const id = requestAnimationFrame(() => setCargar(true))
      return () => cancelAnimationFrame(id)
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setCargar(true)
          io.disconnect()
        }
      },
      { rootMargin: "300px 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inmediata])

  return (
    <div
      ref={caja}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {cargar ? (
        <iframe
          src={src}
          title={titulo}
          tabIndex={-1}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setLista(true)}
          className={lista ? "cargado" : undefined}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 390,
            maxWidth: "none",
            height: altoReal,
            border: 0,
            transformOrigin: "0 0",
            transform: `scale(${escala})`,
            pointerEvents: "none",
            opacity: lista ? 1 : 0,
            transition: "opacity .5s",
          }}
        />
      ) : null}
    </div>
  )
}

/** Marco de iPhone con su isla. */
export function Telefono({
  children,
  extra,
}: {
  children: ReactNode
  extra?: ReactNode
}) {
  return (
    <div className="telefono">
      <div className="pantalla">{children}</div>
      <span className="isla" aria-hidden="true" />
      {extra}
    </div>
  )
}

/** Lo que se ve dentro del teléfono mientras la app real carga (o si no carga). */
export function RespaldoTurnos({ cliente }: { cliente: string }) {
  return (
    <div className="respaldo" aria-hidden="true">
      <span className="t2">Sábado · Turnos</span>
      <span className="t1">{cliente}</span>
      <span className="hora">
        <span>9:00</span>
        <span>Ocupado</span>
      </span>
      <span className="hora libre">
        <span>9:30</span>
        <span>Libre</span>
      </span>
      <span className="hora libre">
        <span>10:00</span>
        <span>Libre</span>
      </span>
      <span className="hora">
        <span>12:00</span>
        <span>Almuerzo</span>
      </span>
      <span className="wa">Apartar por WhatsApp</span>
    </div>
  )
}
