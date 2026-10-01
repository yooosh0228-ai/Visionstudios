"use client"

import { create } from "zustand"

import { getBalance } from "../account-actions"

export type AccountInfo = { email: string; credits: number; isOwner: boolean }

type AccountState = {
  account: AccountInfo | null
  prices: Record<string, number>
  hydrate: (account: AccountInfo, prices: Record<string, number>) => void
  setCredits: (credits: number) => void
  refresh: () => Promise<void>
}

/** Saldo y precios que ve la pantalla. La verdad vive en el servidor. */
export const useAccount = create<AccountState>((set) => ({
  account: null,
  prices: {},
  hydrate: (account, prices) => set({ account, prices }),
  setCredits: (credits) =>
    set((state) =>
      state.account ? { account: { ...state.account, credits } } : state
    ),
  refresh: async () => {
    try {
      const credits = await getBalance()
      if (credits !== null)
        set((state) =>
          state.account ? { account: { ...state.account, credits } } : state
        )
    } catch {
      /* se vuelve a leer en la próxima acción */
    }
  },
}))
