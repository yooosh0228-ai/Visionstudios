"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  adjustCredits,
  refundStuckGeneration,
  setModelPrice,
} from "@/generation/admin-actions"
import type { AdminResult } from "@/generation/admin-actions"
import { PRICE_UNIT_LABEL, formatCredits } from "@/generation/billing"
import type { PriceUnit } from "@/generation/billing"

export type AdminAccount = {
  userId: string
  email: string
  credits: number
  createdAt: string
}
export type AdminModel = {
  id: string
  label: string
  surface: string
  unit: PriceUnit
  price: number | null
}
export type AdminMovement = {
  id: number
  email: string
  delta: number
  balanceAfter: number
  reason: string
  note: string | null
  createdAt: string
}
export type AdminPending = {
  id: string
  email: string
  modelId: string
  cost: number
  status: string
  createdAt: string
}

const REASONS: Record<string, string> = {
  topup: "Recarga",
  generation: "Generación",
  refund: "Reembolso",
  adjustment: "Ajuste",
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}

/** Corre una acción del dueño, muestra el resultado y recarga los datos. */
function useAdminAction() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const run = (action: () => Promise<AdminResult>, okMessage: string) =>
    start(async () => {
      setMessage(null)
      const result = await action()
      setFailed(!result.ok)
      setMessage(result.ok ? okMessage : result.message)
      if (result.ok) router.refresh()
    })
  return { pending, message, failed, run }
}

function Status({ message, failed }: { message: string | null; failed: boolean }) {
  if (!message) return null
  return (
    <span
      role={failed ? "alert" : "status"}
      className={failed ? "text-xs text-destructive" : "text-xs text-primary"}
    >
      {message}
    </span>
  )
}

function AccountRow({ account }: { account: AdminAccount }) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const { pending, message, failed, run } = useAdminAction()
  return (
    <tr className="border-t border-border align-top">
      <td className="max-w-56 truncate py-2 pr-3">{account.email}</td>
      <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
        {formatCredits(account.credits)}
      </td>
      <td className="py-2">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            run(
              () =>
                adjustCredits({
                  userId: account.userId,
                  credits: amount,
                  note,
                }),
              "Listo."
            )
            setAmount("")
            setNote("")
          }}
        >
          <Input
            className="w-28"
            inputMode="decimal"
            placeholder="± créditos"
            aria-label={`Créditos a cargar a ${account.email}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            className="w-44"
            placeholder="Nota (ej. pago por transferencia)"
            aria-label={`Nota para ${account.email}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={pending || !amount.trim()}>
            Aplicar
          </Button>
          <Status message={message} failed={failed} />
        </form>
      </td>
    </tr>
  )
}

function ModelRow({ model }: { model: AdminModel }) {
  const [price, setPrice] = useState(model.price === null ? "" : String(model.price))
  const { pending, message, failed, run } = useAdminAction()
  return (
    <tr className="border-t border-border">
      <td className="py-2 pr-3">
        {model.label}
        <span className="ml-2 text-xs text-muted-foreground">{model.surface}</span>
      </td>
      <td className="py-2">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            run(
              () => setModelPrice({ modelId: model.id, credits: price }),
              price.trim() ? "Guardado." : "Precio quitado."
            )
          }}
        >
          <Input
            className="w-28"
            inputMode="decimal"
            placeholder="Sin precio"
            aria-label={`Precio de ${model.label} en créditos`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">
            créditos {PRICE_UNIT_LABEL[model.unit]}
          </span>
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Guardar
          </Button>
          {model.price === null ? (
            <span className="text-xs text-muted-foreground">
              Los clientes no pueden usarlo todavía
            </span>
          ) : null}
          <Status message={message} failed={failed} />
        </form>
      </td>
    </tr>
  )
}

function PendingRow({ item }: { item: AdminPending }) {
  const { pending, message, failed, run } = useAdminAction()
  return (
    <tr className="border-t border-border">
      <td className="py-2 pr-3 whitespace-nowrap">{when(item.createdAt)}</td>
      <td className="max-w-48 truncate py-2 pr-3">{item.email}</td>
      <td className="py-2 pr-3">{item.modelId}</td>
      <td className="py-2 pr-3 tabular-nums">{formatCredits(item.cost)}</td>
      <td className="py-2 pr-3">
        {item.status === "unconfirmed" ? "Sin confirmar" : "Cobrada sin enviar"}
      </td>
      <td className="flex items-center gap-2 py-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(
              () => refundStuckGeneration({ generationId: item.id }),
              "Devuelto."
            )
          }
        >
          Devolver créditos
        </Button>
        <Status message={message} failed={failed} />
      </td>
    </tr>
  )
}

export function AdminPanel({
  ownerEmail,
  accounts,
  models,
  movements,
  pending,
}: {
  ownerEmail: string
  accounts: AdminAccount[]
  models: AdminModel[]
  movements: AdminMovement[]
  pending: AdminPending[]
}) {
  const unpriced = models.filter((m) => m.price === null).length
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-10 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-q-headline-md-semi-bold">Panel de dueño</h1>
          <p className="text-sm text-muted-foreground">{ownerEmail}</p>
        </div>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver al estudio
        </Link>
      </header>

      {pending.length > 0 ? (
        <Section
          title="Por revisar"
          hint="Cobros que no llegaron a confirmarse con Higgsfield. Revisa tu historial en Higgsfield y devuelve los créditos si no se generó."
        >
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="pb-1 font-medium">Fecha</th>
                <th className="pb-1 font-medium">Cliente</th>
                <th className="pb-1 font-medium">Modelo</th>
                <th className="pb-1 font-medium">Créditos</th>
                <th className="pb-1 font-medium">Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.map((item) => (
                <PendingRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}

      <Section
        title="Clientes"
        hint="Cuando un cliente te pague, escribe cuántos créditos le das y aplica. Usa un número negativo para descontar."
      >
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay cuentas. Aparecen solas cuando alguien entra con Google.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="pb-1 font-medium">Correo</th>
                <th className="pb-1 font-medium">Saldo</th>
                <th className="pb-1 font-medium">Recargar o ajustar</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <AccountRow key={account.userId} account={account} />
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section
        title="Precios por modelo"
        hint={`Precio en créditos en la unidad que indica cada fila: por segundo de video (se multiplica por la duración que pida el cliente), por imagen (se multiplica por la cantidad) o por generación. Ponlo según la configuración más cara del modelo (resolución, audio) para no cobrar de menos. ${
          unpriced > 0
            ? `${unpriced} de ${models.length} modelos aún no tienen precio y los clientes no los pueden usar.`
            : ""
        }`}
      >
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="pb-1 font-medium">Modelo</th>
              <th className="pb-1 font-medium">Créditos</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <ModelRow key={model.id} model={model} />
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Últimos movimientos">
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="pb-1 font-medium">Fecha</th>
                <th className="pb-1 font-medium">Cliente</th>
                <th className="pb-1 font-medium">Tipo</th>
                <th className="pb-1 font-medium">Créditos</th>
                <th className="pb-1 font-medium">Saldo</th>
                <th className="pb-1 font-medium">Nota</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="py-2 pr-3 whitespace-nowrap">{when(m.createdAt)}</td>
                  <td className="max-w-48 truncate py-2 pr-3">{m.email}</td>
                  <td className="py-2 pr-3">{REASONS[m.reason] ?? m.reason}</td>
                  <td className="py-2 pr-3 tabular-nums">
                    {m.delta > 0 ? "+" : ""}
                    {formatCredits(m.delta)}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">
                    {formatCredits(m.balanceAfter)}
                  </td>
                  <td className="py-2 text-muted-foreground">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </main>
  )
}
