"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"

import {
  Aviso,
  Boton,
  Tarjeta,
  claseCampo,
  useAccion,
} from "@/components/panel/ui"
import { crearDesdeIntake } from "@/lib/vs/acciones-panel"
import { SECTORES } from "@/lib/vs/types"
import { cn } from "@/lib/utils"

type Campo = {
  col: string
  etiqueta: string
  tipo?: "largo" | "opcion" | "correo" | "tel"
  requerido?: boolean
  ayuda?: string
  placeholder?: string
}

const PASOS: { titulo: string; texto: string; campos: Campo[] }[] = [
  {
    titulo: "El negocio",
    texto: "Quién es y dónde se le encuentra.",
    campos: [
      { col: "nombre", etiqueta: "Nombre del negocio", requerido: true },
      { col: "contacto", etiqueta: "Persona de contacto", requerido: true },
      { col: "telefono", etiqueta: "Teléfono / WhatsApp", tipo: "tel" },
      { col: "sector", etiqueta: "Sector", tipo: "opcion" },
      { col: "ciudad", etiqueta: "Ciudad / zona" },
      {
        col: "enlace",
        etiqueta: "Instagram, web o Google Business",
        placeholder: "instagram.com/negocio",
      },
    ],
  },
  {
    titulo: "Oferta y audiencia",
    texto: "Qué vende, a quién y qué lo respalda. En palabras del cliente.",
    campos: [
      { col: "oferta", etiqueta: "Qué vende y a qué precio", tipo: "largo" },
      { col: "audiencia", etiqueta: "A quién le vende", tipo: "largo" },
      {
        col: "prueba",
        etiqueta: "Pruebas que tiene",
        tipo: "largo",
        ayuda: "Fotos, casos, testimonios, años en el negocio.",
      },
      { col: "rango_precio", etiqueta: "Presupuesto o rango" },
    ],
  },
  {
    titulo: "Dirección",
    texto: "A dónde quiere llegar y qué se lo impide.",
    campos: [
      { col: "objetivo", etiqueta: "Objetivo principal", tipo: "largo" },
      { col: "obstaculo", etiqueta: "Obstáculo principal", tipo: "largo" },
      {
        col: "tono",
        etiqueta: "Tono de la marca",
        placeholder: "Cercano, serio, de barrio, elegante…",
      },
      {
        col: "materiales",
        etiqueta: "Material, permisos y restricciones",
        tipo: "largo",
      },
    ],
  },
]

const VACIO: Record<string, string> = {
  ciudad: "Santiago de los Caballeros",
  proyecto: "Diagnóstico inicial",
}
const LLAVE = "vs-intake-borrador"

/** Master Intake en cuatro pasos. Se llena con el cliente, no por él: aquí no se inventa nada. */
export function Intake() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState<Record<string, string>>(VACIO)
  const [faltan, setFaltan] = useState<string[]>([])
  const { pendiente, mensaje, correr } = useAccion()

  // El borrador guardado en este dispositivo se carga una vez, al primer pintado en el navegador.
  const guardado = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(LLAVE)
      } catch {
        return null
      }
    },
    () => null
  )
  const [borradorCargado, setBorradorCargado] = useState(false)
  if (!borradorCargado && guardado) {
    setBorradorCargado(true)
    try {
      setDatos({ ...VACIO, ...JSON.parse(guardado) })
    } catch {
      /* borrador dañado: se empieza de cero */
    }
  }
  useEffect(() => {
    // No se pisa un borrador guardado con el formulario vacío del primer pintado.
    if (JSON.stringify(datos) === JSON.stringify(VACIO)) return
    try {
      localStorage.setItem(LLAVE, JSON.stringify(datos))
    } catch {
      /* sin almacenamiento */
    }
  }, [datos])

  const poner = (col: string, v: string) =>
    setDatos((d) => ({ ...d, [col]: v }))
  const seguir = () => {
    const actual = PASOS[paso]
    const vacios = actual
      ? actual.campos
          .filter((c) => c.requerido && !datos[c.col]?.trim())
          .map((c) => c.col)
      : []
    setFaltan(vacios)
    if (!vacios.length) setPaso((p) => p + 1)
  }

  return (
    <Tarjeta className="flex flex-col gap-5">
      <ol className="flex gap-2" aria-label="Pasos">
        {[...PASOS.map((p) => p.titulo), "Revisar"].map((t, i) => (
          <li key={t} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1.5 rounded-full",
                i <= paso ? "bg-primary" : "bg-muted"
              )}
            />
            <span
              className={cn(
                "hidden text-xs sm:block",
                i === paso ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {i + 1}. {t}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground sm:hidden">
        Paso {paso + 1} de 4 ·{" "}
        {paso < PASOS.length ? PASOS[paso]?.titulo : "Revisar"}
      </p>

      {paso < PASOS.length ? (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            seguir()
          }}
        >
          <p className="text-sm text-muted-foreground sm:col-span-2">
            {PASOS[paso]?.texto}
          </p>
          {PASOS[paso]?.campos.map((c) => {
            const id = `in-${c.col}`
            const malo = faltan.includes(c.col)
            return (
              <label
                key={c.col}
                htmlFor={id}
                className={cn(
                  "flex flex-col gap-1.5",
                  c.tipo === "largo" ? "sm:col-span-2" : ""
                )}
              >
                <span className="text-sm font-medium">
                  {c.etiqueta}
                  {c.requerido ? (
                    <span className="text-primary"> *</span>
                  ) : null}
                </span>
                {c.tipo === "largo" ? (
                  <textarea
                    id={id}
                    className={cn(claseCampo, "min-h-24")}
                    value={datos[c.col] ?? ""}
                    onChange={(e) => poner(c.col, e.target.value)}
                  />
                ) : c.tipo === "opcion" ? (
                  <select
                    id={id}
                    className={claseCampo}
                    value={datos[c.col] ?? ""}
                    onChange={(e) => poner(c.col, e.target.value)}
                  >
                    <option value="">Escoge…</option>
                    {SECTORES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    className={cn(claseCampo, malo && "border-destructive")}
                    type={c.tipo === "tel" ? "tel" : "text"}
                    placeholder={c.placeholder}
                    aria-invalid={malo || undefined}
                    value={datos[c.col] ?? ""}
                    onChange={(e) => poner(c.col, e.target.value)}
                  />
                )}
                {c.ayuda ? (
                  <span className="text-xs text-muted-foreground">
                    {c.ayuda}
                  </span>
                ) : null}
                {malo ? (
                  <span className="text-xs text-destructive">
                    Este dato es la base mínima.
                  </span>
                ) : null}
              </label>
            )
          })}
          <div className="flex gap-2 sm:col-span-2">
            {paso > 0 ? (
              <Boton variante="fantasma" onClick={() => setPaso((p) => p - 1)}>
                Anterior
              </Boton>
            ) : null}
            <Boton variante="primario" type="submit">
              Continuar
            </Boton>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Revisa antes de crear el Client Brain. Se guarda como hechos del
            cliente y se abre un proyecto en etapa Intake. La radiografía separa
            después lo que son hipótesis.
          </p>
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[11rem_1fr]">
            {PASOS.flatMap((p) => p.campos).map((c) => (
              <div key={c.col} className="contents">
                <dt className="text-muted-foreground">{c.etiqueta}</dt>
                <dd className="whitespace-pre-line">
                  {datos[c.col]?.trim() || (
                    <span className="text-muted-foreground">Pendiente</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Correo de Google del cliente (opcional)
              </span>
              <input
                className={claseCampo}
                type="email"
                value={datos.email ?? ""}
                onChange={(e) => poner("email", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Con este correo entra a su área y ve su proyecto.
              </span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Nombre del primer proyecto
              </span>
              <input
                className={claseCampo}
                value={datos.proyecto ?? ""}
                onChange={(e) => poner("proyecto", e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Boton
              variante="fantasma"
              onClick={() => setPaso(PASOS.length - 1)}
            >
              Anterior
            </Boton>
            <Boton
              variante="primario"
              disabled={pendiente}
              onClick={() => {
                const { proyecto, ...cliente } = datos
                correr(
                  () => crearDesdeIntake(cliente, proyecto ?? ""),
                  undefined,
                  (r) => {
                    if (r.ok && r.id) {
                      try {
                        localStorage.removeItem(LLAVE)
                      } catch {
                        /* sin almacenamiento */
                      }
                      router.push(`/admin/clientes/${r.id}`)
                    }
                  }
                )
              }}
            >
              {pendiente ? "Creando…" : "Crear Client Brain y proyecto"}
            </Boton>
          </div>
          <Aviso mensaje={mensaje} />
        </div>
      )}
    </Tarjeta>
  )
}
