"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"

import { enviarContacto } from "@/lib/vs/acciones-publicas"

/*
 * Demo de app: el cliente pone su logo, colores y estilo y ve una muestra
 * limitada de cómo se vería. La muestra lleva marca de agua con su nombre,
 * se tapa cuando la ventana pierde el foco y no deja copiar ni arrastrar.
 * Solo se puede enviar a Vision Studios.
 */

type Tipo = "barberia" | "comida" | "tienda" | "carwash" | "salon" | "otro"

const TIPOS: Record<Tipo, { nombre: string; accion: string; items: [string, string][]; lema: string }> = {
  barberia: { nombre: "Barbería", accion: "Apartar turno", lema: "Tu corte, a tu hora.", items: [["💈", "Corte"], ["🧔", "Corte + barba"], ["✨", "Cejas"], ["👦", "Corte de niño"]] },
  comida: { nombre: "Comida", accion: "Hacer pedido", lema: "Pide sin llamar.", items: [["🍗", "Pica pollo"], ["🍛", "La Bandera"], ["🍔", "Chimi"], ["🥤", "Jugos"]] },
  tienda: { nombre: "Tienda", accion: "Ver catálogo", lema: "Lo nuevo, primero aquí.", items: [["👕", "Camisetas"], ["👖", "Pantalones"], ["👟", "Tenis"], ["🧢", "Gorras"]] },
  carwash: { nombre: "Car wash", accion: "Reservar lavado", lema: "Tu carro, como nuevo.", items: [["🚿", "Lavado"], ["🧽", "Interior"], ["✨", "Brillado"], ["🛞", "Gomas"]] },
  salon: { nombre: "Salón de belleza", accion: "Reservar cita", lema: "Llega y te atendemos.", items: [["💇‍♀️", "Pelo"], ["💅", "Uñas"], ["👁️", "Pestañas"], ["💆‍♀️", "Tratamiento"]] },
  otro: { nombre: "Otro negocio", accion: "Escribirnos", lema: "Todo lo que ofrecemos.", items: [["⭐", "Servicio 1"], ["⭐", "Servicio 2"], ["⭐", "Servicio 3"], ["⭐", "Servicio 4"]] },
}
const COLORES = ["#35B37E", "#e8452c", "#2f6bff", "#d8a33c", "#9b5cff", "#ff4f9a", "#111111", "#0fb5c9"]
const ESTILOS = { oscuro: "Oscuro", claro: "Claro", vivo: "Vibrante" } as const
const LETRAS = { moderna: "Moderna", elegante: "Elegante", redonda: "Redonda" } as const
const FORMAS = { redonda: "Redonda", recta: "Recta" } as const

function reducirLogo(archivo: File): Promise<string> {
  return new Promise((ok, mal) => {
    const img = new Image()
    const url = URL.createObjectURL(archivo)
    img.onload = () => {
      const lado = 256
      const k = Math.min(1, lado / Math.max(img.width, img.height))
      const c = document.createElement("canvas")
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      ok(c.toDataURL("image/png"))
    }
    img.onerror = () => mal(new Error("No pudimos leer esa imagen."))
    img.src = url
  })
}

export function Demo() {
  const [negocio, setNegocio] = useState("")
  const [tipo, setTipo] = useState<Tipo>("barberia")
  const [color, setColor] = useState(COLORES[0]!)
  const [estilo, setEstilo] = useState<keyof typeof ESTILOS>("oscuro")
  const [letra, setLetra] = useState<keyof typeof LETRAS>("moderna")
  const [forma, setForma] = useState<keyof typeof FORMAS>("redonda")
  const [lema, setLema] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [tapado, setTapado] = useState(false)
  const [aviso, setAviso] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [enviando, empezar] = useTransition()
  const vista = useRef<HTMLDivElement>(null)

  // Protección: se tapa si la ventana pierde el foco o al intentar capturar.
  useEffect(() => {
    const tapar = () => setTapado(true)
    const vis = () => document.visibilityState !== "visible" && setTapado(true)
    const teclas = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey) || (e.ctrlKey && (e.key === "p" || e.key === "s"))) {
        e.preventDefault()
        setTapado(true)
      }
    }
    window.addEventListener("blur", tapar)
    document.addEventListener("visibilitychange", vis)
    window.addEventListener("keydown", teclas)
    window.addEventListener("beforeprint", tapar)
    return () => {
      window.removeEventListener("blur", tapar)
      document.removeEventListener("visibilitychange", vis)
      window.removeEventListener("keydown", teclas)
      window.removeEventListener("beforeprint", tapar)
    }
  }, [])

  const t = TIPOS[tipo]
  const nombre = negocio.trim() || "Tu negocio"
  const marca = useMemo(() => {
    const txt = `DEMO · VISION STUDIOS · ${nombre.toUpperCase().slice(0, 24)} · ${new Date().toLocaleDateString("es-DO")}`
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='150'><text x='0' y='80' transform='rotate(-24 150 75)' font-family='sans-serif' font-size='11' font-weight='700' fill='rgba(128,128,128,0.32)'>${txt.replace(/[<&>']/g, "")}</text></svg>`
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
  }, [nombre])

  async function subirLogo(f: File | undefined) {
    if (!f) return
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)) return setAviso("Usa una imagen PNG, JPG o WEBP.")
    if (f.size > 8_000_000) return setAviso("Esa imagen es muy pesada (máximo 8 MB).")
    try {
      setLogo(await reducirLogo(f))
      setAviso("")
    } catch (e) {
      setAviso((e as Error).message)
    }
  }

  function enviar(form: HTMLFormElement) {
    const fd = new FormData(form)
    fd.set("negocio", `${nombre} (${t.nombre})`)
    fd.append("intereses", "Demo de app web")
    fd.set("detalle", `Demo armado en la página: ${t.nombre}, color ${color}, estilo ${ESTILOS[estilo]}, letra ${LETRAS[letra]}, forma ${FORMAS[forma]}${lema ? `, lema «${lema}»` : ""}.`)
    fd.set("demo", JSON.stringify({ tipo, color, estilo, letra, forma, lema, logo }))
    fd.set("dispositivo", document.documentElement.dataset.dispositivo ?? "")
    empezar(async () => {
      const r = await enviarContacto(fd)
      if (r.ok) setEnviado(true)
      else setAviso(r.mensaje)
    })
  }

  const radio = forma === "redonda" ? "18px" : "4px"

  return (
    <div className="dm">
      <header className="dm-barra">
        <Link href="/">← Vision Studios</Link>
        <span>Demo de tu app</span>
      </header>
      <main className="dm-main">
        <div className="dm-intro">
          <h1>Mira tu negocio en una app.</h1>
          <p>
            Pon tu logo y tus colores y te enseñamos una muestra. Es solo un
            adelanto: tu app de verdad la diseñamos desde cero, a la medida de
            cómo trabajas.
          </p>
        </div>

        <div className="dm-rejilla">
          <section className="dm-panel" aria-label="Opciones del demo">
            <label className="dm-campo">
              <span>Nombre del negocio</span>
              <input value={negocio} maxLength={28} onChange={(e) => setNegocio(e.target.value)} placeholder="Ej.: Barbería El Flow" />
            </label>
            <div className="dm-campo">
              <span>¿Qué tipo de negocio?</span>
              <div className="dm-chips">
                {(Object.keys(TIPOS) as Tipo[]).map((k) => (
                  <button key={k} type="button" className={k === tipo ? "on" : ""} aria-pressed={k === tipo} onClick={() => setTipo(k)}>
                    {TIPOS[k].nombre}
                  </button>
                ))}
              </div>
            </div>
            <label className="dm-campo dm-logo">
              <span>Tu logo</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => subirLogo(e.target.files?.[0])} />
              <em>{logo ? "✓ Logo puesto. Toca para cambiarlo." : "Sube tu logo (PNG con fondo transparente queda mejor)"}</em>
            </label>
            <div className="dm-campo">
              <span>Color de tu marca</span>
              <div className="dm-colores">
                {COLORES.map((c) => (
                  <button key={c} type="button" style={{ background: c }} className={c === color ? "on" : ""} aria-label={`Color ${c}`} aria-pressed={c === color} onClick={() => setColor(c)} />
                ))}
                <label className="dm-otro-color" aria-label="Otro color">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                </label>
              </div>
            </div>
            {[
              ["Estilo", ESTILOS, estilo, setEstilo],
              ["Letra", LETRAS, letra, setLetra],
              ["Esquinas", FORMAS, forma, setForma],
            ].map(([titulo, ops, val, set]) => (
              <div className="dm-campo" key={titulo as string}>
                <span>{titulo as string}</span>
                <div className="dm-segmentos">
                  {Object.entries(ops as Record<string, string>).map(([k, v]) => (
                    <button key={k} type="button" className={k === val ? "on" : ""} aria-pressed={k === val} onClick={() => (set as (x: string) => void)(k)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <label className="dm-campo">
              <span>Frase corta (opcional)</span>
              <input value={lema} maxLength={40} onChange={(e) => setLema(e.target.value)} placeholder={t.lema} />
            </label>
          </section>

          <section className="dm-vista-envoltura" aria-label="Vista previa protegida">
            <div
              ref={vista}
              className={`dm-telefono e-${estilo} l-${letra}${tapado ? " tapado" : ""}`}
              style={{ ["--c" as string]: color, ["--r" as string]: radio }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
            >
              <div className="dm-pantalla">
                <div className="dm-app">
                  <div className="dm-cabeza">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="" draggable={false} />
                    ) : (
                      <span className="dm-inicial">{nombre.slice(0, 1).toUpperCase()}</span>
                    )}
                    <div>
                      <b>{nombre}</b>
                      <small>Abierto ahora</small>
                    </div>
                  </div>
                  <div className="dm-hero">
                    <p>{lema.trim() || t.lema}</p>
                    <span className="dm-cta">{t.accion}</span>
                  </div>
                  <div className="dm-items">
                    {t.items.map(([e, n]) => (
                      <div key={n}>
                        <span>{e}</span>
                        <b>{n}</b>
                        <i />
                      </div>
                    ))}
                  </div>
                  <div className="dm-bloqueado">🔒 Las demás pantallas se diseñan con tu negocio</div>
                  <nav className="dm-tabs" aria-hidden>
                    <span className="on">●</span>
                    <span>●</span>
                    <span>●</span>
                  </nav>
                </div>
                <div className="dm-marca" style={{ backgroundImage: marca }} aria-hidden />
                <div className="dm-isla" aria-hidden />
              </div>
              {tapado ? (
                <button type="button" className="dm-tapa" onClick={() => setTapado(false)}>
                  <b>Vista protegida</b>
                  <span>Toca para seguir viendo tu demo</span>
                </button>
              ) : null}
            </div>
            <p className="dm-nota">
              Esta muestra es privada y lleva tu nombre. Solo se envía a Vision Studios.
            </p>
          </section>
        </div>

        <section className="dm-enviar" aria-labelledby="dm-t-enviar">
          {enviado ? (
            <div className="dm-listo" role="status">
              <h2>¡Recibimos tu demo! 🎉</h2>
              <p>Te escribimos por WhatsApp para enseñarte cómo quedaría tu app de verdad, hecha a tu medida.</p>
              <Link href="/" className="dm-boton">Volver a Vision Studios</Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                enviar(e.currentTarget)
              }}
            >
              <h2 id="dm-t-enviar">¿Te gustó? Mándanoslo.</h2>
              <p>Lo vemos con tu logo y te decimos cómo hacerla de verdad, sin compromiso.</p>
              <div className="dm-fila">
                <label className="dm-campo">
                  <span>Tu nombre</span>
                  <input name="nombre" required maxLength={60} autoComplete="name" />
                </label>
                <label className="dm-campo">
                  <span>Tu WhatsApp</span>
                  <input name="telefono" required inputMode="tel" maxLength={20} placeholder="809 000 0000" autoComplete="tel" />
                </label>
              </div>
              <input type="text" name="sitio-web" tabIndex={-1} autoComplete="off" className="dm-trampa" aria-hidden />
              {aviso ? <p className="dm-aviso" role="alert">{aviso}</p> : null}
              <button className="dm-boton" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar mi demo a Vision Studios"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}
