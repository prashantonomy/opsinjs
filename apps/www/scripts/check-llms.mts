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

/* The corpus is rooted: `DOCS_BASE` is empty and a page lives at
   `/components/button`. Every URL this script predicts is built with
   `docsPath`, the same function the site builds its links with, so moving the
   base cannot leave this file probing a prefix that no longer exists. That is
   what it did before: it predicted `/docs/<slug>.md` for all 404 twins and
   reported every one of them as a 404 of the site's rather than of its own. */
import { docsMarkdownPath, docsPath } from "../lib/routes.ts"

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
  { path: "llms.mdx", purpose: "the processed-markdown twin behind the /:path*.md rewrite" },
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
  { from: docsPath("installation"), why: "shadcn's URL for the same page" },
  {
    from: docsPath("foundations", "color"),
    why: "the American spelling of the colour foundation",
  },
  {
    from: docsPath("components", "base", "button"),
    why: "the per-base URL shape the ecosystem uses",
  },
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

/**
 * The same pool, keeping the bodies and the headers.
 *
 * `fetchAll` throws the response away because most of what it checks is
 * reachability, and a few hundred page bodies held at once is a lot of memory
 * for a status code. The twin/roster agreement check below needs the text, so
 * it gets its own helper rather than making every caller pay for it.
 *
 * The headers come with it because that check now compares three surfaces on
 * one response - the roster, the twin's frontmatter and the twin's
 * `x-opsinjs-implemented` header - and fetching the same three hundred URLs a
 * second time for a HEAD request would double the slowest part of the run to
 * read four hundred bytes that were already on the wire.
 */
async function fetchAllText(
  urls: string[],
  concurrency: number,
): Promise<Map<string, { status: number; body: string; headers: Headers }>> {
  const results = new Map<string, { status: number; body: string; headers: Headers }>()
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (cursor < urls.length) {
      const index = cursor
      cursor += 1
      const url = urls[index] as string
      try {
        const response = await fetch(url, { redirect: "follow" })
        results.set(url, {
          status: response.status,
          body: await response.text(),
          headers: response.headers,
        })
      } catch {
        results.set(url, { status: 0, body: "", headers: new Headers() })
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
    const slug = path.replace(/^\//, "").replace(/\/$/, "")
    seen.set(slug, (seen.get(slug) ?? 0) + 1)
  }
  for (const [slug, count] of seen) {
    if (count > 1) {
      fail(
        `llms.txt lists ${docsPath(slug)} ${count} times. Every page appears exactly once.`,
      )
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

  /* THE SHARDS AND THE FULL CORPUS.
     Byte size was the only thing this loop used to look at, and byte size is
     the half of the budget that cannot go wrong: assemble() stops adding pages
     at the cap, so a corpus file is under budget by construction and the size
     warning below has almost no way to fire. What it stops at the cap is PAGES,
     and nothing reported that. The files say so themselves - each one prints
     "Pages: N of M." and a "## Truncated" section - so the number is there to
     be read, and reading it is the difference between a shard that is small and
     a shard that has quietly stopped carrying two thirds of its section.

     WARN, NOT FAIL, AND WHY. agents/llms-txt.mdx says an over-budget shard "is
     a signal that it needs splitting, not trimming. That is a build failure,
     not a silent degradation." Splitting the shards is a design change nobody
     has made, and every corpus file drops pages today, so failing here would
     put the build in a state whose only exits are raising BUDGETS or deleting
     this check - both of which are the silent degradation the page forbids.
     A warning that names the dropped count is what makes the state visible
     while the decision is taken. Raise it to fail() once the shards are split. */
  const corpusBodies = new Map<string, string>()
  for (const shard of ["llms-full.txt", ...Object.keys(SHARDS)]) {
    const response = await fetchText(`${base}/${shard}`)
    if (!response || response.status !== 200) {
      fail(`GET ${base}/${shard} returned ${response?.status ?? "no response"}; expected 200.`)
      continue
    }
    corpusBodies.set(shard, response.body)
    const bytes = Buffer.byteLength(response.body, "utf8")
    if (bytes === 0) fail(`${shard} is empty.`)
    if (shard === "llms-full.txt" && bytes > FULL_SIZE_WARNING) {
      warn(
        `llms-full.txt is ${Math.round(bytes / 1024)} kB, above the ${Math.round(
          FULL_SIZE_WARNING / 1024,
        )} kB budget. Point readers at the shards and cap it - an agent that cannot fit the file gets nothing, not less.`,
      )
    }

    const coverage = /^Pages:\s*(\d+) of (\d+)/m.exec(response.body)
    if (!coverage) {
      warn(
        `${shard} carries no "Pages: N of M." line, so nothing here can tell how much of ` +
          "the corpus it dropped. That header is what makes truncation measurable; restore it " +
          "in app/_machine/corpus.ts.",
      )
      continue
    }
    const included = Number(coverage[1])
    const total = Number(coverage[2])
    const omitted = total - included
    if (omitted > 0) {
      warn(
        `${shard} carries ${included} of ${total} pages - ${omitted} dropped at the byte budget ` +
          `(${Math.round((included / total) * 100)}% coverage). An agent reading this file cannot ` +
          "see the missing pages and is not told which they are beyond the file's own Truncated " +
          "list. Split the section rather than trimming it.",
      )
    }
  }

  /* THE ASSERTION THAT WOULD HAVE CAUGHT THE HEADLINE PROBLEM. A component the
     roster says is implemented is the single most likely thing an agent comes
     looking for, and the components shard is where it is meant to find it.
     Truncation drops pages in corpus order, which is alphabetical, so the built
     components at the end of the alphabet are exactly the ones that fall off. */
  const roster = await fetchText(`${base}/r/index.json`)
  if (roster && roster.status === 200) {
    let items: { name?: string; implemented?: boolean }[] = []
    try {
      items = (JSON.parse(roster.body) as { items?: { name?: string; implemented?: boolean }[] })
        .items ?? []
    } catch {
      fail(`${base}/r/index.json is not valid JSON, so the roster cannot be compared to the corpus.`)
    }
    const components = corpusBodies.get("llms-components.txt")
    const implemented = items.filter((item) => item.implemented === true && item.name)
    if (components !== undefined && implemented.length > 0) {
      const absent = implemented
        .map((item) => item.name as string)
        .filter((name) => !new RegExp(`/docs/components/${name}(?![a-z0-9-])`).test(components))
      if (absent.length > 0) {
        warn(
          `${absent.length} implemented component${absent.length === 1 ? "" : "s"} ` +
            `${absent.length === 1 ? "is" : "are"} absent from llms-components.txt: ` +
            `${absent.join(", ")}. /r/index.json says they exist and can be installed; the corpus ` +
            "file an agent reads to learn what the system provides does not mention them.",
        )
      }
    }

    /* THE TWO MACHINE SURFACES THAT ANSWER THE SAME QUESTION, ASKED TOGETHER.
       `/r/index.json` carries `implemented` per id, and every component page's
       .md twin carries an `implemented:` frontmatter line generated from the
       same index in app/_machine/corpus.ts. They are produced a long way apart
       and an agent will believe whichever it reads first, so a disagreement is
       not a formatting slip: it is the system telling two different stories
       about whether code exists. This is the class of defect that shipped
       `implemented: false` on twenty-four built components while the roster
       said otherwise, and it went unseen because nothing compared them.

       THE HEADER ON THE SAME RESPONSE IS NOW COMPARED TOO, and this paragraph
       used to explain why it could not be. The reasoning was that a docs twin's
       URL is the system rather than one registry item, so `x-opsinjs-implemented`
       read `true` on every page while any component was built, including the
       pages of components that had no code, and asserting it against the
       frontmatter would have failed every one of those correct pages.

       That stopped being true when `pageHeaders()` in app/_machine/corpus.ts
       started answering per page: a twin that documents a component or a screen
       now sends that subject's own `x-opsinjs-implemented`, and `/llms.mdx`
       spreads it through the caller-headers-last hole in `text()`. So a third
       surface answers the same question about the same id, produced a third way
       - and a header is the one an installing tool reads without parsing
       anything, which makes it the copy most worth checking and the copy whose
       staleness would be least visible.

       `x-opsinjs-status` is how this tells the two scopes apart rather than
       guessing. It is sent on every twin and only by the per-page path, so its
       absence means the running build predates that change and its
       `x-opsinjs-implemented` is still the old system-scoped `true`. Comparing
       that value would produce exactly the false failures the old paragraph
       was right to avoid, so it is reported once, as a warning naming the
       build, rather than as a defect per page that is not in the source. */
    const rosterImplemented = new Map(
      items
        .filter((item) => typeof item.name === "string")
        .map((item) => [item.name as string, item.implemented === true]),
    )
    const twinsByName = await fetchAllText(
      [...rosterImplemented.keys()].map(
        (name) => `${base}${docsMarkdownPath("components", name)}`,
      ),
      8,
    )
    const disagreements: string[] = []
    const headerDisagreements: string[] = []
    const headerMissing: string[] = []
    const systemScopedTwins: string[] = []
    for (const [name, expected] of rosterImplemented) {
      const twin = twinsByName.get(`${base}${docsMarkdownPath("components", name)}`)
      /* A missing or unreachable twin is already reported by the twin sweep
         further down; reporting it twice under a different heading would send
         the reader looking for a second defect that is not there. */
      if (!twin || twin.status !== 200) continue
      const declared = /^implemented:\s*(true|false)\s*$/m.exec(twin.body)
      if (!declared) {
        fail(
          `${docsMarkdownPath("components", name)} carries no \`implemented:\` frontmatter line. It is ` +
            "generated in app/_machine/corpus.ts from the same index /r/index.json is built " +
            "from, and an agent reading the twin has no other way to tell a specification " +
            "from a component with code behind it.",
        )
        continue
      }
      const declaredValue = declared[1] === "true"
      if (declaredValue !== expected) {
        disagreements.push(
          `${name} (twin says ${declared[1]}, /r/index.json says ${String(expected)})`,
        )
      }

      /* The third surface. `x-opsinjs-status` first, as the scope marker: see
         the paragraph above. */
      const scope = twin.headers.get("x-opsinjs-status")
      if (scope === null) {
        systemScopedTwins.push(name)
        continue
      }
      const header = twin.headers.get("x-opsinjs-implemented")
      if (header === null) {
        headerMissing.push(name)
        continue
      }
      const headerValue = header === "true"
      if (headerValue !== expected || headerValue !== declaredValue) {
        headerDisagreements.push(
          `${name} (header says ${header}, the twin's frontmatter says ${String(declaredValue)}, ` +
            `/r/index.json says ${String(expected)})`,
        )
      }
    }
    if (disagreements.length > 0) {
      fail(
        `${disagreements.length} component${disagreements.length === 1 ? "" : "s"} ` +
          `disagree${disagreements.length === 1 ? "s" : ""} with the roster about whether code ` +
          `exists: ${disagreements.join("; ")}. Both are generated, so the fix is in the ` +
          "generator that is wrong, never in the page. registry/catalogue.ts and the files " +
          "under registry/bases/base/ are the ground truth both of them read.",
      )
    }
    if (headerDisagreements.length > 0) {
      fail(
        `${headerDisagreements.length} component twin${headerDisagreements.length === 1 ? "" : "s"} ` +
          `send${headerDisagreements.length === 1 ? "s" : ""} an \`x-opsinjs-implemented\` header ` +
          `that contradicts the page it is attached to: ${headerDisagreements.slice(0, 10).join("; ")}` +
          `${headerDisagreements.length > 10 ? `, and ${headerDisagreements.length - 10} more` : ""}. ` +
          "The header is the copy a tool reads before deciding to install, so it is the one that " +
          "must not be wrong. All three come from `implementedComponents()` in " +
          "app/_machine/contracts.ts by way of `pageImplemented()` in app/_machine/corpus.ts; " +
          "fix whichever path stopped reading it.",
      )
    }
    if (headerMissing.length > 0) {
      fail(
        `${headerMissing.length} component twin${headerMissing.length === 1 ? "" : "s"} ` +
          `carr${headerMissing.length === 1 ? "ies" : "y"} \`x-opsinjs-status\` but no ` +
          `\`x-opsinjs-implemented\`: ${headerMissing.slice(0, 10).join(", ")}` +
          `${headerMissing.length > 10 ? `, and ${headerMissing.length - 10} more` : ""}. ` +
          "`pageHeaders()` omits the header only when the page documents nothing buildable, so a " +
          "component page reaching that branch means `componentIdOf()` no longer recognises it - " +
          "and a HEAD request that answers nothing is read as a component with no code.",
      )
    }
    if (systemScopedTwins.length > 0) {
      warn(
        `${systemScopedTwins.length} component twin${systemScopedTwins.length === 1 ? "" : "s"} ` +
          `send${systemScopedTwins.length === 1 ? "s" : ""} no \`x-opsinjs-status\` header, so ` +
          "the build being served predates the per-page machine headers and its " +
          "`x-opsinjs-implemented` is still the system-scoped answer - `true` on every twin, " +
          "including any page whose subject has no code. The header was not compared " +
          "against the pages, because on this build it is not a claim about them. Rebuild the " +
          "site and run this again to check it.",
      )
    }

    /* The system-scoped header, against the roster it is meant to be counting.
       `x-opsinjs-implemented-count` is on every machine response and is the
       number an agent uses to decide whether this design system has any code at
       all; it is derived independently of the JSON body it travels with. */
    const expectedCount = [...rosterImplemented.values()].filter(Boolean).length
    try {
      const headers = (await fetch(`${base}/r/index.json`, { method: "HEAD" })).headers
      const reported = headers.get("x-opsinjs-implemented-count")
      if (reported === null) {
        fail(
          "/r/index.json carries no `x-opsinjs-implemented-count` header. It is part of the " +
            "machine contract in app/_machine/contracts.ts, and it is how a tool reads the " +
            "system's answer without parsing the body.",
        )
      } else if (Number(reported) !== expectedCount) {
        fail(
          `/r/index.json reports x-opsinjs-implemented-count: ${reported}, but its own items ` +
            `array carries ${expectedCount} implemented component${expectedCount === 1 ? "" : "s"}. ` +
            "The header and the body are computed separately and must not disagree.",
        )
      }
    } catch (error) {
      warn(
        `the HEAD request for /r/index.json's headers failed - ${(error as Error).message}. ` +
          "The implemented-count header could not be checked.",
      )
    }
  }

  /* The .md twins. A sample would hide exactly the pages nobody visits, so all of them. */
  const twinUrls = slugs.map(
    (slug) => `${base}${docsMarkdownPath(...(slug === "" ? [] : slug.split("/")))}`,
  )
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
