"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

/** Cuerpo de teléfono realista: marco de titanio, botones, isla y reflejo del vidrio. */
export function Telefono({
  children,
  pie,
  className = "",
}: {
  children: ReactNode
  pie?: ReactNode
  className?: string
}) {
  return (
    <figure className={`movil ${className}`}>
      <div className="cuerpo">
        <i className="boton-lado accion" aria-hidden />
        <i className="boton-lado vol-mas" aria-hidden />
        <i className="boton-lado vol-menos" aria-hidden />
        <i className="boton-lado encendido" aria-hidden />
        <div className="pantalla">
          {children}
          <i className="isla" aria-hidden />
          <i className="vidrio" aria-hidden />
        </div>
      </div>
      {pie ? <figcaption>{pie}</figcaption> : null}
    </figure>
  )
}

/**
 * Video vertical dentro de un teléfono. Arranca mudo cuando entra en pantalla,
 * se pausa al salir, y con un toque se oye (y se apagan los demás).
 */
export function VideoTelefono({
  src,
  poster,
  titulo,
  negocio,
  sinSonido = false,
  sinPie = false,
  className,
}: {
  src: string
  poster: string
  titulo: string
  negocio: string
  sinSonido?: boolean
  sinPie?: boolean
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [sonido, setSonido] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v || !("IntersectionObserver" in window)) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.35 }
    )
    io.observe(v)
    const otro = (e: Event) => {
      if ((e as CustomEvent).detail !== v) {
        v.muted = true
        setSonido(false)
      }
    }
    window.addEventListener("vs-sonido", otro)
    return () => {
      io.disconnect()
      window.removeEventListener("vs-sonido", otro)
    }
  }, [])

  function alternar() {
    const v = ref.current
    if (!v || sinSonido) return
    const oir = v.muted
    v.muted = !oir
    if (oir) {
      v.currentTime = 0
      v.play().catch(() => {})
      window.dispatchEvent(new CustomEvent("vs-sonido", { detail: v }))
    }
    setSonido(oir)
  }

  return (
    <Telefono
      className={className}
      pie={
        sinPie ? undefined : (
          <>
            <b>{negocio}</b>
            <span>{titulo}</span>
          </>
        )
      }
    >
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-label={`${negocio}: ${titulo}`} />
      {!sinSonido ? (
        <button
          type="button"
          className="tocar"
          onClick={alternar}
          aria-label={sonido ? `Silenciar: ${titulo}` : `Oír con sonido: ${titulo}`}
        >
          <span className={`sonido${sonido ? " encendido" : ""}`}>{sonido ? "🔊 Sonando" : "🔇 Toca para oír"}</span>
        </button>
      ) : null}
    </Telefono>
  )
}

const PRODUCTOS = [
  { n: "Pica pollo + tostones", p: 350, e: "🍗" },
  { n: "La Bandera", p: 300, e: "🍛" },
  { n: "Chimi de res", p: 200, e: "🍔" },
  { n: "Yaroa de pollo", p: 280, e: "🍟" },
  { n: "Morir soñando", p: 120, e: "🥤" },
  { n: "Habichuela con dulce", p: 150, e: "🍮" },
]

/** Catálogo de comida que se usa solo: baja, agrega al carrito y envía el pedido. */
export function CatalogoVivo() {
  const [paso, setPaso] = useState(0)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => setPaso((p) => (p + 1) % 9), 1100)
    return () => clearInterval(t)
  }, [])
  const enCarrito = paso >= 7 ? 3 : Math.min(3, Math.floor(paso / 2))
  const total = [350, 280, 120].slice(0, enCarrito).reduce((a, b) => a + b, 0)
  const tocando = paso < 6 ? [0, 0, 3, 3, 4, 4][paso] : -1
  return (
    <Telefono pie={<><b>Fritura La Esquina</b><span>Catálogo y pedidos por enlace</span></>}>
      <div className="catalogo" aria-label="Ejemplo de catálogo de comida con pedidos">
        <div className="cat-cabeza">
          <span className="cat-logo">🔥</span>
          <div>
            <b>Fritura La Esquina</b>
            <small>Abierto · Los Jardines</small>
          </div>
        </div>
        <div className="cat-chips">
          <span className="on">Lo más pedido</span>
          <span>Almuerzos</span>
          <span>Bebidas</span>
        </div>
        <ul className="cat-lista" style={{ transform: `translateY(-${paso >= 3 && paso < 7 ? 22 : 0}%)` }}>
          {PRODUCTOS.map((x, i) => (
            <li key={x.n} className={tocando === i && paso % 2 === 1 ? "toque" : ""}>
              <span className="cat-foto">{x.e}</span>
              <span className="cat-nombre">
                {x.n}
                <small>RD${x.p}</small>
              </span>
              <span className="cat-mas">+</span>
            </li>
          ))}
        </ul>
        <div className={`cat-carrito${enCarrito ? " lleno" : ""}${paso >= 7 ? " enviado" : ""}`}>
          {paso >= 7 ? (
            <span>✓ Pedido enviado por WhatsApp</span>
          ) : (
            <>
              <span>
                <b>{enCarrito}</b> en el carrito
              </span>
              <span>RD${total} · Pedir</span>
            </>
          )}
        </div>
      </div>
    </Telefono>
  )
}
