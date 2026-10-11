"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  cambiarEstadoProspecto,
  convertirEnCliente,
  moverEtapa,
  registrarPago,
  revisarPago,
} from "@/lib/vs/acciones-panel"
import {
  ETAPAS,
  ETAPA_LABEL,
  ESTADOS_PROSPECTO,
  ESTADO_PROSPECTO_LABEL,
  METODOS_PAGO,
  METODO_LABEL,
} from "@/lib/vs/types"
import type { Etapa, EstadoProspecto, MetodoPago } from "@/lib/vs/types"
import { formatoRD } from "@/lib/vs/cuentas"

import { Aviso, Boton, Hoja, claseCampo, useAccion } from "./ui"

function sumarDias(iso: string, dias: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Cambia el estado de un prospecto desde la lista. */
export function EstadoProspecto({
  id,
  estado,
}: {
  id: string
  estado: EstadoProspecto
}) {
  const { pendiente, mensaje, correr } = useAccion()
  return (
    <span className="inline-flex flex-col gap-1">
      <select
        aria-label="Estado del prospecto"
        className="h-9 rounded-full border border-border bg-background px-3 text-sm"
        value={estado}
        disabled={pendiente}
        onChange={(e) =>
          correr(() =>
            cambiarEstadoProspecto(id, {
              estado: e.target.value as EstadoProspecto,
            })
          )
        }
      >
        {ESTADOS_PROSPECTO.map((e) => (
          <option key={e} value={e}>
            {ESTADO_PROSPECTO_LABEL[e]}
          </option>
        ))}
      </select>
      <Aviso mensaje={mensaje} />
    </span>
  )
}

/** Mueve la fecha de la próxima acción unos días. */
export function Posponer({
  id,
  hoy,
  dias = 2,
}: {
  id: string
  hoy: string
  dias?: number
}) {
  const { pendiente, correr } = useAccion()
  return (
    <Boton
      tam="chico"
      variante="fantasma"
      disabled={pendiente}
      onClick={() =>
        correr(() =>
          cambiarEstadoProspecto(id, { fechaProxima: sumarDias(hoy, dias) })
        )
      }
    >
      +{dias} días
    </Boton>
  )
}

export function ConvertirEnCliente({ id }: { id: string }) {
  const router = useRouter()
  const { pendiente, mensaje, correr } = useAccion()
  return (
    <span className="inline-flex flex-col gap-1">
      <Boton
        tam="chico"
        variante="primario"
        disabled={pendiente}
        onClick={() =>
          correr(
            () => convertirEnCliente(id),
            undefined,
            (r) => r.ok && r.id && router.push(`/admin/clientes/${r.id}`)
          )
        }
      >
        {pendiente ? "Creando…" : "Hacerlo cliente"}
      </Boton>
      <Aviso mensaje={mensaje} />
    </span>
  )
}

/** Flechas para pasar un proyecto a la etapa anterior o siguiente. */
export function MoverEtapa({ id, etapa }: { id: string; etapa: Etapa }) {
  const { pendiente, mensaje, correr } = useAccion()
  const i = ETAPAS.indexOf(etapa)
  const antes = ETAPAS[i - 1]
  const despues = ETAPAS[i + 1]
  return (
    <span className="inline-flex flex-col gap-1">
      <span className="inline-flex gap-1">
        <Boton
          tam="chico"
          variante="suave"
          disabled={!antes || pendiente}
          aria-label={
            antes ? `Volver a ${ETAPA_LABEL[antes]}` : "Primera etapa"
          }
          onClick={() => antes && correr(() => moverEtapa(id, antes))}
        >
          <ChevronLeft />
        </Boton>
        <Boton
          tam="chico"
          variante="suave"
          disabled={!despues || pendiente}
          aria-label={
            despues ? `Pasar a ${ETAPA_LABEL[despues]}` : "Última etapa"
          }
          onClick={() => despues && correr(() => moverEtapa(id, despues))}
        >
          {despues ? ETAPA_LABEL[despues] : "Última etapa"}
          <ChevronRight />
        </Boton>
      </span>
      <Aviso mensaje={mensaje} />
    </span>
  )
}

/** Confirmar o rechazar un pago que reportó un cliente. */
export function RevisarPago({
  id,
  creditos,
}: {
  id: string
  creditos: number | null
}) {
  const { pendiente, mensaje, correr } = useAccion()
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex flex-wrap gap-1">
        <Boton
          tam="chico"
          variante="primario"
          disabled={pendiente}
          onClick={() =>
            correr(
              () => revisarPago(id, "confirmar"),
              creditos ? "Saldo recargado." : "Confirmado."
            )
          }
        >
          {creditos ? `Confirmar y cargar ${creditos} cr.` : "Entró: confirmar"}
        </Boton>
        <Boton
          tam="chico"
          variante="fantasma"
          disabled={pendiente}
          onClick={() =>
            correr(() => revisarPago(id, "rechazar"), "Rechazado.")
          }
        >
          No entró
        </Boton>
      </span>
      <Aviso mensaje={mensaje} />
    </span>
  )
}

/** El dueño anota un pago que ya vio entrar en el banco o en efectivo. */
export function RegistrarPago({
  cobroId,
  saldo,
  concepto,
}: {
  cobroId: string
  saldo: number
  concepto: string
}) {
  const [abierta, setAbierta] = useState(false)
  const [monto, setMonto] = useState("")
  const [metodo, setMetodo] = useState<MetodoPago>("popular")
  const [referencia, setReferencia] = useState("")
  const { pendiente, mensaje, correr, limpiar } = useAccion()
  return (
    <>
      <Boton
        tam="chico"
        variante="suave"
        onClick={() => {
          setMonto(saldo > 0 ? String(saldo) : "")
          setAbierta(true)
        }}
      >
        Registrar pago
      </Boton>
      <Hoja
        abierta={abierta}
        onCerrar={() => {
          limpiar()
          setAbierta(false)
        }}
        titulo="Registrar pago"
        descripcion={`${concepto} · falta ${formatoRD(saldo)}`}
        pie={
          <>
            <Boton
              variante="primario"
              disabled={pendiente}
              onClick={() =>
                correr(
                  () => registrarPago({ cobroId, monto, metodo, referencia }),
                  undefined,
                  (r) => r.ok && setAbierta(false)
                )
              }
            >
              {pendiente ? "Guardando…" : "Guardar pago"}
            </Boton>
            <Boton variante="fantasma" onClick={() => setAbierta(false)}>
              Cancelar
            </Boton>
            <div className="w-full">
              <Aviso mensaje={mensaje} />
            </div>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Regístralo solo cuando el dinero ya esté en Popular, Qik,
            Banreservas o en efectivo contado. Una captura de pantalla no es
            confirmación.
          </p>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Monto (RD$)
            <input
              className={claseCampo}
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Método
            <select
              className={claseCampo}
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as MetodoPago)}
            >
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>
                  {METODO_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Comprobante o referencia
            <input
              className={claseCampo}
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </label>
        </div>
      </Hoja>
    </>
  )
}
