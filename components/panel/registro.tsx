"use client"

import { useMemo, useState } from "react"

import {
  borrarRegistro,
  firmarSubida,
  guardarRegistro,
} from "@/lib/vs/acciones-panel"
import { createSupabaseBrowser } from "@/lib/supabase/browser"
import { CAMPOS, NUEVO, aTexto } from "@/lib/vs/campos"
import type { Campo, Entidad, FuenteOpciones } from "@/lib/vs/campos"
import { cn } from "@/lib/utils"

import { Aviso, Boton, BotonConfirmar, Hoja, claseCampo, useAccion } from "./ui"

export type Opciones = Partial<
  Record<FuenteOpciones, { valor: string; etiqueta: string }[]>
>

const NOMBRE: Record<Entidad, string> = {
  prospecto: "prospecto",
  cliente: "cliente",
  proyecto: "proyecto",
  entregable: "entregable",
  cobro: "cobro",
  oferta: "servicio",
  trabajo: "trabajo del catálogo",
  app: "app o página",
}

/** Sube un video o una imagen al almacén del catálogo y deja su dirección en el campo. */
function SubirArchivo({
  clase,
  onListo,
}: {
  clase: "video" | "imagen"
  onListo: (url: string) => void
}) {
  const [estado, setEstado] = useState<string | null>(null)
  const [error, setError] = useState(false)
  return (
    <span className="flex flex-wrap items-center gap-2">
      <label className="inline-flex h-9 cursor-pointer items-center rounded-full bg-muted px-3 text-xs font-semibold focus-within:ring-2 focus-within:ring-ring hover:bg-muted/70">
        {clase === "video" ? "Subir video" : "Subir imagen"}
        <input
          type="file"
          className="sr-only"
          accept={
            clase === "video" ? "video/mp4" : "image/jpeg,image/png,image/webp"
          }
          onChange={async (e) => {
            const archivo = e.target.files?.[0]
            e.target.value = ""
            if (!archivo) return
            setError(false)
            setEstado("Preparando…")
            const permiso = await firmarSubida({
              nombre: archivo.name,
              tipo: archivo.type,
              tamano: archivo.size,
            })
            if (!permiso.ok) {
              setError(true)
              setEstado(permiso.mensaje)
              return
            }
            setEstado(`Subiendo ${(archivo.size / 1048576).toFixed(1)} MB…`)
            const { error: fallo } = await createSupabaseBrowser()
              .storage.from("vs-catalogo")
              .uploadToSignedUrl(permiso.ruta, permiso.token, archivo, {
                contentType: archivo.type,
              })
            if (fallo) {
              setError(true)
              setEstado("No se pudo subir. Revisa tu conexión.")
              return
            }
            onListo(permiso.publica)
            setEstado("Listo. Guarda para publicarlo.")
          }}
        />
      </label>
      {estado ? (
        <span
          className={cn(
            "text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}
          role="status"
        >
          {estado}
        </span>
      ) : null}
    </span>
  )
}

function Control({
  campo,
  valor,
  onCambio,
  opciones,
  bloqueado,
}: {
  campo: Campo
  valor: string
  onCambio: (v: string) => void
  opciones: Opciones
  bloqueado: boolean
}) {
  const id = `c-${campo.columna}`
  const ayuda = campo.ayuda ? (
    <span className="text-xs text-muted-foreground">{campo.ayuda}</span>
  ) : null
  const etiqueta = (
    <span className="text-sm font-medium">
      {campo.etiqueta}
      {campo.requerido ? <span className="text-primary"> *</span> : null}
    </span>
  )

  if (campo.tipo === "si-no")
    return (
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2"
      >
        <input
          id={id}
          type="checkbox"
          className="size-5 accent-[var(--primary)]"
          checked={valor === "true"}
          onChange={(e) => onCambio(e.target.checked ? "true" : "false")}
        />
        <span className="flex flex-col">
          {etiqueta}
          {ayuda}
        </span>
      </label>
    )

  let control
  if (campo.tipo === "opcion") {
    const lista = campo.fuente
      ? (opciones[campo.fuente] ?? []).map(
          (o) => [o.valor, o.etiqueta] as const
        )
      : (campo.opciones ?? [])
    control = (
      <select
        id={id}
        className={claseCampo}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        required={campo.requerido}
      >
        {!campo.requerido || !valor ? (
          <option value="">{campo.requerido ? "Escoge…" : "—"}</option>
        ) : null}
        {lista.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    )
  } else if (["largo", "lineas", "cifras", "pantallas"].includes(campo.tipo)) {
    control = (
      <textarea
        id={id}
        className={cn(claseCampo, "min-h-24 resize-y")}
        rows={campo.tipo === "largo" ? 3 : 4}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
      />
    )
  } else {
    const tipo =
      campo.tipo === "fecha"
        ? "date"
        : campo.tipo === "correo"
          ? "email"
          : campo.tipo === "telefono"
            ? "tel"
            : campo.tipo === "url"
              ? "url"
              : "text"
    control = (
      <input
        id={id}
        className={claseCampo}
        type={tipo}
        inputMode={
          campo.tipo === "numero" || campo.tipo === "dinero"
            ? "decimal"
            : undefined
        }
        value={valor}
        disabled={bloqueado}
        required={campo.requerido}
        onChange={(e) => onCambio(e.target.value)}
      />
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex flex-col gap-1.5">
        {etiqueta}
        {control}
      </label>
      {campo.subida ? (
        <SubirArchivo clase={campo.subida} onListo={onCambio} />
      ) : null}
      {ayuda}
    </div>
  )
}

/**
 * Formulario de cualquier registro del panel, dibujado desde la lista de campos.
 * Sin id crea uno nuevo; con id lo edita y permite borrarlo.
 */
export function FormularioRegistro({
  entidad,
  id,
  valores,
  opciones = {},
  abierta,
  onCerrar,
  onGuardado,
  titulo,
  ocultar = [],
}: {
  entidad: Entidad
  id: string | null
  valores?: Record<string, unknown>
  opciones?: Opciones
  abierta: boolean
  onCerrar: () => void
  onGuardado?: (id: string) => void
  titulo?: string
  /** Columnas que no se muestran (por ejemplo, el cliente cuando ya se sabe). */
  ocultar?: string[]
}) {
  const campos = useMemo(
    () => CAMPOS[entidad].filter((c) => !ocultar.includes(c.columna)),
    [entidad, ocultar]
  )
  const inicial = useMemo(() => {
    const base = { ...(NUEVO[entidad] ?? {}), ...(valores ?? {}) }
    const out: Record<string, string> = {}
    for (const c of CAMPOS[entidad]) {
      const v = base[c.columna]
      out[c.columna] =
        c.tipo === "si-no" ? (v === true ? "true" : "false") : aTexto(c, v)
    }
    return out
  }, [entidad, valores])
  const [datos, setDatos] = useState(inicial)
  // Se carga lo guardado solo al abrir: si los datos de la página se refrescan
  // mientras escribes, no se pierde lo que llevas.
  const [abiertaAntes, setAbiertaAntes] = useState(abierta)
  if (abierta !== abiertaAntes) {
    setAbiertaAntes(abierta)
    if (abierta) setDatos(inicial)
  }
  const { pendiente, mensaje, correr, limpiar } = useAccion()

  const guardar = () =>
    correr(
      () => guardarRegistro(entidad, id, datos),
      undefined,
      (r) => {
        if (r.ok) {
          onGuardado?.(r.id ?? id ?? "")
          onCerrar()
        }
      }
    )

  return (
    <Hoja
      abierta={abierta}
      onCerrar={() => {
        limpiar()
        onCerrar()
      }}
      titulo={
        titulo ??
        (id ? `Editar ${NOMBRE[entidad]}` : `Nuevo ${NOMBRE[entidad]}`)
      }
      ancha={entidad === "trabajo" || entidad === "cliente"}
      pie={
        <>
          <Boton variante="primario" disabled={pendiente} onClick={guardar}>
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton variante="fantasma" onClick={onCerrar}>
            Cancelar
          </Boton>
          <span className="flex-1" />
          {id ? (
            <BotonConfirmar
              disabled={pendiente}
              onConfirmar={() =>
                correr(
                  () => borrarRegistro(entidad, id),
                  undefined,
                  (r) => r.ok && onCerrar()
                )
              }
            >
              Borrar
            </BotonConfirmar>
          ) : null}
          <div className="w-full">
            <Aviso mensaje={mensaje} />
          </div>
        </>
      }
    >
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
      >
        {campos.map((c) => (
          <div
            key={c.columna}
            className={c.ancho === "medio" ? "sm:col-span-1" : "sm:col-span-2"}
          >
            <Control
              campo={c}
              valor={datos[c.columna] ?? ""}
              opciones={opciones}
              bloqueado={!!c.soloAlCrear && !!id}
              onCambio={(v) => setDatos((d) => ({ ...d, [c.columna]: v }))}
            />
          </div>
        ))}
        <button type="submit" hidden />
      </form>
    </Hoja>
  )
}

/** Botón + formulario: lo más común en el panel. */
export function EditarRegistro({
  entidad,
  id = null,
  valores,
  opciones,
  children,
  variante = "normal",
  tam,
  ocultar,
  titulo,
  className,
}: {
  entidad: Entidad
  id?: string | null
  valores?: Record<string, unknown>
  opciones?: Opciones
  children: React.ReactNode
  variante?: "normal" | "primario" | "suave" | "fantasma"
  tam?: "normal" | "chico"
  ocultar?: string[]
  titulo?: string
  className?: string
}) {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <Boton
        variante={variante}
        tam={tam}
        className={className}
        onClick={() => setAbierta(true)}
      >
        {children}
      </Boton>
      <FormularioRegistro
        entidad={entidad}
        id={id}
        valores={valores}
        opciones={opciones}
        abierta={abierta}
        onCerrar={() => setAbierta(false)}
        ocultar={ocultar}
        titulo={titulo}
      />
    </>
  )
}
