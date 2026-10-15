"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import {
  Aviso,
  Boton,
  Tarjeta,
  claseCampo,
  useAccion,
} from "@/components/panel/ui"
import { guardarAjustes } from "@/lib/vs/acciones-panel"
import type { Ajustes, CuentaPago, PaqueteCreditos } from "@/lib/vs/ajustes"
import { cn } from "@/lib/utils"

const aLineas = (filas: string[][]) =>
  filas.map((f) => f.join(" | ")).join("\n")
const deLineas = (texto: string, n: number) =>
  texto
    .split(/\r?\n/)
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((p) => p.slice(0, n).every(Boolean))
    .map((p) => p.slice(0, n))

function Campo({
  etiqueta,
  ayuda,
  children,
  ancho,
}: {
  etiqueta: string
  ayuda?: string
  children: React.ReactNode
  ancho?: boolean
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", ancho && "sm:col-span-2")}>
      <span className="text-sm font-medium">{etiqueta}</span>
      {children}
      {ayuda ? (
        <span className="text-xs text-muted-foreground">{ayuda}</span>
      ) : null}
    </label>
  )
}

export function FormularioAjustes({
  ajustes,
  videos,
  ofertas,
  regalados,
}: {
  ajustes: Ajustes
  videos: { id: string; nombre: string }[]
  ofertas: { id: string; nombre: string }[]
  /** Cuántas cuentas ya recibieron el regalo de bienvenida (null si no se pudo leer). */
  regalados: number | null
}) {
  const [a, setA] = useState(ajustes)
  const [prueba, setPrueba] = useState(aLineas(ajustes.pruebaSocial))
  const [reglas, setReglas] = useState(aLineas(ajustes.reglasCobro))
  const [pasos, setPasos] = useState(aLineas(ajustes.pasos))
  const [compromisos, setCompromisos] = useState(aLineas(ajustes.compromisos))
  const { pendiente, mensaje, correr } = useAccion()
  const poner = <K extends keyof Ajustes>(k: K, v: Ajustes[K]) =>
    setA((x) => ({ ...x, [k]: v }))

  const cuenta = (i: number, k: keyof CuentaPago, v: string) =>
    poner(
      "cuentasPago",
      a.cuentasPago.map((c, j) => (j === i ? { ...c, [k]: v } : c))
    )
  const paquete = (i: number, k: keyof PaqueteCreditos, v: string) =>
    poner(
      "paquetesCreditos",
      a.paquetesCreditos.map((p, j) =>
        j === i ? { ...p, [k]: Number(v.replace(/\D/g, "")) || 0 } : p
      )
    )

  const guardar = () =>
    correr(
      () =>
        guardarAjustes({
          ...a,
          pruebaSocial: deLineas(prueba, 2) as [string, string][],
          reglasCobro: deLineas(reglas, 2) as [string, string][],
          pasos: deLineas(pasos, 2) as [string, string][],
          compromisos: deLineas(compromisos, 3) as [string, string, string][],
        }),
      "Guardado. La portada ya lo muestra."
    )

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        guardar()
      }}
    >
      <Tarjeta className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Contacto</h2>
        <Campo
          etiqueta="WhatsApp de negocio"
          ayuda="Solo números, con el 1 delante: 18095551234. Con número, todos los botones de chat van a WhatsApp."
        >
          <input
            className={claseCampo}
            inputMode="tel"
            value={a.whatsapp}
            onChange={(e) => poner("whatsapp", e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Instagram" ayuda="Sin @">
          <input
            className={claseCampo}
            value={a.instagram}
            onChange={(e) => poner("instagram", e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Correo" ancho>
          <input
            className={claseCampo}
            type="email"
            value={a.correo}
            onChange={(e) => poner("correo", e.target.value)}
          />
        </Campo>
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">Cuentas para recibir transferencias</h2>
          <p className="text-sm text-muted-foreground">
            Las ven tus clientes en su área cuando van a pagar o a comprar
            créditos.
          </p>
        </div>
        {a.cuentasPago.length === 0 ? (
          <p className="text-sm text-amber-300">
            Todavía no hay cuentas. Agrega al menos una para que tus clientes
            sepan a dónde transferir.
          </p>
        ) : null}
        {a.cuentasPago.map((c, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_1.3fr_1.3fr_auto]"
          >
            <input
              className={claseCampo}
              placeholder="Banco (Popular, Qik…)"
              aria-label="Banco"
              value={c.banco}
              onChange={(e) => cuenta(i, "banco", e.target.value)}
            />
            <input
              className={claseCampo}
              placeholder="Tipo (ahorros…)"
              aria-label="Tipo de cuenta"
              value={c.tipo}
              onChange={(e) => cuenta(i, "tipo", e.target.value)}
            />
            <input
              className={claseCampo}
              placeholder="Número"
              aria-label="Número de cuenta"
              inputMode="numeric"
              value={c.numero}
              onChange={(e) => cuenta(i, "numero", e.target.value)}
            />
            <input
              className={claseCampo}
              placeholder="A nombre de"
              aria-label="Titular"
              value={c.titular}
              onChange={(e) => cuenta(i, "titular", e.target.value)}
            />
            <Boton
              variante="fantasma"
              aria-label="Quitar cuenta"
              onClick={() =>
                poner(
                  "cuentasPago",
                  a.cuentasPago.filter((_, j) => j !== i)
                )
              }
            >
              <Trash2 />
            </Boton>
          </div>
        ))}
        <Boton
          className="self-start"
          onClick={() =>
            poner("cuentasPago", [
              ...a.cuentasPago,
              { banco: "", tipo: "", numero: "", titular: "" },
            ])
          }
        >
          <Plus /> Agregar cuenta
        </Boton>
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">Paquetes de créditos del Estudio</h2>
          <p className="text-sm text-muted-foreground">
            1 crédito = US$0.01 de precio al cliente. Lo que el cliente paga
            (RD$) y lo que recibe al confirmar.
          </p>
        </div>
        {a.paquetesCreditos.map((p, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
          >
            <Campo etiqueta="Precio (RD$)">
              <input
                className={claseCampo}
                inputMode="numeric"
                value={p.precio || ""}
                onChange={(e) => paquete(i, "precio", e.target.value)}
              />
            </Campo>
            <Campo etiqueta="Créditos">
              <input
                className={claseCampo}
                inputMode="numeric"
                value={p.creditos || ""}
                onChange={(e) => paquete(i, "creditos", e.target.value)}
              />
            </Campo>
            <Boton
              variante="fantasma"
              aria-label="Quitar paquete"
              onClick={() =>
                poner(
                  "paquetesCreditos",
                  a.paquetesCreditos.filter((_, j) => j !== i)
                )
              }
            >
              <Trash2 />
            </Boton>
          </div>
        ))}
        <Boton
          className="self-start"
          onClick={() =>
            poner("paquetesCreditos", [
              ...a.paquetesCreditos,
              { precio: 0, creditos: 0 },
            ])
          }
        >
          <Plus /> Agregar paquete
        </Boton>
      </Tarjeta>

      <Tarjeta className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="font-semibold">Regalo de bienvenida del Estudio</h2>
          <p className="text-sm text-muted-foreground">
            Créditos que recibe cada persona la primera vez que entra con
            Google. 50 créditos alcanzan para 1 video de 5 segundos o 10
            imágenes y te cuestan ≈US$0.10 por persona en Higgsfield.
            {regalados !== null
              ? ` Ya se regalaron a ${regalados} de ${a.bienvenida.tope} personas.`
              : ""}
          </p>
        </div>
        <label className="flex items-center gap-3 sm:col-span-2">
          <input
            type="checkbox"
            className="size-5 accent-primary"
            checked={a.bienvenida.activo}
            onChange={(e) =>
              poner("bienvenida", { ...a.bienvenida, activo: e.target.checked })
            }
          />
          <span className="text-sm font-medium">
            {a.bienvenida.activo ? "Regalo activo" : "Regalo apagado"}
          </span>
        </label>
        <Campo etiqueta="Créditos por persona" ayuda="Máximo 1,000.">
          <input
            className={claseCampo}
            inputMode="numeric"
            value={a.bienvenida.creditos}
            onChange={(e) =>
              poner("bienvenida", {
                ...a.bienvenida,
                creditos: Math.min(
                  Number(e.target.value.replace(/\D/g, "")) || 0,
                  1000
                ),
              })
            }
          />
        </Campo>
        <Campo
          etiqueta="Hasta cuántas personas"
          ayuda="Al llegar al tope se apaga solo. Súbelo cuando quieras."
        >
          <input
            className={claseCampo}
            inputMode="numeric"
            value={a.bienvenida.tope}
            onChange={(e) =>
              poner("bienvenida", {
                ...a.bienvenida,
                tope: Number(e.target.value.replace(/\D/g, "")) || 0,
              })
            }
          />
        </Campo>
      </Tarjeta>

      <Tarjeta className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Negocio</h2>
        <Campo etiqueta="Meta de cobro del mes (RD$)">
          <input
            className={claseCampo}
            inputMode="numeric"
            value={a.metaMensual}
            onChange={(e) =>
              poner(
                "metaMensual",
                Number(e.target.value.replace(/\D/g, "")) || 0
              )
            }
          />
        </Campo>
        <Campo
          etiqueta="Máximo de clientes activos"
          ayuda="Hasta que haya equipo, limitar el volumen protege la reputación."
        >
          <input
            className={claseCampo}
            inputMode="numeric"
            value={a.capacidad}
            onChange={(e) =>
              poner("capacidad", Number(e.target.value.replace(/\D/g, "")) || 0)
            }
          />
        </Campo>
        <Campo
          etiqueta="Reglas de cobro"
          ayuda="Una por línea: «Hasta RD$10,000 | 100% antes de iniciar»."
          ancho
        >
          <textarea
            className={cn(claseCampo, "min-h-28")}
            value={reglas}
            onChange={(e) => setReglas(e.target.value)}
          />
        </Campo>
      </Tarjeta>

      <Tarjeta className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Portada</h2>
        <Campo etiqueta="Video del visor de la portada">
          <select
            className={claseCampo}
            value={a.portada}
            onChange={(e) => poner("portada", e.target.value)}
          >
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Servicio que hace de radiografía (único precio público)">
          <select
            className={claseCampo}
            value={a.radiografia.oferta}
            onChange={(e) =>
              poner("radiografia", { ...a.radiografia, oferta: e.target.value })
            }
          >
            {ofertas.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Etiqueta del precio">
          <input
            className={claseCampo}
            value={a.radiografia.etiqueta}
            onChange={(e) =>
              poner("radiografia", {
                ...a.radiografia,
                etiqueta: e.target.value,
              })
            }
          />
        </Campo>
        <Campo
          etiqueta="Línea bajo los botones"
          ayuda="Una por línea: «100% | personalizado»."
        >
          <textarea
            className={cn(claseCampo, "min-h-20")}
            value={prueba}
            onChange={(e) => setPrueba(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Texto de la radiografía" ancho>
          <textarea
            className={cn(claseCampo, "min-h-20")}
            value={a.radiografia.lead}
            onChange={(e) =>
              poner("radiografia", { ...a.radiografia, lead: e.target.value })
            }
          />
        </Campo>
        <Campo etiqueta="Condición bajo el precio" ancho>
          <textarea
            className={cn(claseCampo, "min-h-20")}
            value={a.radiografia.condicion}
            onChange={(e) =>
              poner("radiografia", {
                ...a.radiografia,
                condicion: e.target.value,
              })
            }
          />
        </Campo>
        <Campo
          etiqueta="Compromisos"
          ayuda="Una por línea: «icono | título | texto». Iconos: desde-cero, tuyo, manual."
          ancho
        >
          <textarea
            className={cn(claseCampo, "min-h-28")}
            value={compromisos}
            onChange={(e) => setCompromisos(e.target.value)}
          />
        </Campo>
        <Campo
          etiqueta="Pasos del proceso"
          ayuda="Una por línea: «Enfocar | texto»."
          ancho
        >
          <textarea
            className={cn(claseCampo, "min-h-28")}
            value={pasos}
            onChange={(e) => setPasos(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Último cuadro del catálogo: título">
          <input
            className={claseCampo}
            value={a.espacioLibre.titulo}
            onChange={(e) =>
              poner("espacioLibre", {
                ...a.espacioLibre,
                titulo: e.target.value,
              })
            }
          />
        </Campo>
        <Campo etiqueta="Último cuadro del catálogo: texto">
          <input
            className={claseCampo}
            value={a.espacioLibre.texto}
            onChange={(e) =>
              poner("espacioLibre", {
                ...a.espacioLibre,
                texto: e.target.value,
              })
            }
          />
        </Campo>
      </Tarjeta>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Boton variante="primario" type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar ajustes"}
        </Boton>
        <Aviso mensaje={mensaje} />
      </div>
    </form>
  )
}
