/**
 * check-llms.mts - asserts that the machine-readable surface is complete,
 * reachable and free of duplicates.
 *
 *   node scripts/check-llms.mts                              # offline structural checks
 *   node scripts/check-llms.mts --base http://127.0.0.1:4000 # also fetch every URL
 *
 * The base URL may also come from LLMS_BASE_URL. CI starts the built site and
 * passes it, which is the mode that actually proves the contract: every URL in
 * llms.txt returns 200, every page appears exactly once, and every .md twin
 * resolves.
 *
 * WHY THIS EXISTS. The agent-facing surface is the part of a documentation site
 * nobody looks at. A broken link in llms.txt is invisible to every human reader
 * and fatal to the machine reader it was written for, and a page that appears in
 * two shards silently doubles an agent's context budget for no information. Both
 * failures are cheap to detect and impossible to notice.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/check-llms.mts needs Node 24 or newer.",
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

import { type Dirent, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const DOCS_DIR = join(APP_DIR, "content", "docs")
const APP_ROUTES = join(APP_DIR, "app")

/**
 * The machine surface, as frozen in the route map. Each entry names the route
 * folder that must exist and what it is for; a missing one is an error because
 * every one of them is referenced from the Agents pillar as a stable contract.
 */
const REQUIRED_ROUTES = [
  { path: "llms.txt", purpose: "the curated index: absolute URLs, section headers, one line per page" },
  { path: "llms-full.txt", purpose: "the whole corpus, size-capped, pointing at the shards" },
  { path: "llms-components.txt", purpose: "shard: component and screen specifications" },
  { path: "llms-health.txt", purpose: "shard: health, accessibility and content doctrine" },
  { path: "llms-foundations.txt", purpose: "shard: foundations, theming and generated reference" },
  { path: "llms.mdx", purpose: "the processed-markdown twin behind the /docs/:path*.md rewrite" },
  { path: join("r", "docs.json"), purpose: "the offline agent bundle" },
  { path: join("r", "registry.json"), purpose: "the catalog the shadcn MCP server requires" },
]

/**
 * Which top-level sections each shard carries. Frozen in the route map, and the
 * partition is the point: a page in two shards costs an agent context twice for
 * the same information, and a page in none is invisible unless it reads
 * llms-full.txt.
 */
const SHARDS: Record<string, string[]> = {
  "llms-components.txt": ["components", "screens"],
  "llms-health.txt": ["health", "accessibility", "content"],
  "llms-foundations.txt": ["foundations", "theming", "reference"],
}

/** Above this, llms-full.txt is doing the shards' job badly. Bytes. */
const FULL_SIZE_WARNING = 900_000

/**
 * Redirect families an agent or a reader arriving with another system's map in
 * their head will guess. Checked in live mode only, and as warnings: they are a
 * courtesy, not a contract.
 */
const GUESSABLE_PATHS = [
  { from: "/docs/installation", why: "shadcn's URL for the same page" },
  { from: "/docs/foundations/color", why: "the American spelling of the colour foundation" },
  { from: "/docs/components/base/button", why: "the per-base URL shape the ecosystem uses" },
]

interface Finding {
  level: "error" | "warn"
  message: string
}

const findings: Finding[] = []
const fail = (message: string) => findings.push({ level: "error", message })
const warn = (message: string) => findings.push({ level: "warn", message })

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

function exists(file: string): boolean {
  try {
    statSync(file)
    return true
  } catch {
    return false
  }
}

function walk(dir: string, predicate: (name: string) => boolean, out: string[]): void {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, predicate, out)
    else if (predicate(entry.name)) out.push(full)
  }
}

/** Every docs slug, "" for the index. */
function docsSlugs(): string[] {
  const files: string[] = []
  walk(DOCS_DIR, (name) => name.endsWith(".mdx"), files)
  return files
    .map((file) => relative(DOCS_DIR, file).replace(/\.mdx$/, "").split(sep).join("/"))
    .map((slug) => (slug === "index" ? "" : slug.replace(/\/index$/, "")))
    .sort()
}

function parseBase(): string | undefined {
  const index = process.argv.indexOf("--base")
  const fromArgv = index === -1 ? undefined : process.argv[index + 1]
  const base = fromArgv ?? process.env.LLMS_BASE_URL
  return base ? base.replace(/\/+$/, "") : undefined
}

async function fetchText(url: string): Promise<{ status: number; body: string } | undefined> {
  try {
    const response = await fetch(url, { redirect: "follow" })
    return { status: response.status, body: await response.text() }
  } catch (error) {
    console.warn(`  request failed: ${url} - ${(error as Error).message}`)
    return undefined
  }
}

/** Fetch with a small pool. A docs corpus is a few hundred URLs; serial is slow, unbounded is rude. */
async function fetchAll(
  urls: string[],
  concurrency: number,
): Promise<Map<string, number>> {
  const results = new Map<string, number>()
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (cursor < urls.length) {
      const index = cursor
      cursor += 1
      const url = urls[index] as string
      try {
        const response = await fetch(url, { redirect: "follow" })
        results.set(url, response.status)
      } catch {
        results.set(url, 0)
      }
    }
  })
  await Promise.all(workers)
  return results
}

/* ------------------------------------------------------------------ *
 * Offline checks                                                      *
 * ------------------------------------------------------------------ */

function checkRoutesExist(): void {
  for (const route of REQUIRED_ROUTES) {
    const candidates = [
      join(APP_ROUTES, route.path, "route.ts"),
      join(APP_ROUTES, route.path, "route.tsx"),
      join(APP_ROUTES, route.path, "[[...slug]]", "route.ts"),
    ]
    if (candidates.some(exists)) continue
    fail(
      `app/${route.path.split(sep).join("/")}/ has no route handler - ${route.purpose}. ` +
        `The Agents pillar documents it as a stable surface, so its absence is a broken promise, not a gap.`,
    )
  }
}

function checkRewrite(): void {
  const config = exists(join(APP_DIR, "next.config.mjs"))
    ? readFileSync(join(APP_DIR, "next.config.mjs"), "utf8")
    : undefined
  if (config === undefined) {
    warn("next.config.mjs is missing, so the .md twin rewrite could not be checked.")
    return
  }
  if (!config.includes("llms.mdx")) {
    fail(
      "next.config.mjs does not rewrite the .md twins to /llms.mdx. Every page is promised at " +
        "its own address with a .md suffix; without the rewrite that promise 404s.",
    )
  }
}

function checkShardPartition(slugs: string[]): void {
  const sections = new Set(slugs.map((slug) => slug.split("/")[0] ?? "").filter((s) => s !== ""))
  const assigned = new Map<string, string>()

  for (const [shard, covered] of Object.entries(SHARDS)) {
    for (const section of covered) {
      const already = assigned.get(section)
      if (already) {
        fail(
          `the section "${section}" is claimed by both ${already} and ${shard}. The shards are a ` +
            `partition: a page in two of them costs an agent its context budget twice for the same text.`,
        )
        continue
      }
      assigned.set(section, shard)
      if (!sections.has(section)) {
        warn(
          `${shard} claims the section "${section}", but content/docs/${section}/ has no pages yet.`,
        )
      }
    }
  }

  const unsharded = [...sections].filter((section) => !assigned.has(section)).sort()
  if (unsharded.length > 0) {
    console.log(
      `  note: ${unsharded.join(", ")} ${unsharded.length === 1 ? "is" : "are"} carried only by ` +
        `llms.txt and llms-full.txt. That is by design - the shards exist for the three heaviest ` +
        `pillars - but it is worth knowing which sections an agent only sees in the full corpus.`,
    )
  }
}

/* ------------------------------------------------------------------ *
 * Live checks                                                         *
 * ------------------------------------------------------------------ */

function absoluteUrls(text: string): string[] {
  const urls = new Set<string>()
  const pattern = /https?:\/\/[^\s)<>"']+/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    urls.add((match[0] as string).replace(/[.,;]+$/, ""))
  }
  return [...urls]
}

/**
 * The origin llms.txt was generated with.
 *
 * Taken from the file itself rather than from the environment: the point of the
 * check is that the published file resolves, and the published file names its
 * own origin. The most common absolute origin in the document wins, which makes
 * a stray link to an external site harmless.
 */
function originOf(text: string): string | undefined {
  const counts = new Map<string, number>()
  for (const url of absoluteUrls(text)) {
    try {
      const origin = new URL(url).origin
      counts.set(origin, (counts.get(origin) ?? 0) + 1)
    } catch {
      /* not a URL we can parse; it cannot be this site's origin either */
    }
  }
  let best: string | undefined
  let bestCount = 0
  for (const [origin, count] of counts) {
    if (count > bestCount) {
      best = origin
      bestCount = count
    }
  }
  return best
}

async function liveChecks(base: string, slugs: string[]): Promise<void> {
  console.log(`check-llms: live mode against ${base}`)

  const index = await fetchText(`${base}/llms.txt`)
  if (!index || index.status !== 200) {
    fail(`GET ${base}/llms.txt returned ${index?.status ?? "no response"}; expected 200.`)
    return
  }

  /* llms.txt is generated with the site's CANONICAL origin, because that is the
     only origin an agent that fetched the file elsewhere can resolve against.
     In CI the same file is served from http://127.0.0.1:4000, so a link is
     "pointing at this site" if it starts with either origin, and it is fetched
     from the base. Comparing only against the base made every live run report
     that a correct llms.txt contained no site URLs and that all 343 pages were
     missing from it. */
  const canonicalOrigin = originOf(index.body)
  const toBase = (url: string): string =>
    canonicalOrigin && url.startsWith(canonicalOrigin)
      ? base + url.slice(canonicalOrigin.length)
      : url

  const urls = absoluteUrls(index.body)
    .filter((url) => url.startsWith(base) || (canonicalOrigin !== undefined && url.startsWith(canonicalOrigin)))
    .map(toBase)
  if (urls.length === 0) {
    fail(
      "llms.txt contains no absolute URLs pointing at this site. The curated index must use " +
        "absolute URLs: an agent that fetched it has no base to resolve relative links against.",
    )
  }

  const statuses = await fetchAll(urls, 8)
  const broken = [...statuses.entries()].filter(([, status]) => status !== 200)
  for (const [url, status] of broken.slice(0, 25)) {
    fail(`llms.txt links to ${url}, which returned ${status === 0 ? "a network error" : status}.`)
  }
  if (broken.length > 25) fail(`... and ${broken.length - 25} more broken llms.txt links.`)

  /* Every page exactly once. */
  const seen = new Map<string, number>()
  for (const url of urls) {
    const path = url.slice(base.length).replace(/\.md$/, "")
    const slug = path.replace(/^\/docs\/?/, "").replace(/\/$/, "")
    seen.set(slug, (seen.get(slug) ?? 0) + 1)
  }
  for (const [slug, count] of seen) {
    if (count > 1) {
      fail(`llms.txt lists /docs/${slug} ${count} times. Every page appears exactly once.`)
    }
  }
  const missing = slugs.filter((slug) => !seen.has(slug))
  if (missing.length > 0) {
    const shown = missing.slice(0, 15)
    warn(
      `${missing.length} page${missing.length === 1 ? "" : "s"} in the corpus ${
        missing.length === 1 ? "is" : "are"
      } absent from llms.txt: ${shown.join(", ")}${missing.length > shown.length ? ", ..." : ""}. ` +
        `llms.txt is curated, so some absence is intended - but a whole section missing is not.`,
    )
  }

  /* The shards and the full corpus. */
  for (const shard of ["llms-full.txt", ...Object.keys(SHARDS)]) {
    const response = await fetchText(`${base}/${shard}`)
    if (!response || response.status !== 200) {
      fail(`GET ${base}/${shard} returned ${response?.status ?? "no response"}; expected 200.`)
      continue
    }
    const bytes = Buffer.byteLength(response.body, "utf8")
    if (bytes === 0) fail(`${shard} is empty.`)
    if (shard === "llms-full.txt" && bytes > FULL_SIZE_WARNING) {
      warn(
        `llms-full.txt is ${Math.round(bytes / 1024)} kB, above the ${Math.round(
          FULL_SIZE_WARNING / 1024,
        )} kB budget. Point readers at the shards and cap it - an agent that cannot fit the file gets nothing, not less.`,
      )
    }
  }

  /* The .md twins. A sample would hide exactly the pages nobody visits, so all of them. */
  const twinUrls = slugs.map((slug) => `${base}/docs${slug === "" ? "" : `/${slug}`}.md`)
  const twinStatuses = await fetchAll(twinUrls, 8)
  const brokenTwins = [...twinStatuses.entries()].filter(([, status]) => status !== 200)
  for (const [url, status] of brokenTwins.slice(0, 25)) {
    fail(`the markdown twin ${url} returned ${status === 0 ? "a network error" : status}.`)
  }
  if (brokenTwins.length > 25) fail(`... and ${brokenTwins.length - 25} more broken .md twins.`)

  /* Guessable URLs. */
  for (const guess of GUESSABLE_PATHS) {
    const response = await fetchText(`${base}${guess.from}`)
    if (!response || response.status >= 400) {
      warn(
        `${guess.from} returns ${response?.status ?? "no response"} - ${guess.why}. ` +
          `A redirect in app/proxy.ts costs one line and catches a reader who arrived with another system's map.`,
      )
    }
  }

  /* The registry catalog. */
  const registry = await fetchText(`${base}/r/registry.json`)
  if (!registry || registry.status !== 200) {
    fail(`GET ${base}/r/registry.json returned ${registry?.status ?? "no response"}; the shadcn MCP server requires it.`)
  } else {
    try {
      const parsed = JSON.parse(registry.body) as { items?: unknown[] }
      if (!Array.isArray(parsed.items)) {
        fail("/r/registry.json has no `items` array; the shadcn registry schema requires one.")
      }
    } catch {
      fail("/r/registry.json is not valid JSON.")
    }
  }
}

/* ------------------------------------------------------------------ *
 * Main                                                                *
 * ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const strict = process.argv.includes("--strict")
  const base = parseBase()
  const slugs = docsSlugs()

  console.log(
    `check-llms: ${slugs.length} docs page${slugs.length === 1 ? "" : "s"} in the corpus.`,
  )

  checkRoutesExist()
  checkRewrite()
  checkShardPartition(slugs)

  if (base) {
    await liveChecks(base, slugs)
  } else {
    console.log(
      [
        "  offline mode: structural checks only. The URL-level contract - every link in",
        "  llms.txt returning 200, every page appearing exactly once, every .md twin",
        "  resolving - is only provable against a running server. Start one and pass",
        "  --base http://127.0.0.1:4000, which is what CI does after the build.",
      ].join("\n"),
    )
  }

  const errors = findings.filter((finding) => finding.level === "error")
  const warnings = findings.filter((finding) => finding.level === "warn")
  if (findings.length > 0) {
    console.log("")
    for (const finding of errors) console.log(`ERROR  ${finding.message}`)
    for (const finding of warnings) console.log(`warn   ${finding.message}`)
    console.log("")
  }
  console.log(
    `check-llms: ${errors.length} error${errors.length === 1 ? "" : "s"}, ` +
      `${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`,
  )
  if (errors.length > 0 || (strict && warnings.length > 0)) process.exit(1)
}

await main()
