"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import type { Trabajo } from "@/lib/vs/types"

import { useSitio } from "./estado"
import { Icono, LogoHorizontal, Ojo } from "./iconos"
import { VideoVigilado } from "./medios"
import { Pedir } from "./pedir"

/** La barra de arriba: logo, secciones, «Mi cuenta» y el botón de contacto. */
export function Barra() {
  const [conBorde, setConBorde] = useState(false)
  const [actual, setActual] = useState<string | null>(null)

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return
    const portada = document.getElementById("inicio-portada")
    const ioBorde = new IntersectionObserver(([e]) => setConBorde(!e?.isIntersecting), { threshold: 0 })
    if (portada) ioBorde.observe(portada)
    const ioSeccion = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActual(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    )
    for (const id of ["servicios", "videos", "influencer", "trabajo", "contacto"]) {
      const el = document.getElementById(id)
      if (el) ioSeccion.observe(el)
    }
    return () => {
      ioBorde.disconnect()
      ioSeccion.disconnect()
    }
  }, [])

  const secciones = [
    ["servicios", "Servicios"],
    ["videos", "Videos"],
    ["influencer", "Influencer"],
    ["trabajo", "Apps"],
    ["contacto", "Contacto"],
  ] as const

  return (
    <header className={`barra${conBorde ? " con-borde" : ""}`}>
      <div className="envoltura">
        <a href="#inicio" aria-label="Vision Studios, inicio">
          <LogoHorizontal className="logo" />
        </a>
        <nav aria-label="Secciones">
          {secciones.map(([id, texto]) => (
            <a key={id} href={`#${id}`} aria-current={actual === id ? "true" : undefined}>
              {texto}
            </a>
          ))}
        </nav>
        <div className="barra-acciones">
          <Link className="cuenta" href="/entrar" aria-label="Mi cuenta">
            <Icono.persona />
            <span className="largo">Mi cuenta</span>
          </Link>
          <Pedir className="boton vivo">
            <span className="largo">Cuéntanos tu negocio</span>
            <span className="corto">Escríbenos</span>
          </Pedir>
        </div>
      </div>
    </header>
  )
}

/** El visor de cámara de la portada. Si un video no carga, corre el siguiente que sí esté en el sitio. */
export function Visor({ trabajos, portada }: { trabajos: Trabajo[]; portada: string }) {
  const abrir = useSitio((s) => s.abrirFicha)
  const cola = useMemo(() => {
    const primero = trabajos.find((t) => t.id === portada && t.video)
    const resto = trabajos.filter((t) => t.video && t.id !== portada && t.video.local)
    return [primero, ...resto].filter((t): t is Trabajo => !!t)
  }, [trabajos, portada])
  const [indice, setIndice] = useState(0)
  const [corriendo, setCorriendo] = useState(false)
  const [hora, setHora] = useState("--:--")
  const actual = cola[indice]

  useEffect(() => {
    const poner = () => {
      try {
        setHora(
          new Intl.DateTimeFormat("es-DO", {
            timeZone: "America/Santo_Domingo",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date())
        )
      } catch {
        setHora("")
      }
    }
    poner()
    const t = setInterval(poner, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <figure className="visor">
      <span className="esq a" />
      <span className="esq b" />
      <span className="esq c" />
      <span className="esq d" />
      <div className="hud" aria-hidden="true">
        <span>
          <span className="rec" />
          REC
        </span>
        <span>{hora}</span>
      </div>
      {!corriendo ? (
        <div className="cubierta" aria-hidden="true">
          <Ojo />
        </div>
      ) : null}
      {actual?.video ? (
        <VideoVigilado
          key={actual.id}
          fuente={actual.video}
          poster={actual.poster}
          aria-label={`${actual.obra}, ${actual.cliente}`}
          onCorriendo={() => setCorriendo(true)}
          onFallo={() => {
            if (indice < cola.length - 1) setIndice(indice + 1)
          }}
        />
      ) : null}
      {actual ? (
        <figcaption className="pie-visor">
          <p>
            <b>{actual.obra}</b>
            {actual.cliente}
          </p>
          <button className="boton-redondo" type="button" aria-label="Ver con sonido" onClick={() => abrir(actual.id)}>
            <Icono.play />
          </button>
        </figcaption>
      ) : null}
    </figure>
  )
}

/** Barra para el pulgar: solo en el teléfono, después de la portada y fuera del formulario. */
export function Pulgar({ chat }: { chat: string }) {
  const [paso, setPaso] = useState(false)
  const [enContacto, setEnContacto] = useState(false)
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return
    const portada = document.getElementById("inicio-portada")
    const contacto = document.getElementById("contacto")
    const a = new IntersectionObserver(([e]) => setPaso(!e?.isIntersecting), { threshold: 0 })
    const b = new IntersectionObserver(([e]) => setEnContacto(!!e?.isIntersecting), { threshold: 0.05 })
    if (portada) a.observe(portada)
    if (contacto) b.observe(contacto)
    return () => {
      a.disconnect()
      b.disconnect()
    }
  }, [])
  const ver = paso && !enContacto
  return (
    <div className={`pulgar${ver ? " visible" : ""}`} aria-hidden={!ver} inert={!ver}>
      <Pedir className="boton vivo">Cuéntanos tu negocio</Pedir>
      <a className="boton icono" href={chat} target="_blank" rel="noopener" aria-label="Escríbenos">
        <Icono.chat />
      </a>
    </div>
  )
}
