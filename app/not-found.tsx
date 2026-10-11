import Link from "next/link"

import { BrandMark } from "@/components/studio/brand-mark"

export default function NoEncontrada() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <BrandMark className="w-16" title="Vision Studios" />
      <h1 className="text-2xl font-semibold">Esta toma no existe.</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La página que buscas se movió o nunca estuvo aquí.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        Volver a Vision Studios
      </Link>
    </main>
  )
}
