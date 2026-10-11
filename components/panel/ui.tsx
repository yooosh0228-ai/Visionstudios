"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/** Respuesta común de las acciones del servidor. */
export type Res = { ok: true; id?: string } | { ok: false; mensaje: string }

/**
 * Corre una acción del servidor, muestra el resultado y recarga los datos de la
 * página. Devuelve también el id que haya creado la acción.
 */
export function useAccion() {
  const router = useRouter()
  const [pendiente, empezar] = useTransition()
  const [mensaje, setMensaje] = useState<{
    texto: string
    error: boolean
  } | null>(null)
  const correr = (
    accion: () => Promise<Res>,
    exito?: string,
    despues?: (r: Res) => void
  ) =>
    empezar(async () => {
      setMensaje(null)
      const r = await accion()
      setMensaje(
        r.ok
          ? exito
            ? { texto: exito, error: false }
            : null
          : { texto: r.mensaje, error: true }
      )
      if (r.ok) router.refresh()
      despues?.(r)
    })
  return { pendiente, mensaje, correr, limpiar: () => setMensaje(null) }
}

export function Aviso({
  mensaje,
}: {
  mensaje: { texto: string; error: boolean } | null
}) {
  if (!mensaje) return null
  return (
    <p
      role={mensaje.error ? "alert" : "status"}
      className={cn(
        "text-sm",
        mensaje.error ? "text-destructive" : "text-primary"
      )}
    >
      {mensaje.texto}
    </p>
  )
}

/** Hoja lateral (computadora) o de abajo hacia arriba (teléfono) con el <dialog> nativo. */
export function Hoja({
  abierta,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  ancha = false,
}: {
  abierta: boolean
  onCerrar: () => void
  titulo: string
  descripcion?: string
  children: ReactNode
  pie?: ReactNode
  ancha?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierta && !d.open) d.showModal()
    if (!abierta && d.open) d.close()
  }, [abierta])
  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar()
      }}
      aria-labelledby="hoja-titulo"
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-full overflow-hidden rounded-t-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-[2px] open:flex open:flex-col",
        "md:mt-0 md:mr-0 md:ml-auto md:h-dvh md:max-h-dvh md:rounded-none md:rounded-l-2xl",
        ancha ? "md:w-[640px]" : "md:w-[520px]"
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 id="hoja-titulo" className="text-lg font-semibold">
            {titulo}
          </h2>
          {descripcion ? (
            <p className="text-sm text-muted-foreground">{descripcion}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="-mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted"
        >
          <X className="size-5" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {children}
      </div>
      {pie ? (
        <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {pie}
        </footer>
      ) : null}
    </dialog>
  )
}

export function Boton({
  variante = "normal",
  tam = "normal",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "normal" | "primario" | "suave" | "peligro" | "fantasma"
  tam?: "normal" | "chico"
}) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        tam === "chico" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variante === "primario" &&
          "bg-primary text-primary-foreground hover:bg-primary/85",
        variante === "normal" &&
          "border border-border bg-background hover:bg-muted",
        variante === "suave" && "bg-muted text-foreground hover:bg-muted/70",
        variante === "peligro" &&
          "bg-destructive/15 text-destructive hover:bg-destructive/25",
        variante === "fantasma" &&
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    />
  )
}

export function Insignia({
  tono = "neutro",
  children,
}: {
  tono?: "neutro" | "bien" | "atencion" | "mal" | "info"
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tono === "neutro" && "bg-muted text-muted-foreground",
        tono === "bien" && "bg-primary/15 text-primary",
        tono === "atencion" && "bg-amber-400/15 text-amber-300",
        tono === "mal" && "bg-destructive/15 text-destructive",
        tono === "info" && "bg-sky-400/15 text-sky-300"
      )}
    >
      {children}
    </span>
  )
}

export function Tarjeta({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-card p-4",
        className
      )}
    >
      {children}
    </div>
  )
}

export function Encabezado({
  titulo,
  texto,
  acciones,
}: {
  titulo: string
  texto?: string
  acciones?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {titulo}
        </h1>
        {texto ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {texto}
          </p>
        ) : null}
      </div>
      {acciones ? <div className="flex flex-wrap gap-2">{acciones}</div> : null}
    </div>
  )
}

export function Vacio({
  titulo,
  texto,
  accion,
}: {
  titulo: string
  texto?: string
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border p-6">
      <p className="font-semibold">{titulo}</p>
      {texto ? <p className="text-sm text-muted-foreground">{texto}</p> : null}
      {accion}
    </div>
  )
}

export function Kpi({
  etiqueta,
  valor,
  nota,
  tono,
}: {
  etiqueta: string
  valor: string
  nota?: string
  tono?: "mal" | "atencion" | "bien"
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-border bg-card p-4">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </span>
      <span
        className={cn(
          "truncate text-2xl font-semibold tabular-nums md:text-3xl",
          tono === "mal" && "text-destructive",
          tono === "atencion" && "text-amber-300",
          tono === "bien" && "text-primary"
        )}
      >
        {valor}
      </span>
      {nota ? (
        <span className="text-xs text-muted-foreground">{nota}</span>
      ) : null}
    </div>
  )
}

/** Clases para inputs nativos, iguales en todo el panel. */
export const claseCampo =
  "w-full min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 md:text-sm"

/** Un botón que pide confirmación con un segundo toque (sin ventanas del navegador). */
export function BotonConfirmar({
  children,
  confirmar = "¿Seguro? Toca otra vez",
  onConfirmar,
  disabled,
}: {
  children: ReactNode
  confirmar?: string
  onConfirmar: () => void
  disabled?: boolean
}) {
  const [armado, setArmado] = useState(false)
  useEffect(() => {
    if (!armado) return
    const t = setTimeout(() => setArmado(false), 4000)
    return () => clearTimeout(t)
  }, [armado])
  return (
    <Boton
      variante="peligro"
      disabled={disabled}
      onClick={() => {
        if (armado) {
          setArmado(false)
          onConfirmar()
        } else setArmado(true)
      }}
    >
      {armado ? confirmar : children}
    </Boton>
  )
}
