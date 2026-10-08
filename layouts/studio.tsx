"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ComponentProps } from "react"
import { Compass, Folder, Menu } from "lucide-react"

import { StudioPromptBox } from "@/components/studio/studio-prompt-box"
import { BrandMark } from "@/components/studio/brand-mark"
import {
  ExamplePresets,
  HERO_ART,
  TEMPLATES,
  type TemplateItem,
} from "@/components/studio/template-picker"
import { HeroComposition } from "@/components/studio/hero-composition"
import { AccountDialog } from "@/components/studio/account-dialog"
import {
  MyProjects,
  type MyProjectsProject,
} from "@/components/studio/my-projects"
import { StudioSidebar, type StudioView } from "@/components/studio/sidebar"
import { UserGenerations } from "@/components/studio/user-generations"
import type { GalleryItem } from "@/components/studio/gallery/gallery-types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { reconcileMyGenerations } from "@/generation/actions"
import { affordability, formatCredits } from "@/generation/billing"
import { useAccount } from "@/generation/stores/account"
import { MODELS, getModel, parseSettings } from "@/generation/catalog"
import type {
  GenerationPlane,
  MediaItem,
  MediaRole,
  Surface,
} from "@/generation/catalog"
import {
  changeImageRole,
  groupMedia,
  inferInputMode,
  inputRoles,
  mergeMedia,
  mergeReferences,
} from "@/generation/catalog/media-inputs"
import { toPlatform } from "@/generation/to-platform"
import { useActive } from "@/generation/stores/active"
import { useSettings } from "@/generation/stores/settings"
import {
  runToGalleryItems,
  runToLibraryItems,
} from "@/lib/studio/gallery-items"
import { useProjects } from "@/lib/studio/projects"
import {
  uploadAsset,
  useUploads,
  type AssetSelection,
} from "@/lib/studio/uploads"
import { useRuns } from "@/lib/studio/use-runs"
import { useDevice } from "@/lib/studio/use-device"
import { cn } from "@/lib/utils"

/**
 * StudioTemplate — the full creative workspace: projects-first sidebar, hero,
 * the floating prompt dock, Explore / My Projects, and the edge-to-edge
 * generations feed. Generation goes through the model catalog and the
 * platform server actions; history and projects live in the browser.
 *
 * Keep the six structural parts when adapting (see AGENTS.md): sidebar,
 * glow + dot-field atmosphere, HeroComposition, StudioPromptBox, the
 * Explore / My Projects section, and the UserGenerations feed.
 */

// Studio art until the user has three finished outputs of their own.
const HERO_FALLBACKS = HERO_ART

// Señal green glow over Tinta, per the 402 Vision Studios palette.
const HERO_GLOW =
  "radial-gradient(60% 80% at 50% 0%, rgba(53,179,126,0.16) 0%, rgba(53,179,126,0.05) 42%, transparent 72%)"
const HERO_DOTS = "radial-gradient(rgba(234,236,234,0.18) 1px, transparent 1px)"
const HERO_DOTS_MASK =
  "radial-gradient(55% 70% at 50% 0%, #000 0%, rgba(0,0,0,0.35) 45%, transparent 75%)"

type DockProps = Omit<
  ComponentProps<typeof StudioPromptBox>,
  "className" | "skin"
>

function heroImages(items: GalleryItem[]): readonly [string, string, string] {
  const ready = items
    .filter((i) => i.status === "ready" && i.src !== "")
    .slice(0, 3)
    .map((i) => i.src)
  return [
    ready[0] ?? HERO_FALLBACKS[0],
    ready[1] ?? HERO_FALLBACKS[1],
    ready[2] ?? HERO_FALLBACKS[2],
  ]
}

function HomeState({
  title,
  phone,
  items,
  projects,
  dock,
  onCreateProject,
  onOpenAll,
  onOpenProject,
  onUseTemplate,
}: {
  title: string
  phone: boolean
  items: GalleryItem[]
  projects: MyProjectsProject[]
  dock: DockProps
  onCreateProject: (name: string) => void
  onOpenAll: () => void
  onOpenProject: (project: MyProjectsProject) => void
  onUseTemplate: (template: TemplateItem) => void
}) {
  const [tab, setTab] = useState("explore")
  const promptRef = useRef<HTMLDivElement>(null)
  const images = useMemo(() => heroImages(items), [items])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        style={{
          backgroundImage: HERO_DOTS,
          backgroundSize: "14px 14px",
          maskImage: HERO_DOTS_MASK,
          WebkitMaskImage: HERO_DOTS_MASK,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        style={{ backgroundImage: HERO_GLOW }}
      />

      <div
        className={cn(
          "relative flex w-full flex-col items-center gap-10 px-4 pb-[max(4rem,env(safe-area-inset-bottom))] sm:gap-12 sm:px-6",
          phone ? "pt-20" : "pt-10 lg:pt-16"
        )}
      >
        <div
          ref={promptRef}
          className="flex w-full min-w-0 flex-col items-center gap-8"
        >
          <div className="flex flex-col items-center gap-5">
            <HeroComposition
              images={images}
              alt="Trabajo reciente de Vision Studios"
            />
            <h1 className="max-w-[640px] text-center text-[28px] leading-[1.1] font-bold tracking-tight text-balance uppercase sm:text-q-accent-lg-bold">
              {title}
            </h1>
          </div>
          <StudioPromptBox {...dock} />
        </div>

        <div className="flex w-full max-w-[900px] flex-col items-start gap-5">
          <Tabs
            variant="segmented"
            shape="pill"
            value={tab}
            onValueChange={(v) => setTab(String(v))}
          >
            <TabsList>
              <TabsTrigger value="explore" start={<Compass />}>
                Explorar
              </TabsTrigger>
              <TabsTrigger value="projects" start={<Folder />}>
                Mis proyectos
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div key={tab} className="w-full animate-in duration-300 fade-in-0">
            {tab === "projects" ? (
              <MyProjects
                projects={projects}
                generations={items}
                onCreateProject={onCreateProject}
                onOpenAllGenerations={onOpenAll}
                onOpenProject={onOpenProject}
              />
            ) : (
              <ExamplePresets
                items={TEMPLATES}
                onUse={(t) => {
                  onUseTemplate(t)
                  promptRef.current?.scrollIntoView({
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)"
                    ).matches
                      ? "auto"
                      : "smooth",
                    block: "center",
                  })
                }}
                className="w-full"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedState({
  phone,
  items,
  previewItems,
  title,
  dock,
  onDelete,
}: {
  phone: boolean
  items: GalleryItem[]
  previewItems: GalleryItem[]
  title: string
  dock: DockProps
  onDelete: (item: GalleryItem) => void
}) {
  const images = useMemo(() => heroImages(previewItems), [previewItems])
  const dockRef = useRef<HTMLDivElement>(null)
  const [dockHeight, setDockHeight] = useState(180)
  useEffect(() => {
    const node = dockRef.current
    if (!node) return
    const observer = new ResizeObserver(() =>
      setDockHeight(node.getBoundingClientRect().height)
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col px-2 sm:px-4",
          phone ? "pt-[calc(4.25rem+env(safe-area-inset-top))]" : "pt-4"
        )}
        style={{ paddingBottom: dockHeight + 24 }}
      >
        <UserGenerations
          items={items}
          title={title}
          onDelete={onDelete}
          emptyState={{
            images,
            title:
              title === "Todas las generaciones"
                ? "Todavía no hay generaciones"
                : `Todavía no hay nada en ${title}`,
            description:
              "Escribe tu idea o escoge un ejemplo en Inicio y genera la primera toma.",
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-2 pt-24 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
        }}
      >
        <div ref={dockRef} className="w-full max-w-[900px]">
          <StudioPromptBox
            {...dock}
            skin="glass"
            className="pointer-events-auto w-full"
          />
        </div>
      </div>
    </div>
  )
}

export interface StudioTemplateProps {
  /** Product name in the sidebar header. */
  title?: string
  /** Hero headline above the dock. */
  headline?: string
}

export function StudioTemplate({
  title = "Vision Studios",
  headline = "Escribe tu idea y conviértela en imagen o video",
}: StudioTemplateProps) {
  const [view, setView] = useState<StudioView>({ kind: "home" })
  // El menú lateral se acomoda solo al dispositivo: cajón en el teléfono,
  // iconos en la tablet y abierto en la computadora. Si la persona lo abre o
  // lo contrae a mano, esa elección manda.
  const device = useDevice()
  const phone = device.tipo === "telefono"
  const [collapsedChoice, setCollapsedChoice] = useState<boolean | null>(null)
  const collapsed = collapsedChoice ?? device.tipo === "tablet"
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerVisible = phone && drawerOpen
  const [prompt, setPrompt] = useState("")
  const [media, setMedia] = useState<MediaItem[]>([])
  const [accountOpen, setAccountOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const surface = useActive((s) => s.surface)
  const modelId = useActive((s) => s.model)
  const setActiveModel = useActive((s) => s.setModel)
  const settingsByModel = useSettings((s) => s.byModel)
  const setSetting = useSettings((s) => s.set)
  const projectsStore = useProjects()
  const uploads = useUploads((s) => s.items)
  const runs = useRuns()
  const account = useAccount((s) => s.account)
  const prices = useAccount((s) => s.prices)

  const surfaces = useMemo(
    () =>
      (["video", "image"] as Surface[]).filter((s) =>
        MODELS.some((m) => m.surface === s)
      ),
    []
  )
  const models = useMemo(
    () => MODELS.filter((m) => m.surface === surface),
    [surface]
  )
  const model = useMemo(() => {
    try {
      return getModel(modelId)
    } catch {
      return models[0] ?? MODELS[0]!
    }
  }, [modelId, models])
  const settings = useMemo(
    () => settingsByModel[model.id] ?? {},
    [settingsByModel, model.id]
  )
  const inputMode = inferInputMode(model, media)
  const prepared = useMemo(() => {
    try {
      const plane: GenerationPlane = {
        model: model.id,
        inputMode,
        prompt: { text: prompt.trim() },
        media: groupMedia(media),
        settings: parseSettings(model, settings),
      }
      toPlatform(plane)
      return { plane, error: null }
    } catch (caught) {
      return {
        plane: null,
        error: caught instanceof Error ? caught.message : String(caught),
      }
    }
  }, [inputMode, media, model, prompt, settings])

  useEffect(() => {
    if (!drawerVisible) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [drawerVisible])

  // Al abrir: liquida lo que quedó en cola mientras la pestaña estaba cerrada.
  useEffect(() => {
    void reconcileMyGenerations().then((credits) => {
      if (credits !== null) useAccount.getState().setCredits(credits)
    })
  }, [])

  const isOwner = account?.isOwner ?? false
  const credits = account?.credits ?? 0
  const price = useMemo(
    () =>
      affordability({
        isOwner,
        credits,
        price: prices[model.id],
        settings: prepared.plane?.settings ?? settings,
      }),
    [credits, isOwner, model.id, prepared.plane, prices, settings]
  )
  const priceMessage =
    price.state === "unpriced"
      ? "Este modelo todavía no tiene precio. Escoge otro."
      : price.state === "short"
        ? `Te faltan ${formatCredits(price.missing)} créditos. Recarga para continuar.`
        : undefined
  const costLabel =
    price.state === "free"
      ? "Dueño"
      : price.state === "ok" || price.state === "short"
        ? `${formatCredits(price.cost)} cr.`
        : undefined

  const galleryItems = useMemo(
    () => runs.records.flatMap(runToGalleryItems),
    [runs.records]
  )
  const libraryItems = useMemo(
    () => [...uploads, ...runs.records.flatMap(runToLibraryItems)],
    [runs.records, uploads]
  )
  const byProject = useMemo(() => {
    const map = new Map<string, GalleryItem[]>()
    for (const item of galleryItems) {
      if (!item.projectId) continue
      map.set(item.projectId, [...(map.get(item.projectId) ?? []), item])
    }
    return map
  }, [galleryItems])
  const projects = useMemo<MyProjectsProject[]>(
    () =>
      projectsStore.projects.map((p) => {
        const items = byProject.get(p.id) ?? []
        const cover = items.find(
          (i) => i.status === "ready" && i.src !== ""
        )?.src
        return {
          id: p.id,
          name: p.name,
          generationCount: new Set(items.map((i) => i.runId)).size,
          updatedAt: p.updatedAt,
          ...(cover ? { cover } : {}),
        }
      }),
    [byProject, projectsStore.projects]
  )
  const selectedProject =
    view.kind === "project"
      ? projects.find((p) => p.id === view.projectId)
      : undefined
  const visibleItems =
    view.kind === "project"
      ? (byProject.get(view.projectId) ?? [])
      : galleryItems

  const generating = runs.running.length > 0
  const canGenerate =
    prepared.plane !== null && (prompt.trim().length > 0 || media.length > 0)
  const missingRequiredInput =
    model.requiredRoles?.some(
      (role) => !media.some((item) => item.role === role)
    ) ||
    (model.requirePrompt && !prompt.trim())

  const handleGenerate = useCallback(() => {
    if (!canGenerate || generating || runs.submitting || !prepared.plane) return
    setLocalError(null)
    if (price.state === "short") {
      setAccountOpen(true)
      return
    }
    if (price.state === "unpriced") return
    const projectId = view.kind === "project" ? view.projectId : undefined
    void runs.submit(prepared.plane, projectId).then(({ record, failure }) => {
      if (failure?.code === "not_signed_in") window.location.reload()
      else if (failure?.code === "insufficient_credits") setAccountOpen(true)
      if (!record) return
      if (view.kind === "home") setView({ kind: "all" })
      if (projectId) projectsStore.touch(projectId)
    })
  }, [
    canGenerate,
    generating,
    price,
    prepared.plane,
    projectsStore,
    runs,
    view,
  ])

  const handleCancel = useCallback(() => {
    if (!generating || canceling) return
    setCanceling(true)
    void Promise.all(runs.running.map((r) => runs.cancel(r.id))).finally(() =>
      setCanceling(false)
    )
  }, [canceling, generating, runs])

  const handleUseTemplate = (t: TemplateItem) => {
    setPrompt(t.prompt)
    if (t.modelId && MODELS.some((m) => m.id === t.modelId)) {
      const target = getModel(t.modelId)
      setActiveModel(target.id)
      if (t.settings) setSetting(target.id, t.settings)
    } else if (t.kind !== surface && surfaces.includes(t.kind)) {
      changeSurface(t.kind)
    }
  }

  // setModel derives the surface from the model, so switching surface = picking its first model.
  const changeSurface = (next: Surface) => {
    const first = MODELS.find((m) => m.surface === next)
    if (first) setActiveModel(first.id)
  }

  const dock: DockProps = {
    surfaces,
    surface,
    onSurfaceChange: changeSurface,
    models,
    model,
    onModelChange: (id) => {
      setLocalError(null)
      setActiveModel(id)
    },
    settings,
    onSettingChange: (key, value) => setSetting(model.id, { [key]: value }),
    inputMode,
    media,
    onMediaAdd: (role: MediaRole | "auto", selection: AssetSelection[]) => {
      const selected = selection.map((item) => ({
        id: item.id,
        url: item.src,
        kind: item.kind,
        name: item.name,
      }))
      const roles = inputRoles(model, inputMode)
      const next =
        role === "auto"
          ? mergeReferences(media, selected, roles)
          : mergeMedia(
              media,
              role,
              selected.map((item) => ({ ...item, role })),
              roles[role] ?? 0
            )
      setLocalError(null)
      setMedia(next)
    },
    onMediaRemove: (id) => {
      setLocalError(null)
      setMedia((current) => current.filter((item) => item.id !== id))
    },
    onMediaRoleChange: (id, role) => {
      try {
        setMedia(changeImageRole(model, media, id, role))
        setLocalError(null)
      } catch (caught) {
        setLocalError(
          caught instanceof Error
            ? caught.message
            : "No se pudo cambiar el papel de la imagen."
        )
      }
    },
    library: { items: libraryItems, onUpload: uploadAsset },
    prompt,
    onPromptChange: setPrompt,
    onGenerate: handleGenerate,
    onCancel: handleCancel,
    generating,
    canceling,
    cost: costLabel,
    generateDisabled:
      !canGenerate ||
      runs.submitting ||
      price.state === "unpriced" ||
      price.state === "short",
    disabledReason: runs.submitting
      ? "Enviando…"
      : (priceMessage ?? prepared.error ?? undefined),
    error:
      localError ??
      runs.error ??
      (!missingRequiredInput && media.length > 0 ? prepared.error : null) ??
      priceMessage ??
      undefined,
  }

  const renderSidebar = (asDrawer: boolean) => (
    <StudioSidebar
      title={title}
      logo={<BrandMark className="w-7" />}
      view={view}
      projects={projects}
      onCreateProject={(name) =>
        setView({ kind: "project", projectId: projectsStore.create(name).id })
      }
      onRenameProject={(id, name) => projectsStore.rename(id, name)}
      onDeleteProject={(id) => {
        projectsStore.remove(id)
        if (view.kind === "project" && view.projectId === id)
          setView({ kind: "all" })
      }}
      accountLabel={account?.email ?? "Mi cuenta"}
      {...(isOwner
        ? { accountMeta: "Dueño" }
        : account
          ? { accountMeta: `${formatCredits(credits)} cr.` }
          : {})}
      accountOk={isOwner || credits > 0}
      onViewChange={(next: StudioView) => {
        setView(next)
        setDrawerOpen(false)
      }}
      collapsed={asDrawer ? false : collapsed}
      onCollapsedChange={(next: boolean) =>
        asDrawer ? setDrawerOpen(false) : setCollapsedChoice(next)
      }
      onOpenAccount={() => {
        setDrawerOpen(false)
        setAccountOpen(true)
      }}
    />
  )

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {phone ? (
        <>
          <div
            id="menu-estudio"
            inert={!drawerVisible}
            aria-hidden={!drawerVisible}
            className={cn(
              "fixed inset-y-0 left-0 z-50 h-dvh pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out motion-reduce:transition-none [&>aside]:h-[calc(100%-20px)]",
              drawerVisible ? "translate-x-0" : "-translate-x-[110%]"
            )}
          >
            {renderSidebar(true)}
          </div>
          {drawerVisible ? (
            <button
              type="button"
              aria-label="Cerrar menú"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
            />
          ) : null}
        </>
      ) : (
        renderSidebar(false)
      )}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {phone ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={drawerVisible}
              aria-controls="menu-estudio"
              className="pointer-events-auto inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-card/85 text-foreground shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <BrandMark className="w-10 text-foreground" />
            <button
              type="button"
              aria-label="Mi cuenta y créditos"
              className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-card/85 px-4 text-sm font-semibold tabular-nums shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
              onClick={() => setAccountOpen(true)}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  isOwner || credits > 0 ? "bg-primary" : "bg-destructive"
                )}
              />
              {isOwner ? "Dueño" : `${formatCredits(credits)} cr.`}
            </button>
          </div>
        ) : null}
        {view.kind === "home" ? (
          <HomeState
            title={headline}
            phone={phone}
            items={galleryItems}
            projects={projects}
            dock={dock}
            onCreateProject={(name) =>
              setView({
                kind: "project",
                projectId: projectsStore.create(name).id,
              })
            }
            onOpenAll={() => setView({ kind: "all" })}
            onOpenProject={(p) => setView({ kind: "project", projectId: p.id })}
            onUseTemplate={handleUseTemplate}
          />
        ) : (
          <FeedState
            phone={phone}
            items={visibleItems}
            previewItems={galleryItems}
            title={selectedProject?.name ?? "Todas las generaciones"}
            dock={dock}
            onDelete={(item) => runs.remove(item.runId)}
          />
        )}
      </main>
      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
    </div>
  )
}
