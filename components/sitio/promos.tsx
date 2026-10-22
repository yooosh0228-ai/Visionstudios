"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Video vertical dentro de un teléfono. Arranca mudo cuando entra en pantalla,
 * se pausa al salir, y con un toque se oye (y se apagan los demás).
 */
export function VideoTelefono({
  src,
  poster,
  titulo,
  negocio,
}: {
  src: string
  poster: string
  titulo: string
  negocio: string
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
    if (!v) return
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
    <figure className="telefono">
      <button
        type="button"
        className="pantalla"
        onClick={alternar}
        aria-label={sonido ? `Silenciar: ${titulo}` : `Oír con sonido: ${titulo}`}
      >
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
        />
        <span className={`sonido${sonido ? " encendido" : ""}`} aria-hidden>
          {sonido ? "🔊" : "🔇 Toca para oír"}
        </span>
      </button>
      <figcaption>
        <b>{negocio}</b>
        <span>{titulo}</span>
      </figcaption>
    </figure>
  )
}
