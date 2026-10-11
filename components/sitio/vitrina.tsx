"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { TIPO_TRABAJO_LABEL } from "@/lib/vs/types"
import type { Trabajo, TipoTrabajo } from "@/lib/vs/types"

import { dispositivo, useSitio } from "./estado"
import { Icono, Ojo } from "./iconos"
import {
  PantallaEnVivo,
  RespaldoTurnos,
  Telefono,
  VideoVigilado,
} from "./medios"
import { Pedir } from "./pedir"

/** El dibujo de una pieza en la rejilla cuando no hay video. */
export function Lienzo({ t }: { t: Trabajo }) {
  if (t.lienzo === "estudio")
    return (
      <span className="lienzo estudio" aria-hidden="true">
        <span className="caja">
          <b>Describe lo que imaginas</b>Una foto del producto sobre mármol, luz
          de ventana…
        </span>
        <span className="generar">Generar</span>
        <span className="mini">
          <i />
          <i />
          <i />
        </span>
      </span>
    )
  if (t.lienzo === "web" && t.vivo)
    return (
      <span className="lienzo web" aria-hidden="true">
        <PantallaEnVivo src={t.vivo} titulo="" alto="llenar" />
      </span>
    )
  return (
    <span className="lienzo marca" aria-hidden="true">
      <Ojo />
    </span>
  )
}

function Sello({ t }: { t: Trabajo }) {
  if (t.video)
    return (
      <span className="sello">
        <Icono.play />
        Video
      </span>
    )
  if (t.tipo === "marca")
    return (
      <span className="sello">
        <Icono.marca />
        Marca
      </span>
    )
  return (
    <span className="sello">
      <Icono.app />
      {t.vivo ? "En vivo" : "App"}
    </span>
  )
}

export function Cartela({
  t,
  como = "p",
}: {
  t: Trabajo
  como?: "p" | "figcaption"
}) {
  const Tag = como
  return (
    <Tag className="cartela">
      <span className="quien">{t.cliente}</span>
      <span className="que">{t.obra}</span>
      <span className="donde">{t.donde}</span>
    </Tag>
  )
}

function Obra({ t }: { t: Trabajo }) {
  const abrir = useSitio((s) => s.abrirFicha)
  const [fallo, setFallo] = useState(false)
  return (
    <figure className="obra" data-tipo={t.tipo}>
      <button
        className="abrir"
        type="button"
        aria-label={`${t.obra}, ${t.cliente}. Ver detalle`}
        onClick={() => abrir(t.id)}
      >
        {t.video && !fallo ? (
          <>
            <span className="espera" aria-hidden="true">
              <Ojo />
            </span>
            <VideoVigilado
              fuente={t.video}
              poster={t.poster}
              aria-hidden="true"
              onFallo={() => setFallo(true)}
            />
          </>
        ) : (
          <Lienzo t={t} />
        )}
        <Sello t={t} />
      </button>
      <Cartela t={t} como="figcaption" />
    </figure>
  )
}

type PantallaLista = {
  etiqueta: string
  leyenda: string
  vivo: boolean
  pieza: Trabajo | null
}

/** El primer lugar del catálogo: un teléfono con la app real y sus videos. */
function Destacado({ t, todos }: { t: Trabajo; todos: Trabajo[] }) {
  const abrir = useSitio((s) => s.abrirFicha)
  const pantallas = useMemo<PantallaLista[]>(() => {
    const base = t.pantallas.length
      ? t.pantallas
      : [{ etiqueta: "La app", vivo: true }]
    return base
      .map((p) => ({
        etiqueta: p.etiqueta,
        leyenda: p.leyenda ?? "",
        vivo: !!p.vivo,
        pieza: p.ver
          ? (todos.find((x) => x.id === p.ver && x.video) ?? null)
          : null,
      }))
      .filter((p) => (p.vivo ? !!t.vivo : !!p.pieza))
  }, [t, todos])
  const [activa, setActiva] = useState(0)
  const [conSonido, setConSonido] = useState(false)
  const [enVista, setEnVista] = useState(false)
  const telefono = useRef<HTMLDivElement>(null)
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const botones = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const el = telefono.current
    if (!el || !("IntersectionObserver" in window)) {
      const id = requestAnimationFrame(() => setEnVista(true))
      return () => cancelAnimationFrame(id)
    }
    const io = new IntersectionObserver(
      ([e]) => setEnVista(!!e?.isIntersecting),
      { threshold: 0.35 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const { quieto, ahorro } = dispositivo()
    videos.current.forEach((v, i) => {
      if (!v) return
      if (i === activa && enVista && ((!quieto && !ahorro) || conSonido)) {
        if (v.preload !== "auto") {
          v.preload = "auto"
          v.load()
        }
        v.muted = !conSonido
        v.play().catch(() => {})
      } else if (!v.paused) v.pause()
    })
  }, [activa, enVista, conSonido])

  const elegir = (i: number, foco = false) => {
    setActiva(i)
    const v = videos.current[i]
    if (v) v.currentTime = 0
    if (foco) botones.current[i]?.focus()
  }
  const hayVideo = !!pantallas[activa]?.pieza

  return (
    <article className="destacado" data-tipo={t.tipo}>
      <div className="escena">
        {t.fondo ? (
          <VideoVigilado
            className="fondo"
            fuente={t.fondo}
            aria-hidden="true"
          />
        ) : null}
        <div className="pantallas">
          {pantallas.length > 1 ? (
            <div
              className="selector"
              role="tablist"
              aria-label={`Qué ver de ${t.cliente}`}
            >
              {pantallas.map((p, i) => (
                <button
                  key={p.etiqueta}
                  ref={(el) => {
                    botones.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`pestana-${i}`}
                  aria-selected={i === activa}
                  aria-controls={`capa-${i}`}
                  tabIndex={i === activa ? 0 : -1}
                  onClick={() => elegir(i)}
                  onKeyDown={(e) => {
                    const paso =
                      e.key === "ArrowRight"
                        ? 1
                        : e.key === "ArrowLeft"
                          ? -1
                          : 0
                    if (!paso) return
                    e.preventDefault()
                    elegir(
                      (i + paso + pantallas.length) % pantallas.length,
                      true
                    )
                  }}
                >
                  {p.vivo ? (
                    <i className="punto-vivo" aria-hidden="true" />
                  ) : null}
                  {p.etiqueta}
                  {p.vivo ? (
                    <span className="oculto-visual"> (en vivo)</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
          <div ref={telefono}>
            <Telefono
              extra={
                hayVideo ? (
                  <button
                    className="sonido"
                    type="button"
                    aria-label={conSonido ? "Quitar sonido" : "Activar sonido"}
                    aria-pressed={conSonido}
                    onClick={() => setConSonido((x) => !x)}
                  >
                    {conSonido ? <Icono.sonidoSi /> : <Icono.sonidoNo />}
                  </button>
                ) : null
              }
            >
              {pantallas.map((p, i) => (
                <div
                  key={p.etiqueta}
                  id={`capa-${i}`}
                  role="tabpanel"
                  aria-labelledby={
                    pantallas.length > 1 ? `pestana-${i}` : undefined
                  }
                  aria-label={pantallas.length > 1 ? undefined : p.etiqueta}
                  className={`capa${i === activa ? "activa" : ""}`}
                >
                  {p.vivo && t.vivo ? (
                    <>
                      <RespaldoTurnos cliente={t.cliente} />
                      <PantallaEnVivo
                        src={t.vivo}
                        titulo={`Vista en vivo de ${t.cliente}`}
                      />
                    </>
                  ) : p.pieza?.video ? (
                    <video
                      ref={(el) => {
                        videos.current[i] = el
                      }}
                      muted
                      playsInline
                      loop
                      preload="none"
                      poster={p.pieza.poster ?? undefined}
                      aria-label={p.pieza.obra}
                    >
                      {[p.pieza.video.local, p.pieza.video.remoto]
                        .filter((x): x is string => !!x)
                        .map((src) => (
                          <source key={src} src={src} type="video/mp4" />
                        ))}
                    </video>
                  ) : null}
                </div>
              ))}
            </Telefono>
          </div>
          <p className="leyenda-pantalla" aria-live="polite">
            {pantallas[activa]?.leyenda ?? ""}
          </p>
        </div>
      </div>
      <div className="texto">
        <Cartela t={t} />
        <h3>{t.titulo ?? t.obra}</h3>
        <p className="resumen">{t.resumen}</p>
        {t.cifras.length ? (
          <div className="cifras">
            {t.cifras.map(([a, b]) => (
              <div key={a + b}>
                <b>{a}</b>
                <span>{b}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="acciones">
          <button
            className="boton claro"
            type="button"
            onClick={() => abrir(t.id)}
          >
            Ver qué hicimos
          </button>
          {t.vivo ? (
            <a className="enlace" href={t.vivo} target="_blank" rel="noopener">
              Abrir la app real
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/** La vitrina: filtros, la pieza destacada y la rejilla del catálogo. */
export function Vitrina({
  trabajos,
  espacioLibre,
}: {
  trabajos: Trabajo[]
  espacioLibre: { titulo: string; texto: string }
}) {
  const [filtro, setFiltro] = useState<"todo" | TipoTrabajo>("todo")
  const destacado = trabajos.find((t) => t.destacado)
  const cuenta = (k: "todo" | TipoTrabajo) =>
    trabajos.filter((t) => (k === "todo" ? !t.enDestacado : t.tipo === k))
      .length
  const claves = (
    ["todo", ...(Object.keys(TIPO_TRABAJO_LABEL) as TipoTrabajo[])] as const
  ).filter((k) => k === "todo" || cuenta(k) > 0)
  const lista = trabajos.filter(
    (t) =>
      !t.destacado && (filtro === "todo" ? !t.enDestacado : t.tipo === filtro)
  )
  const verDestacado =
    !!destacado && (filtro === "todo" || destacado.tipo === filtro)

  return (
    <>
      <div className="filtros" role="toolbar" aria-label="Filtrar el trabajo">
        {claves.map((k) => (
          <button
            key={k}
            className="filtro"
            type="button"
            aria-pressed={filtro === k}
            onClick={() => setFiltro(k)}
          >
            {k === "todo" ? "Todo" : TIPO_TRABAJO_LABEL[k]}
            <span className="n">{cuenta(k)}</span>
          </button>
        ))}
      </div>
      {verDestacado && destacado ? (
        <Destacado t={destacado} todos={trabajos} />
      ) : null}
      <div className="rejilla">
        {lista.map((t) => (
          <Obra key={t.id} t={t} />
        ))}
        {filtro === "todo" ? (
          <figure className="obra">
            <Pedir
              className="abrir"
              aria-label={`${espacioLibre.titulo} Cuéntanos tu negocio`}
            >
              <span className="lienzo vacio">
                <span className="mas">
                  <Icono.mas />
                </span>
                <b>{espacioLibre.titulo}</b>
                <span>{espacioLibre.texto}</span>
              </span>
            </Pedir>
          </figure>
        ) : null}
        {lista.length === 0 && filtro !== "todo" ? (
          <p className="sin-resultados">
            Todavía no hay trabajos en esta categoría.
          </p>
        ) : null}
      </div>
    </>
  )
}
