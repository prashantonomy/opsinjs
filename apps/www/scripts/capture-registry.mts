/**
 * capture-registry.mts - screenshots the chrome-less /view routes into
 * public/r/screens/, for the mobile fallback of <ComponentPreview> and for OG
 * imagery.
 *
 *   node scripts/capture-registry.mts
 *   node scripts/capture-registry.mts --base http://127.0.0.1:4000
 *
 * IT EXITS 0 WHEN PLAYWRIGHT IS ABSENT, AND THAT IS THE DESIGN. Playwright is
 * deliberately not a dependency of this repository (decision 10): it is a large,
 * platform-specific install whose browsers are downloaded out-of-band, and
 * screenshots are a nightly nicety, never part of the build path. A contributor
 * who has never heard of Playwright must be able to run `pnpm run capture` and
 * get a helpful sentence rather than a stack trace.
 *
 * It also exits 0 when the site is not running and when nothing is built. Every
 * one of those is a real state of the world, not a failure, and this script says
 * which one it met. IT DOES NOT EXIT 0 when a target that IS built fails to
 * render or fails to photograph: that is a defect, and a capture job whose only
 * output is a shorter list of files is a job nobody notices going wrong.
 *
 * TWO THINGS THIS SCRIPT MUST DO AND USED NOT TO. It waits for
 * `[data-opsin-view-state="ready"]` before it photographs anything, and it clips
 * to `#opsin-view-root`. The view route declares both markers explicitly rather
 * than leaving them to be inferred - see the comment at
 * app/(view)/view/[base]/[style]/[kind]/[name]/page.tsx - because without the
 * wait a capture races the render, and without the state check it will happily
 * photograph the <NotBuiltYet> placeholder of an unbuilt component and file it
 * under that component's name. A picture of a placeholder presented as a
 * component is the worst output this script has, worse than no output.
 *
 * public/r/screens/ is gitignored: these are build artefacts derived from the
 * running site, and committing binary renders of a design system that changes
 * weekly is how a repository gets heavy for no benefit.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/capture-registry.mts needs Node 24 or newer.",
      `  You are on Node ${process.versions.node}.`,
      "",
      "  These scripts are plain .mts run by node itself - no tsx, no ts-node -",
      "  which relies on native TypeScript type stripping. That is a Node 24",
      "  baseline, and it is why engines.node is >=24.0.0 in both package.json",
      "  files. Install Node 24 (nvm install 24) and run this again.",
      "",
    ].join("\n"),
  )
  process.exit(1)
}

import { mkdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const OUT_DIR = join(APP_DIR, "public", "r", "screens")

/**
 * The viewports captured. Phone first, because a consumer health app is read on
 * a phone in a waiting room far more often than on a desktop, and a component
 * that only looks composed at 1280px is a component that has not been designed.
 */
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844, scale: 2 },
  { name: "tablet", width: 834, height: 1112, scale: 2 },
  { name: "wide", width: 1280, height: 800, scale: 2 },
]

const THEMES: ("light" | "dark")[] = ["light", "dark"]

/**
 * How long a built target gets to declare itself ready before it is recorded as
 * a failure. Generous, because the first request to a `next start` route pays
 * for the dynamic import of the component, and mean enough that a hung render
 * is reported rather than waited on.
 */
const READY_TIMEOUT_MS = 15_000

function exists(file: string): boolean {
  try {
    statSync(file)
    return true
  } catch {
    return false
  }
}

function parseBase(): string {
  const index = process.argv.indexOf("--base")
  const fromArgv = index === -1 ? undefined : process.argv[index + 1]
  return (fromArgv ?? process.env.CAPTURE_BASE_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "")
}

/**
 * The shape `scripts/build-registry.mts` actually emits.
 *
 * REGISTRY_INDEX is FLAT and keyed `${base}/${style}/${kind}/${name}`; `kind` is
 * a real field on the entry, typed "component" | "example" | "screen"; and
 * `meta` is `Record<string, unknown> | null` which the generator emits as `null`
 * for every entry, built or not. This script used to read a nested `Index`, a
 * `builtCount` and an `entry.meta.type`, none of which have ever existed - so
 * `loadIndex()` returned undefined on every run and the script announced that
 * the registry "has not been generated yet" however many components were in it.
 */
interface RegistryEntry {
  name: string
  base: string
  style: string
  kind: "component" | "example" | "screen"
  component: unknown
}

interface CaptureTarget {
  name: string
  base: string
  style: string
  kind: "component" | "example" | "screen"
}

async function loadTargets(): Promise<CaptureTarget[] | undefined> {
  const file = join(APP_DIR, "registry", "__index__.ts")
  if (!exists(file)) return undefined
  try {
    const mod = (await import(pathToFileURL(file).href)) as {
      REGISTRY_INDEX?: Record<string, RegistryEntry>
    }
    if (!mod.REGISTRY_INDEX) return undefined
    return (
      Object.values(mod.REGISTRY_INDEX)
        /* `component: null` is how the generator says "specified, not built".
           There is nothing at that route but a placeholder. */
        .filter((entry) => entry.component !== null)
        .map((entry) => ({
          name: entry.name,
          base: entry.base,
          style: entry.style,
          kind: entry.kind,
        }))
    )
  } catch (error) {
    console.warn(
      `capture-registry: registry/__index__.ts could not be read - ${(error as Error).message}`,
    )
    return undefined
  }
}

/**
 * The canonical URL builder, imported rather than restated. A hand-built path
 * here is a path that stops matching the route the moment either changes, and
 * the route has both a base and a style segment that this script has to get
 * right in the same order the router expects.
 */
async function loadViewPath(): Promise<
  ((params: { name: string; kind?: string; base?: string; style?: string; mode?: "light" | "dark" }) => string)
  | undefined
> {
  const file = join(APP_DIR, "lib", "routes.ts")
  if (!exists(file)) return undefined
  try {
    const mod = (await import(pathToFileURL(file).href)) as {
      viewPath?: (params: {
        name: string
        kind?: string
        base?: string
        style?: string
        mode?: "light" | "dark"
      }) => string
    }
    return mod.viewPath
  } catch (error) {
    console.warn(`capture-registry: lib/routes.ts could not be read - ${(error as Error).message}`)
    return undefined
  }
}

async function loadPlaywright(): Promise<
  { chromium: { launch: (options?: unknown) => Promise<unknown> } } | undefined
> {
  for (const specifier of ["playwright", "playwright-core", "@playwright/test"]) {
    try {
      const mod = (await import(specifier)) as { chromium?: unknown }
      if (mod.chromium) return mod as { chromium: { launch: (options?: unknown) => Promise<unknown> } }
    } catch {
      /* not installed; try the next name */
    }
  }
  return undefined
}

async function serverIsUp(base: string): Promise<boolean> {
  try {
    const response = await fetch(base, { redirect: "follow" })
    return response.status < 500
  } catch {
    return false
  }
}

/*
 * The Playwright surface used here, declared structurally because there are no
 * types to import: the package is installed at job time in nightly and is
 * absent from every manifest by design.
 */
interface CapturePage {
  goto: (url: string, options?: unknown) => Promise<unknown>
  waitForSelector: (selector: string, options?: unknown) => Promise<unknown>
  locator: (selector: string) => { screenshot: (options: unknown) => Promise<unknown> }
}

interface CaptureContext {
  newPage: () => Promise<unknown>
  close: () => Promise<void>
}

interface CaptureBrowser {
  newContext: (options: unknown) => Promise<unknown>
  close: () => Promise<void>
}

async function main(): Promise<void> {
  const base = parseBase()

  const playwright = await loadPlaywright()
  if (!playwright) {
    console.log(
      [
        "capture-registry: Playwright is not installed, so no screenshots were taken.",
        "",
        "  This is expected. Playwright is not a dependency of this repository: captures",
        "  are a nightly job, never part of the build, and <ComponentPreview> falls back",
        "  to a live render rather than to an image on every surface that matters.",
        "",
        "  To take captures locally:",
        "    pnpm add -D playwright && pnpm exec playwright install chromium",
        "    pnpm run build && pnpm start &",
        "    pnpm run capture",
        "",
        "  Exiting 0.",
      ].join("\n"),
    )
    return
  }

  const targets = await loadTargets()
  if (!targets) {
    console.log(
      "capture-registry: registry/__index__.ts has not been generated yet. Run\n" +
        "  `pnpm run generate` first. Exiting 0.",
    )
    return
  }

  if (targets.length === 0) {
    console.log(
      [
        "capture-registry: nothing is built, so there is nothing to capture.",
        "",
        "  Every catalogue entry is specified and none of them resolves to a component -",
        "  which is the honest state of a design system whose components are specified",
        "  and not yet implemented. The first component to land will appear here",
        "  automatically, as will the first example and the first screen.",
        "",
        "  Exiting 0.",
      ].join("\n"),
    )
    return
  }

  const viewPath = await loadViewPath()
  if (!viewPath) {
    console.log(
      "capture-registry: lib/routes.ts did not export viewPath, so no URL could be\n" +
        "  built. Exiting 0.",
    )
    return
  }

  if (!(await serverIsUp(base))) {
    console.log(
      [
        `capture-registry: nothing is listening at ${base}, so no screenshots were taken.`,
        "",
        "  Start the site first:  pnpm run build && pnpm start",
        "  Or point at another origin:  pnpm run capture -- --base https://opsinjs.pensievelabs.org",
        "",
        "  Exiting 0.",
      ].join("\n"),
    )
    return
  }

  mkdirSync(OUT_DIR, { recursive: true })

  const browser = (await playwright.chromium.launch()) as CaptureBrowser

  let captured = 0
  const failures: string[] = []
  try {
    for (const viewport of VIEWPORTS) {
      for (const theme of THEMES) {
        const context = (await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.scale,
          /* Belt and braces. The product theme is driven by a class the (view)
             layout adds from ?mode=, not by prefers-color-scheme, so `mode` in
             the URL below is what actually switches it; this makes the browser
             agree rather than leaving the two in disagreement. */
          colorScheme: theme,
          reducedMotion: "reduce",
        })) as CaptureContext
        const page = (await context.newPage()) as CapturePage

        for (const target of targets) {
          const url = `${base}${viewPath({
            name: target.name,
            kind: target.kind,
            base: target.base,
            style: target.style,
            mode: theme,
          })}`
          /* The base is in the filename because two bases render the same
             component id at different routes, and the kind is in it because an
             example may share a name with the component it demonstrates. The
             old name carried neither and silently overwrote. */
          const file = join(
            OUT_DIR,
            `${target.base}-${target.style}-${target.kind}-${target.name}` +
              `-${viewport.name}-${theme}.png`,
          )
          try {
            await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 })
            await page.waitForSelector('[data-opsin-view-state="ready"]', {
              timeout: READY_TIMEOUT_MS,
            })
            await page.locator("#opsin-view-root").screenshot({ path: file })
            captured += 1
          } catch (error) {
            /* This target IS built - it was filtered on `component !== null` -
               so reaching here means the route errored, the component threw, or
               the ready marker never appeared. Recorded, not swallowed. */
            const message = `${url} - ${(error as Error).message.split("\n")[0]}`
            failures.push(message)
            console.warn(`  failed ${message}`)
          }
        }
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }

  const expected = targets.length * VIEWPORTS.length * THEMES.length
  console.log(
    `capture-registry: ${captured} of ${expected} screenshots written to public/r/screens/ ` +
      `(${targets.length} target${targets.length === 1 ? "" : "s"} x ${VIEWPORTS.length} ` +
      `viewports x ${THEMES.length} themes).`,
  )

  if (failures.length > 0) {
    console.error(
      [
        "",
        `capture-registry: ${failures.length} capture${failures.length === 1 ? "" : "s"} failed.`,
        "",
        "  Each one is a target the registry says is built, at a route that did not",
        "  reach data-opsin-view-state=\"ready\". That is a rendering failure rather",
        "  than a missing screenshot, and it would be invisible if this script kept",
        "  exiting 0 - which is what it did for every run before it read the right",
        "  exports. Open one of the URLs above under `pnpm start`.",
        "",
      ].join("\n"),
    )
    process.exit(1)
  }
}

await main()
