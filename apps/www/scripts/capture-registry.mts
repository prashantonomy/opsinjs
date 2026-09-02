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
 * It also exits 0 when the site is not running, and when nothing is built - which
 * today is always, because no component exists. Every one of those is a real
 * state of the world, not a failure, and this script says which one it met.
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

const THEMES = ["light", "dark"]

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

interface RegistryEntry {
  name: string
  base: string
  style: string
  component: unknown
  meta: { type: string; status: string }
}

async function loadIndex(): Promise<{
  index: Record<string, Record<string, Record<string, RegistryEntry>>>
  builtCount: number
} | undefined> {
  const file = join(APP_DIR, "registry", "__index__.ts")
  if (!exists(file)) return undefined
  try {
    const mod = (await import(pathToFileURL(file).href)) as {
      Index?: Record<string, Record<string, Record<string, RegistryEntry>>>
      builtCount?: number
    }
    if (!mod.Index) return undefined
    return { index: mod.Index, builtCount: mod.builtCount ?? 0 }
  } catch (error) {
    console.warn(`capture-registry: registry/__index__.ts could not be read - ${(error as Error).message}`)
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

  const registry = await loadIndex()
  if (!registry) {
    console.log(
      "capture-registry: registry/__index__.ts has not been generated yet. Run\n" +
        "  `pnpm run generate` first. Exiting 0.",
    )
    return
  }

  const targets: Array<{ name: string; base: string; style: string; kind: string }> = []
  for (const [baseName, styles] of Object.entries(registry.index)) {
    for (const [styleName, entries] of Object.entries(styles)) {
      for (const entry of Object.values(entries)) {
        if (entry.component === null) continue
        targets.push({
          name: entry.name,
          base: baseName,
          style: styleName,
          kind: entry.meta.type === "registry:block" ? "screen" : "component",
        })
      }
    }
  }

  if (targets.length === 0) {
    console.log(
      [
        "capture-registry: nothing is built, so there is nothing to capture.",
        "",
        `  The catalogue is populated but every entry resolves to component: null - which`,
        "  is the honest state of a design system whose components are specified and not",
        "  yet implemented. The first component to land will appear here automatically.",
        "",
        "  Exiting 0.",
      ].join("\n"),
    )
    return
  }

  if (!(await serverIsUp(base))) {
    console.log(
      [
        `capture-registry: nothing is listening at ${base}, so no screenshots were taken.`,
        "",
        "  Start the site first:  pnpm run build && pnpm start",
        "  Or point at another origin:  pnpm run capture -- --base https://opsinjs.dev",
        "",
        "  Exiting 0.",
      ].join("\n"),
    )
    return
  }

  mkdirSync(OUT_DIR, { recursive: true })

  const browser = (await playwright.chromium.launch()) as {
    newContext: (options: unknown) => Promise<unknown>
    close: () => Promise<void>
  }

  let captured = 0
  try {
    for (const viewport of VIEWPORTS) {
      for (const theme of THEMES) {
        const context = (await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.scale,
          colorScheme: theme,
          reducedMotion: "reduce",
        })) as {
          newPage: () => Promise<unknown>
          close: () => Promise<void>
        }
        const page = (await context.newPage()) as {
          goto: (url: string, options?: unknown) => Promise<unknown>
          screenshot: (options: unknown) => Promise<unknown>
        }

        for (const target of targets) {
          const url = `${base}/view/${target.base}/${target.style}/${target.kind}/${target.name}?mode=${theme}`
          try {
            await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 })
            await page.screenshot({
              path: join(OUT_DIR, `${target.name}-${target.style}-${viewport.name}-${theme}.png`),
              fullPage: false,
            })
            captured += 1
          } catch (error) {
            console.warn(`  skipped ${url} - ${(error as Error).message}`)
          }
        }
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }

  console.log(
    `capture-registry: ${captured} screenshot${captured === 1 ? "" : "s"} of ${targets.length} ` +
      `target${targets.length === 1 ? "" : "s"} written to public/r/screens/.`,
  )
}

await main()
