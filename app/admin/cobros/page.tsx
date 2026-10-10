import Link from "next/link"

import { RegistrarPago, RevisarPago } from "@/components/panel/rapidas"
import { EditarRegistro } from "@/components/panel/registro"
import {
  Encabezado,
  Insignia,
  Kpi,
  Tarjeta,
  Vacio,
} from "@/components/panel/ui"
import { aColumnas } from "@/lib/vs/campos"
import {
  ESTADO_COBRO_LABEL,
  formatoFecha,
  formatoRD,
  hoyRD,
} from "@/lib/vs/cuentas"
import { panelDelDueno } from "@/lib/vs/panel-cache"
import { cobrosConCuenta, opcionesDe, resumenDe } from "@/lib/vs/resumen"
import { METODO_LABEL, TIPO_COBRO_LABEL } from "@/lib/vs/types"

export const metadata = { title: "Cobros" }

export default async function Cobros() {
  const p = await panelDelDueno()
  const hoy = hoyRD()
  const opciones = opcionesDe(p)
  const r = resumenDe(p, hoy)
  const cobros = cobrosConCuenta(p, hoy)
  const cliente = new Map(p.clientes.map((c) => [c.id, c.nombre]))
  const cobroPorId = new Map(cobros.map((c) => [c.id, c]))
  const pendientes = p.pagos.filter((x) => x.estado === "pendiente")
  const recientes = p.pagos.filter((x) => x.estado !== "pendiente").slice(0, 15)

  return (
    <>
      <Encabezado
        titulo="Cobros"
        texto="El trabajo no financia al cliente. Registra un pago solo cuando entre en Popular, Qik, Banreservas o efectivo contado: una captura de pantalla no es confirmación."
        acciones={
          <EditarRegistro
            entidad="cobro"
            variante="primario"
            opciones={opciones}
          >
            Nuevo cobro
          </EditarRegistro>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          etiqueta="Cobrado este mes"
          valor={formatoRD(r.cobradoMes)}
          tono="bien"
        />
        <Kpi
          etiqueta="Créditos vendidos este mes"
          valor={formatoRD(r.creditosMes)}
        />
        <Kpi
          etiqueta="Saldo por cobrar"
          valor={formatoRD(r.porCobrar)}
          tono={r.vencidos.length ? "mal" : undefined}
          nota={`${r.vencidos.length} vencido(s)`}
        />
        <Kpi
          etiqueta="Por confirmar"
          valor={String(pendientes.length)}
          tono={pendientes.length ? "atencion" : undefined}
        />
      </div>

      <Tarjeta className="flex flex-col gap-3">
        <h2 className="font-semibold">Pagos que reportaron los clientes</h2>
        {pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nada esperando. Cuando un cliente avise de una transferencia desde
            su área, aparece aquí.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {pendientes.map((x) => {
              const cobro = x.cobroId ? cobroPorId.get(x.cobroId) : null
              return (
                <li
                  key={x.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {formatoRD(x.monto)} · {METODO_LABEL[x.metodo]}
                      {x.tipo === "creditos" ? (
                        <Insignia tono="info">
                          Recarga de {x.creditos} créditos
                        </Insignia>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {x.tipo === "creditos"
                        ? x.email
                        : `${cobro?.cliente ?? (x.clienteId ? cliente.get(x.clienteId) : "")} · ${cobro?.concepto ?? ""}`}{" "}
                      · Ref. {x.referencia || "—"} · {formatoFecha(x.createdAt)}
                    </p>
                  </div>
                  <RevisarPago
                    id={x.id}
                    creditos={x.tipo === "creditos" ? x.creditos : null}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-3">
        <h2 className="font-semibold">Libro de cobros</h2>
        {cobros.length === 0 ? (
          <Vacio
            titulo="No hay cobros registrados."
            texto="El calendario de producción no empieza hasta registrar el depósito confirmado."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {cobros.map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    <Link
                      href={`/admin/clientes/${k.clienteId}`}
                      className="hover:underline"
                    >
                      {k.cliente}
                    </Link>{" "}
                    · {k.concepto}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {TIPO_COBRO_LABEL[k.tipo]} · contratado{" "}
                    {formatoRD(k.precio)} · recibido{" "}
                    {formatoRD(k.cuenta.recibido)}
                    {k.cuenta.porConfirmar
                      ? ` · por confirmar ${formatoRD(k.cuenta.porConfirmar)}`
                      : ""}{" "}
                    · depósito {formatoRD(k.deposito)}
                    {k.vencimiento
                      ? ` · vence ${formatoFecha(k.vencimiento)}`
                      : ""}
                  </p>
                </div>
                <Insignia
                  tono={
                    k.cuenta.estado === "pagado"
                      ? "bien"
                      : k.cuenta.estado === "vencido"
                        ? "mal"
                        : k.cuenta.estado === "cancelado"
                          ? "neutro"
                          : "atencion"
                  }
                >
                  {ESTADO_COBRO_LABEL[k.cuenta.estado]}
                  {k.cuenta.saldo > 0 ? ` · ${formatoRD(k.cuenta.saldo)}` : ""}
                </Insignia>
                <span className="flex gap-1">
                  {k.cuenta.saldo > 0 ? (
                    <RegistrarPago
                      cobroId={k.id}
                      saldo={k.cuenta.saldo}
                      concepto={k.concepto}
                    />
                  ) : null}
                  <EditarRegistro
                    entidad="cobro"
                    id={k.id}
                    valores={aColumnas(k)}
                    opciones={opciones}
                    tam="chico"
                    variante="fantasma"
                  >
                    Editar
                  </EditarRegistro>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Tarjeta className="flex flex-col gap-3">
          <h2 className="font-semibold">Reglas de cobro</h2>
          <p className="text-sm text-muted-foreground">
            Protegen tu tiempo y también la confianza del cliente. El depósito
            de un cobro nuevo se calcula con ellas.
          </p>
          <dl className="flex flex-col gap-2 text-sm">
            {p.ajustes.reglasCobro.map(([a, b]) => (
              <div
                key={a}
                className="flex flex-col rounded-xl bg-background/40 p-3"
              >
                <dt className="font-medium">{a}</dt>
                <dd className="text-muted-foreground">{b}</dd>
              </div>
            ))}
          </dl>
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-3">
          <h2 className="font-semibold">Últimos pagos revisados</h2>
          {recientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay pagos.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {recientes.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-2">
                  <span className="tabular-nums">{formatoRD(x.monto)}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {x.tipo === "creditos"
                      ? `Créditos · ${x.email}`
                      : (cobroPorId.get(x.cobroId ?? "")?.cliente ?? "")}{" "}
                    · {formatoFecha(x.revisadoAt ?? x.createdAt)}
                  </span>
                  <Insignia tono={x.estado === "confirmado" ? "bien" : "mal"}>
                    {x.estado}
                  </Insignia>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  )
}
