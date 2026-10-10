"use client"

import { useState } from "react"
import { ArrowLeft, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCredits } from "@/generation/billing"
import { cn } from "@/lib/utils"
import type { Field, ServiceDef } from "@/servicios/catalog"

export type FormValues = Record<string, string | string[]>

const textareaClass =
  "min-h-28 w-full resize-y rounded-lg border border-input bg-white/5 px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function Chips({
  field,
  value,
  onChange,
}: {
  field: Field
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
}) {
  const multi = field.kind === "multi"
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : [])
  return (
    <div role={multi ? "group" : "radiogroup"} aria-label={field.label} className="flex flex-wrap gap-2">
      {(field.options ?? []).map((option) => {
        const on = selected.has(option.value)
        return (
          <button
            key={option.value}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              on
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
            onClick={() => {
              if (!multi) return onChange(option.value)
              const next = new Set(selected)
              if (on) next.delete(option.value)
              else next.add(option.value)
              onChange([...next])
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** Formulario de un servicio: muestra el precio y pide confirmar antes de cobrar. */
export function ServiceForm({
  service,
  price,
  isOwner,
  balance,
  busy,
  error,
  initial,
  submitLabel,
  onBack,
  onSubmit,
}: {
  service: ServiceDef
  price: number | null
  isOwner: boolean
  balance: number
  busy: boolean
  error: string | null
  initial?: FormValues
  submitLabel?: string
  onBack: () => void
  onSubmit: (values: FormValues) => void
}) {
  const [values, setValues] = useState<FormValues>(initial ?? {})
  const [confirming, setConfirming] = useState(false)
  const set = (name: string, value: string | string[]) => {
    setConfirming(false)
    setValues((v) => ({ ...v, [name]: value }))
  }

  const missing = service.fields.filter((f) => {
    if (!f.required) return false
    const v = values[f.name]
    return Array.isArray(v) ? v.length === 0 : !v || !String(v).trim()
  })
  const short = !isOwner && price !== null && balance < price
  const unpriced = !isOwner && price === null

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        if (missing.length || short || unpriced || busy) return
        if (!confirming) return setConfirming(true)
        onSubmit(values)
      }}
    >
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Servicios
        </button>
        <h1 className="text-q-headline-md-semi-bold">{service.name}</h1>
        <p className="text-sm text-muted-foreground">{service.deliverable}</p>
      </div>

      <div className="flex flex-col gap-5">
        {service.fields.map((field) => {
          const id = `f-${service.id}-${field.name}`
          const value = values[field.name]
          return (
            <div key={field.name} className="flex flex-col gap-2">
              <label htmlFor={id} className="text-sm font-medium">
                {field.label}
                {field.required ? <span className="text-primary"> *</span> : null}
              </label>
              {field.kind === "text" ? (
                <Input
                  id={id}
                  value={typeof value === "string" ? value : ""}
                  maxLength={field.max}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                />
              ) : field.kind === "textarea" ? (
                <textarea
                  id={id}
                  className={textareaClass}
                  value={typeof value === "string" ? value : ""}
                  maxLength={field.max}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                />
              ) : (
                <Chips field={field} value={value} onChange={(v) => set(field.name, v)} />
              )}
              {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
            </div>
          )
        })}
      </div>

      <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 border-t border-border bg-background/95 px-1 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            {isOwner ? (
              <span className="text-muted-foreground">Cuenta de dueño: no se cobran créditos.</span>
            ) : price === null ? (
              <span className="text-destructive">Este servicio todavía no tiene precio.</span>
            ) : (
              <>
                Precio: <strong className="tabular-nums">{formatCredits(price)} créditos</strong>
                <span className="text-muted-foreground"> · tienes {formatCredits(balance)}</span>
              </>
            )}
          </p>
          <div className="flex gap-2">
            {confirming ? (
              <Button type="button" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                Cambiar algo
              </Button>
            ) : null}
            <Button type="submit" size="lg" disabled={busy || missing.length > 0 || short || unpriced}>
              <Sparkles />
              {busy
                ? "Enviando…"
                : confirming
                  ? isOwner || price === null
                    ? "Confirmar"
                    : `Confirmar y usar ${formatCredits(price)} créditos`
                  : (submitLabel ?? "Preparar")}
            </Button>
          </div>
        </div>
        {missing.length ? (
          <p className="text-xs text-muted-foreground">
            Falta: {missing.map((f) => f.label).join(", ")}
          </p>
        ) : short ? (
          <p className="text-xs text-destructive">
            No te alcanzan los créditos. Recarga para usar este servicio.
          </p>
        ) : confirming ? (
          <p className="text-xs text-muted-foreground">
            Revisa los datos. Si el resultado no sale, se te devuelven los créditos solos.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  )
}
