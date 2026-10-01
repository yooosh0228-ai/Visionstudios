"use client"

import Link from "next/link"
import { useState } from "react"
import { LogOut, ShieldCheck, Wallet } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { signOut } from "@/generation/account-actions"
import { DEFAULT_TOPUP_URL, formatCredits } from "@/generation/billing"
import { useAccount } from "@/generation/stores/account"

const TOPUP_URL = process.env.NEXT_PUBLIC_TOPUP_URL || DEFAULT_TOPUP_URL

/** Cuenta: quién entró, cuánto saldo tiene, cómo recargar y cerrar sesión. */
export function AccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const account = useAccount((s) => s.account)
  const [busy, setBusy] = useState(false)

  const leave = async () => {
    setBusy(true)
    try {
      await signOut()
    } finally {
      window.location.reload()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Wallet className="mr-2 size-5 shrink-0 text-q-icon-secondary" />{" "}
            Mi cuenta
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <p className="truncate text-sm text-muted-foreground">
              {account?.email}
            </p>
            {account?.isOwner ? (
              <p className="text-sm">
                Cuenta de dueño: tus generaciones no cobran créditos.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-xs tracking-wide text-muted-foreground uppercase">
                  Saldo
                </span>
                <span className="text-3xl font-semibold tabular-nums">
                  {formatCredits(account?.credits ?? 0)}{" "}
                  <span className="text-base font-medium text-muted-foreground">
                    créditos
                  </span>
                </span>
                <p className="pt-1 text-sm text-muted-foreground">
                  ¿Necesitas más? Escríbenos y te los cargamos a tu cuenta.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {account?.isOwner ? (
                <Link
                  href="/admin"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  <ShieldCheck /> Panel de dueño
                </Link>
              ) : (
                <a
                  href={TOPUP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  <Wallet /> Recargar créditos
                </a>
              )}
              <Button
                variant="ghost"
                size="lg"
                disabled={busy}
                onClick={() => void leave()}
              >
                <LogOut /> Cerrar sesión
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
