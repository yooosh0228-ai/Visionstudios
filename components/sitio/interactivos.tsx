"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { Icono, LogoHorizontal } from "./iconos"
import { Escribenos } from "./escribenos"

/** La barra de arriba: logo, secciones, «Mi cuenta» y el botón de contacto. */
export function Barra({ instagram, whatsapp, correo }: { instagram: string; whatsapp: string; correo?: string }) {
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
          <Escribenos instagram={instagram} whatsapp={whatsapp} correo={correo}>
            <span className="largo">Cuéntanos tu negocio</span>
            <span className="corto">Escríbenos</span>
          </Escribenos>
        </div>
      </div>
    </header>
  )
}

/** Barra para el pulgar: solo en el teléfono, después de la portada y fuera del formulario. */
export function Pulgar({ instagram, whatsapp, correo }: { instagram: string; whatsapp: string; correo?: string }) {
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
      <Escribenos instagram={instagram} whatsapp={whatsapp} correo={correo}>
        <Icono.chat />
        Escríbenos
      </Escribenos>
    </div>
  )
}
