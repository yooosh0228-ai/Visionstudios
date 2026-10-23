"use client"

import { useEffect, useRef } from "react"

import type { Trabajo } from "@/lib/vs/types"

import { useSitio } from "./estado"
import { Icono } from "./iconos"
import { PantallaEnVivo, RespaldoTurnos, Telefono } from "./medios"
import { Pedir } from "./pedir"
import { Cartela, Lienzo } from "./vitrina"

/**
 * La ficha de cada trabajo: hoja que sube desde abajo en el teléfono y ventana
 * en la computadora. Cada una tiene su enlace (402visionstudios.com/#codigo).
 */
export function Ficha({ trabajos }: { trabajos: Trabajo[] }) {
  const id = useSitio((s) => s.ficha)
  const abrir = useSitio((s) => s.abrirFicha)
  const cerrar = useSitio((s) => s.cerrarFicha)
  const dialogo = useRef<HTMLDialogElement>(null)
  const cerrarBoton = useRef<HTMLButtonElement>(null)
  const ultimoFoco = useRef<HTMLElement | null>(null)
  const t = id ? trabajos.find((x) => x.id === id) : undefined

  // Un enlace directo a un trabajo abre su ficha al llegar.
  useEffect(() => {
    const desdeHash = decodeURIComponent(location.hash.slice(1))
    if (desdeHash && trabajos.some((x) => x.id === desdeHash)) abrir(desdeHash)
  }, [trabajos, abrir])

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (t && !d.open) {
      ultimoFoco.current = document.activeElement as HTMLElement | null
      if (typeof d.showModal === "function") d.showModal()
      else d.setAttribute("open", "")
      cerrarBoton.current?.focus()
      history.replaceState(null, "", `#${t.id}`)
    } else if (!t && d.open) {
      d.querySelectorAll("video").forEach((v) => v.pause())
      d.close()
    }
  }, [t])

  return (
    <dialog
      ref={dialogo}
      className="ficha"
      aria-labelledby="ficha-titulo"
      onClose={() => {
        cerrar()
        if (location.hash && trabajos.some((x) => `#${x.id}` === location.hash))
          history.replaceState(null, "", "#trabajo")
        ultimoFoco.current?.focus({ preventScroll: true })
      }}
      onClick={(e) => {
        if (e.target === dialogo.current) cerrar()
      }}
    >
      <span className="agarre" aria-hidden="true" />
      <button ref={cerrarBoton} className="cerrar" type="button" aria-label="Cerrar" onClick={cerrar}>
        <Icono.cerrar />
      </button>
      {t ? (
        <div className="cuerpo">
          <div className="medio">
            {t.video ? (
              <video controls playsInline autoPlay muted={!t.sonido} preload="auto" poster={t.poster ?? undefined}>
                {[t.video.local, t.video.remoto]
                  .filter((x): x is string => !!x)
                  .map((src) => (
                    <source key={src} src={src} type="video/mp4" />
                  ))}
              </video>
            ) : t.vivo && t.tipo === "app" && t.lienzo !== "estudio" && t.lienzo !== "web" ? (
              <Telefono>
                <RespaldoTurnos cliente={t.cliente} />
                <PantallaEnVivo src={t.vivo} titulo={`Vista en vivo de ${t.cliente}`} inmediata />
              </Telefono>
            ) : (
              <Lienzo t={t} />
            )}
          </div>
          <div className="info">
            <Cartela t={t} />
            <h2 id="ficha-titulo">{t.titulo ?? t.obra}</h2>
            <p className="resumen">{t.resumen}</p>
            {t.hecho.length ? (
              <>
                <h3>Qué hicimos</h3>
                <ul className="hecho">
                  {t.hecho.map((h) => (
                    <li key={h}>
                      <Icono.check />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <div className="acciones">
              <Pedir className="boton vivo" algoAsi={t.obra}>
                Quiero algo así
              </Pedir>
              {t.vivo && t.lienzo !== "estudio" ? (
                <a className="boton" href={t.vivo} target={t.vivo.startsWith("/") ? undefined : "_blank"} rel="noopener">
                  <Icono.afuera />
                  Abrir la app real
                </a>
              ) : null}
            </div>
            {t.notaVivo ? <p className="nota">{t.notaVivo}</p> : null}
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
