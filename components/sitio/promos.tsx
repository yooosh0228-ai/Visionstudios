"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

/** Cuerpo de teléfono realista: marco de titanio, botones, isla y reflejo del vidrio. */
function Telefono({
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
        <i className="boton-lado poder" aria-hidden />
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

/* Esquinas de la pantalla dentro de /mockups/laptop.webp, en % del ancho y alto de la imagen. */
const PANTALLA = [
  [2.6, 16.5],
  [61.6, 3.45],
  [68.75, 47.45],
  [11.05, 66.25],
] as const

/** Matriz que lleva un rectángulo w×h a cuatro esquinas (perspectiva real). */
function matrizPerspectiva(w: number, h: number, p: readonly (readonly [number, number])[]) {
  const [x0, y0] = p[0]!, [x1, y1] = p[1]!, [x2, y2] = p[2]!, [x3, y3] = p[3]!
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3
  const den = dx1 * dy2 - dx2 * dy1
  const g = (dx3 * dy2 - dx2 * dy3) / den
  const hh = (dx1 * dy3 - dx3 * dy1) / den
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0
  const d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0
  // De cuadrado unitario a las esquinas; se divide entre w y h para el rectángulo.
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1]
  return `matrix3d(${m.map((n) => +n.toFixed(9)).join(",")})`
}

/** Laptop fotorrealista: la pantalla del video se acomoda en perspectiva dentro de la foto. */
function Laptop({ children, className = "" }: { children: ReactNode; className?: string }) {
  const escena = useRef<HTMLDivElement>(null)
  const [matriz, setMatriz] = useState<string>("")
  useEffect(() => {
    const el = escena.current
    if (!el) return
    const medir = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      if (!W || !H) return
      setMatriz(matrizPerspectiva(1600, 1000, PANTALLA.map(([x, y]) => [(x / 100) * W, (y / 100) * H] as const)))
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <figure className={`laptop ${className}`}>
      <div className="laptop-escena" ref={escena}>
        <div className="laptop-pantalla" style={{ transform: matriz || undefined, visibility: matriz ? "visible" : "hidden" }}>
          {children}
          <i className="vidrio" aria-hidden />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="laptop-marco" src="/mockups/laptop.webp" alt="" aria-hidden decoding="async" />
      </div>
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
  marco = "telefono",
  className,
}: {
  marco?: "telefono" | "laptop"
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

  const contenido = (
    <>
      {marco === "laptop" ? <i className="laptop-fondo" style={{ backgroundImage: `url(${poster})` }} aria-hidden /> : null}
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-label={`${negocio}: ${titulo}`} />
      {!sinSonido ? (
        <button
          type="button"
          className="tocar"
          onClick={alternar}
          aria-label={sonido ? `Silenciar: ${titulo}` : `Oír con sonido: ${titulo}`}
        >
          <span className={`sonido${sonido ? " encendido" : ""}`} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" />
              {sonido ? (
                <>
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                </>
              ) : (
                <path d="m16 9 6 6m0-6-6 6" />
              )}
            </svg>
          </span>
        </button>
      ) : null}
    </>
  )
  if (marco === "laptop") return <Laptop className={className}>{contenido}</Laptop>
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
      {contenido}
    </Telefono>
  )
}

const PRODUCTOS = [
  { n: "Pica pollo + tostones", p: 350, f: "/demo/comida-1.webp" },
  { n: "La Bandera", p: 300, f: "/demo/comida-2.webp" },
  { n: "Chimi de res", p: 200, f: "/demo/comida-3.webp" },
  { n: "Jugo natural", p: 100, f: "/demo/comida-4.webp" },
  { n: "Yaroa de pollo", p: 280, f: "/demo/comida-5.webp" },
  { n: "Sancocho", p: 250, f: "/demo/comida-6.webp" },
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
  const total = [350, 100, 280].slice(0, enCarrito).reduce((a, b) => a + b, 0)
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
              <span className="cat-foto" style={{ backgroundImage: `url(${x.f})` }} />
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
