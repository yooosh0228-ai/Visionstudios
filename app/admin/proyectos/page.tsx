import Link from "next/link"

import { MoverEtapa } from "@/components/panel/rapidas"
import { EditarRegistro } from "@/components/panel/registro"
import { Encabezado, Insignia, Tarjeta } from "@/components/panel/ui"
import { aColumnas } from "@/lib/vs/campos"
import { formatoFecha, formatoRD, hoyRD } from "@/lib/vs/cuentas"
import { panelDelDueno } from "@/lib/vs/panel-cache"
import { cobrosConCuenta, opcionesDe } from "@/lib/vs/resumen"
import { ETAPAS, ETAPA_LABEL } from "@/lib/vs/types"
import type { Proyecto } from "@/lib/vs/types"

export const metadata = { title: "Proyectos" }

export default async function Proyectos({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>
}) {
  const { ver } = await searchParams
  const p = await panelDelDueno()
  const hoy = hoyRD()
  const opciones = opcionesDe(p)
  const cliente = new Map(p.clientes.map((c) => [c.id, c.nombre]))
  const cobros = cobrosConCuenta(p, hoy)
  const verCerrados = ver === "cerrados"
  const lista = p.proyectos.filter((x) => x.cerrado === verCerrados)

  const tarjeta = (x: Proyecto) => {
    const saldo = cobros
      .filter((k) => k.proyectoId === x.id)
      .reduce((a, k) => a + k.cuenta.saldo, 0)
    const cambios = p.entregables.filter(
      (e) => e.proyectoId === x.id && e.estado === "cambios"
    ).length
    return (
      <Tarjeta key={x.id} className="flex flex-col gap-2 p-3">
        <Link
          href={`/admin/clientes/${x.clienteId}`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {cliente.get(x.clienteId)}
        </Link>
        <p className="font-medium">{x.nombre}</p>
        <div className="flex flex-wrap gap-1">
          {x.fechaEntrega ? (
            <Insignia
              tono={
                x.fechaEntrega < hoy && x.etapa !== "entrega" ? "mal" : "neutro"
              }
            >
              {formatoFecha(x.fechaEntrega)}
            </Insignia>
          ) : null}
          {saldo > 0 ? (
            <Insignia tono="atencion">Saldo {formatoRD(saldo)}</Insignia>
          ) : null}
          {cambios ? (
            <Insignia tono="atencion">{cambios} cambio(s) pedidos</Insignia>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <MoverEtapa id={x.id} etapa={x.etapa} />
          <EditarRegistro
            entidad="proyecto"
            id={x.id}
            valores={aColumnas(x)}
            opciones={opciones}
            tam="chico"
            variante="fantasma"
          >
            Editar
          </EditarRegistro>
        </div>
      </Tarjeta>
    )
  }

  return (
    <>
      <Encabezado
        titulo="Proyectos"
        texto="Un proyecto tiene una etapa visible. El cliente ve la misma etapa en su área. El saldo pendiente retiene la entrega final."
        acciones={
          <EditarRegistro
            entidad="proyecto"
            variante="primario"
            opciones={opciones}
          >
            Nuevo proyecto
          </EditarRegistro>
        }
      />
      <div className="flex gap-2">
        <Link
          href="/admin/proyectos"
          className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ${!verCerrados ? "bg-foreground text-background" : "border border-border"}`}
        >
          Abiertos
        </Link>
        <Link
          href="/admin/proyectos?ver=cerrados"
          className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ${verCerrados ? "bg-foreground text-background" : "border border-border"}`}
        >
          Cerrados
        </Link>
      </div>

      {/* Teléfono: solo las etapas que tienen algo, una debajo de otra. */}
      <div className="flex flex-col gap-4 md:hidden">
        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay proyectos aquí.
          </p>
        ) : null}
        {ETAPAS.filter((etapa) => lista.some((x) => x.etapa === etapa)).map(
          (etapa) => {
            const aqui = lista.filter((x) => x.etapa === etapa)
            return (
              <section
                key={etapa}
                aria-labelledby={`m-${etapa}`}
                className="flex flex-col gap-2"
              >
                <h2
                  id={`m-${etapa}`}
                  className="flex items-center justify-between text-sm font-semibold"
                >
                  {ETAPA_LABEL[etapa]}{" "}
                  <span className="text-muted-foreground tabular-nums">
                    {aqui.length}
                  </span>
                </h2>
                {aqui.map(tarjeta)}
              </section>
            )
          }
        )}
      </div>

      {/* Tablet y computadora: el tablero completo, con desplazamiento lateral. */}
      <div className="-mx-8 hidden snap-x snap-mandatory scroll-px-8 gap-3 overflow-x-auto px-8 pb-2 md:flex">
        {ETAPAS.map((etapa) => {
          const aqui = lista.filter((x) => x.etapa === etapa)
          return (
            <section
              key={etapa}
              id={etapa}
              aria-labelledby={`t-${etapa}`}
              className="flex w-[280px] shrink-0 snap-start flex-col gap-2"
            >
              <h2
                id={`t-${etapa}`}
                className="flex items-center justify-between px-1 text-sm font-semibold"
              >
                {ETAPA_LABEL[etapa]}{" "}
                <span className="text-muted-foreground tabular-nums">
                  {aqui.length}
                </span>
              </h2>
              <div className="flex min-h-24 flex-col gap-2 rounded-2xl bg-muted/30 p-2">
                {aqui.map(tarjeta)}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
