"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"

import { useAccount } from "@/generation/stores/account"
import type { AccountInfo } from "@/generation/stores/account"

const OWNER_MARKER = "studio.user"

/** Borra el historial local cuando entra otra persona en el mismo navegador. */
async function wipeLocalData(): Promise<void> {
  try {
    localStorage.clear()
  } catch {
    /* almacenamiento bloqueado */
  }
  await new Promise<void>((resolve) => {
    try {
      const request = indexedDB.deleteDatabase("studio")
      request.onsuccess = request.onerror = request.onblocked = () => resolve()
      setTimeout(resolve, 1500)
    } catch {
      resolve()
    }
  })
}

/**
 * Pone el saldo y los precios en el cliente antes de pintar el estudio y evita
 * que el historial guardado en este navegador se mezcle entre cuentas.
 */
export function AccountGate({
  userId,
  account,
  prices,
  children,
}: {
  userId: string
  account: AccountInfo
  prices: Record<string, number>
  children: ReactNode
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const marker = localStorage.getItem(OWNER_MARKER)
        if (marker && marker !== userId) {
          await wipeLocalData()
          try {
            localStorage.setItem(OWNER_MARKER, userId)
          } catch {
            /* sin almacenamiento */
          }
          window.location.reload()
          return
        }
        localStorage.setItem(OWNER_MARKER, userId)
      } catch {
        /* sin almacenamiento: el estudio igual funciona */
      }
      if (!alive) return
      useAccount.getState().hydrate(account, prices)
      setReady(true)
    })()
    return () => {
      alive = false
    }
    // Solo al montar: después el saldo lo mantiene el store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return ready ? children : null
}
