"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Copia un texto al portapapeles y lo confirma un momento. */
export function CopyButton({
  text,
  label = "Copiar",
  size = "sm",
}: {
  text: string
  label?: string
  size?: "sm" | "xs" | "default"
}) {
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setFailed(false)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          setFailed(true)
        }
      }}
    >
      {done ? <Check /> : <Copy />}
      {failed ? "No se pudo copiar" : done ? "Copiado" : label}
    </Button>
  )
}
