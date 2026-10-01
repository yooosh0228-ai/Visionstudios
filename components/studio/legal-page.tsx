import Link from "next/link"

/** Contenedor sencillo para las páginas legales (Privacidad y Términos). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Volver a 402 Vision Studios
      </Link>
      <h1 className="text-q-headline-md-semi-bold">{title}</h1>
      <p className="text-xs text-muted-foreground">
        Última actualización: {updated}
      </p>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/90 [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </main>
  )
}
