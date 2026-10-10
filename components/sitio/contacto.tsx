"use client"

import { useRef, useState, useSyncExternalStore, useTransition } from "react"

import { enviarContacto } from "@/lib/vs/acciones-publicas"

import { useSitio } from "./estado"
import { Icono } from "./iconos"

const PRESUPUESTOS = [
  "Todavía no sé",
  "Menos de RD$10,000",
  "RD$10,000 – 30,000",
  "RD$30,000 – 80,000",
  "Más de RD$80,000",
]

/** «Cuéntanos tu negocio»: llega al panel como prospecto nuevo, con la próxima acción para hoy. */
export function FormularioContacto({
  opciones,
  whatsapp,
  instagram,
}: {
  opciones: string[]
  whatsapp: string
  instagram: string
}) {
  const elegidos = useSitio((s) => s.marcados)
  const alternar = useSitio((s) => s.alternar)
  const detalle = useSitio((s) => s.nota)
  const ponerDetalle = useSitio((s) => s.ponerNota)
  const [error, setError] = useState<{
    mensaje: string
    campo?: string
  } | null>(null)
  const [listo, setListo] = useState<string | null>(null)
  const [enviando, empezar] = useTransition()
  const form = useRef<HTMLFormElement>(null)
  // Lo que el script de arranque escribió en <html>: desde qué equipo escriben.
  const dispositivo = useSyncExternalStore(
    () => () => {},
    () => {
      const d = document.documentElement.dataset
      return `${d.dispositivo ?? "?"} · ${d.so ?? "?"}`
    },
    () => ""
  )

  const chat = whatsapp
    ? `https://wa.me/${whatsapp}`
    : `https://ig.me/m/${instagram}`

  if (listo !== null)
    return (
      <div className="listo" role="status">
        <Icono.check />
        <h3>Recibido.</h3>
        <p className="suave">
          Ya nos llegó todo. Te escribimos por WhatsApp en menos de 24 horas.
        </p>
        <div className="acciones">
          <a
            className="boton vivo"
            href={whatsapp ? `${chat}?text=${encodeURIComponent(listo)}` : chat}
            target="_blank"
            rel="noopener"
            onClick={() => {
              if (!whatsapp)
                navigator.clipboard?.writeText(listo).catch(() => {})
            }}
          >
            {whatsapp
              ? "Escribir también por WhatsApp"
              : "Escribir también por Instagram"}
          </a>
        </div>
      </div>
    )

  return (
    <form
      ref={form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const datos = new FormData(e.currentTarget)
        empezar(async () => {
          setError(null)
          const r = await enviarContacto(datos)
          if (r.ok) {
            setListo(
              [
                `Hola, soy ${datos.get("nombre")}.`,
                `Negocio: ${datos.get("negocio")}`,
                `Me interesa: ${elegidos.join(", ") || "no estoy seguro"}`,
                `Presupuesto: ${datos.get("presupuesto")}`,
              ].join("\n")
            )
          } else {
            setError(r)
            if (r.campo)
              (
                form.current?.elements.namedItem(
                  r.campo
                ) as HTMLInputElement | null
              )?.focus()
          }
        })
      }}
    >
      <p hidden>
        <label>
          No llenes esto{" "}
          <input name="sitio-web" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      <input type="hidden" name="dispositivo" value={dispositivo} />
      {elegidos.map((x) => (
        <input key={x} type="hidden" name="intereses" value={x} />
      ))}
      <div className="dos">
        <label className="campo">
          Tu nombre
          <input
            name="nombre"
            autoComplete="name"
            required
            aria-invalid={error?.campo === "nombre" || undefined}
          />
        </label>
        <label className="campo">
          Tu WhatsApp
          <input
            name="telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="809 000 0000"
            required
            aria-invalid={error?.campo === "telefono" || undefined}
          />
        </label>
      </div>
      <label className="campo">
        Tu negocio y a qué se dedica
        <input
          name="negocio"
          placeholder="Ej.: barbería en Los Jardines"
          required
          aria-invalid={error?.campo === "negocio" || undefined}
        />
      </label>
      <div className="campo" role="group" aria-labelledby="l-chips">
        <span id="l-chips">¿Qué te interesa?</span>
        <div className="chips">
          {opciones.map((o, i) => (
            <span className="chip" key={o}>
              <input
                type="checkbox"
                id={`ch${i}`}
                checked={elegidos.includes(o)}
                onChange={() => alternar(o)}
              />
              <label htmlFor={`ch${i}`}>{o}</label>
            </span>
          ))}
        </div>
      </div>
      <div className="dos">
        <label className="campo">
          <span>
            Instagram del negocio <small>(si tiene)</small>
          </span>
          <input name="instagram" autoComplete="off" placeholder="@tunegocio" />
        </label>
        <label className="campo">
          ¿Tienes un presupuesto en mente?
          <select name="presupuesto" defaultValue={PRESUPUESTOS[0]}>
            {PRESUPUESTOS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="campo">
        <span>
          Algo más que debamos saber <small>(opcional)</small>
        </span>
        <textarea
          name="detalle"
          value={detalle}
          onChange={(e) => ponerDetalle(e.target.value)}
          placeholder="Qué te gustaría lograr, para cuándo, qué no te funciona hoy…"
        />
      </label>
      <button className="boton vivo" type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar mensaje"}
      </button>
      <p
        className={`aviso${error ? "error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {error ? error.mensaje : "Te escribimos en menos de 24 horas."}
      </p>
    </form>
  )
}
