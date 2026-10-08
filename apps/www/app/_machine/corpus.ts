/**
 * app/_machine/corpus.ts is one reading of the documentation corpus, shared by
 * every machine surface.
 *
 * "What does this site say?" is one question asked at seven granularities. The
 * `.md` twin route, `llms.txt`, `llms-full.txt`, the three shards,
 * `/r/docs.json` and `/rss.xml` are its seven answers. They agree because they
 * all come through here.
 *
 * THE PAGE TEXT API. Page bodies are read with `await page.data.getText(
 * "processed")`. `page.data.content` does not exist in fumadocs 16 and fails
 * typecheck with TS2339; `source.config.ts` enables
 * `postprocess: { includeProcessedMarkdown: true }`, without which
 * `getText("processed")` is unavailable at runtime.
 *
 * WHAT "PROCESSED" DOES AND DOES NOT DO. What follows was measured rather than
 * assumed. With the boolean form of `includeProcessedMarkdown`, remark runs and
 * the MDAST is stringified back to markdown: imports are stripped, headings
 * gain explicit ids, code blocks and tables come out as markdown. JSX ELEMENTS
 * ARE NOT RENDERED. `<StubNotice component="score-dial" issue="42" />` comes
 * out verbatim, attributes and all. The sentence that component renders in the
 * browser is not in the string. Verified against fumadocs-mdx 15.4.0.
 *
 * That is survivable, and this module is built around it rather than pretending
 * otherwise. The attributes are themselves machine-readable, a page with no
 * code behind it carries `notImplementedNotice()` in plain prose, and
 * `jsxNotice()` tells the reader what the remaining elements are and where
 * their data lives.
 *
 * `notImplementedNotice()` IS NOT ON EVERY PAGE AND THIS BLOCK USED TO SAY IT
 * WAS. It returns null the moment `registry/__index__.ts` has source behind
 * the id, which is all 60 component pages today, so on exactly the pages
 * where a warning matters most it emits nothing. The fact that must not be
 * missed on those pages is a different fact: that the code installs, that it
 * has been audited against WCAG 2.2 AA by its own authors, and that it has had
 * no independent accessibility review and no clinical review. It lives in the MDX
 * children an author wrote inside `<StubNotice>`, which is the one part of a
 * documentation component that `getText("processed")` keeps, and SAFE001 in
 * `scripts/assert-ia.mts` is what holds it there. So the twin does carry it,
 * in the body rather than in a notice, and `jsxNotice()` below has to say so
 * rather than tell a reader that the prose of these elements lives elsewhere.
 *
 * To render the vocabulary to prose instead, `source.config.ts` would need
 * `includeProcessedMarkdown: { output: "function" }` and every call site would
 * pass markdown implementations of the components:
 * `getText("processed", { components })`. That is a real improvement and a real
 * piece of work, because it needs a markdown twin of the whole MDX vocabulary.
 * It is therefore recorded here rather than half-done.
 */

import { source } from "@/lib/source"
import {
  absoluteUrl,
  implementedComponents,
  SITE_NAME,
  SITE_URL,
} from "./contracts"

export type CorpusPage = (typeof source)["$inferPage"]

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

export interface SectionDescriptor {
  /** First path segment under `content/docs`. `""` is the corpus index page. */
  id: string
  title: string
  /** One line, written for a reader deciding whether to open the section. */
  blurb: string
}

/**
 * The six sections of the sidebar, in the order the root `meta.json` declares
 * them. `sectionOf` maps a page to exactly one of these, so a page appears
 * exactly once in `llms.txt`. That is what `check-llms.mts` asserts. The
 * top-level pages (the introduction and the guides beside it) form the first.
 */
export const SECTIONS: SectionDescriptor[] = [
  {
    id: "",
    title: "Introduction and guides",
    blurb:
      "What opsinjs is and who it is for, then getting started, Next.js, theming, styling, the registry, agents and how to read these docs.",
  },
  {
    id: "foundations",
    title: "Foundations",
    blurb:
      "Accessibility, colour, typography, space, shape, motion, materials, icons, imagery, data visualisation, states and writing.",
  },
  {
    id: "components",
    title: "Components",
    /* No count here, deliberately. This string is a module-level constant and
       is served verbatim as `sections[].description` in `/r/docs.json`, which
       is read offline with no way to check a number. So it names the fields
       that carry the answer instead. */
    blurb:
      "Every component in the catalogue. Each entry's `status`, and `implemented` in /r/index.json, say whether it installs; none has had an independent accessibility review or a clinical review.",
  },
  {
    id: "health",
    title: "Health",
    blurb:
      "The doctrine layer: the two colour axes, alerts, numbers and units, reference ranges, trends, high-stakes moments, consent and privacy, and the safety review.",
  },
  {
    id: "patterns",
    title: "Patterns",
    blurb:
      "Multi-screen sequences a health product keeps rebuilding, such as disclosing a result, logging daily or escalating an alert, plus forms.",
  },
  {
    id: "reference",
    title: "Reference",
    blurb:
      "The generated list of every token, CSS variable, data attribute, key binding, contrast pair and type, plus error codes and the glossaries.",
  },
]

const SECTION_BY_ID = new Map(SECTIONS.map((section) => [section.id, section]))

/** A top-level page that is not a section folder belongs to the first section. */
export function sectionOf(page: CorpusPage): SectionDescriptor {
  const first = page.slugs.length > 1 || SECTION_BY_ID.has(page.slugs[0] ?? "")
    ? (page.slugs[0] ?? "")
    : ""
  return SECTION_BY_ID.get(first) ?? (SECTIONS[0] as SectionDescriptor)
}

/** Shards published as their own `llms-*.txt` file. */
export const SHARDS = {
  components: {
    file: "/llms-components.txt",
    title: "Components",
    sections: ["components"],
    blurb:
      "Every component page, each carrying its own status. Read this before answering a question about what opsinjs provides.",
  },
  health: {
    file: "/llms-health.txt",
    title: "Health doctrine",
    sections: ["health"],
    blurb:
      "The rules that decide what a health interface may assert and how it must say it.",
  },
  foundations: {
    file: "/llms-foundations.txt",
    title: "Foundations",
    sections: ["foundations"],
    blurb:
      "What each token means, accessibility, and writing. The generated list of every token is the reference shard.",
  },
  /* Reference is its own shard because its generated tables are most of the
     corpus by bytes, and riding with Foundations they spent its budget before
     the doctrine it is named after. */
  reference: {
    file: "/llms-reference.txt",
    title: "Generated reference",
    sections: ["reference"],
    blurb:
      "Every token, CSS variable, measured contrast pair and exported type, generated from the same sources the build uses.",
  },
} as const

export type ShardId = keyof typeof SHARDS

/* ------------------------------------------------------------------ *
 * Frontmatter, read defensively
 * ------------------------------------------------------------------ */

/**
 * The frontmatter fields the machine surfaces publish. Read through a cast
 * because `.source/` is generated with `@ts-nocheck`: the zod inference is
 * reliable in practice but is not something seventeen routes should depend on
 * for their type-safety.
 */
export interface PageMeta {
  title: string
  description?: string
  /**
   * OPTIONAL, AND ABSENT ON EVERY PAGE THAT IS NOT A COMPONENT. Only a `kind: component`
   * page carries a release phase; everywhere else the word used to mean "this
   * prose is finished" and is gone. It used to be filled in with `"planned"`
   * when the page declared none, which published "this has not been built"
   * about finished doctrine pages. Read it as "no phase applies" rather than
   * as a missing value, and leave the key out of a payload when it is absent
   * rather than emitting `undefined`.
   */
  status?: string
  kind?: string
  category?: string
  aliases: string[]
  reviewed?: string
  reviewer?: string
  reviewEvery?: string
  implements: string[]
  governedBy: string[]
  usedIn: string[]
  evidence?: string
  full?: boolean
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export function metaOf(page: CorpusPage): PageMeta {
  const data = page.data as unknown as Record<string, unknown>
  return {
    title: str(data.title) ?? page.slugs.at(-1) ?? "Untitled",
    description: str(data.description),
    status: str(data.status),
    kind: str(data.kind),
    category: str(data.category),
    aliases: strings(data.aliases),
    reviewed: str(data.reviewed),
    reviewer: str(data.reviewer),
    reviewEvery: str(data.reviewEvery),
    implements: strings(data.implements),
    governedBy: strings(data.governedBy),
    usedIn: strings(data.usedIn),
    evidence: str(data.evidence),
    full: typeof data.full === "boolean" ? data.full : undefined,
  }
}

/* ------------------------------------------------------------------ *
 * Page selection
 * ------------------------------------------------------------------ */

const sectionRank = new Map(
  SECTIONS.map((section, index) => [section.id, index])
)

/**
 * Every page, in reading order: section by section as the sidebar declares
 * them, then alphabetically by URL inside a section. Deterministic, so a
 * rebuild with no content change produces a byte-identical `llms.txt`.
 */
export function allPages(): CorpusPage[] {
  return [...source.getPages()].sort((a, b) => {
    const rankA = sectionRank.get(sectionOf(a).id) ?? SECTIONS.length
    const rankB = sectionRank.get(sectionOf(b).id) ?? SECTIONS.length
    if (rankA !== rankB) return rankA - rankB
    // A section's own index page sorts above its children.
    const aIsIndex = a.slugs.length <= 1
    const bIsIndex = b.slugs.length <= 1
    if (aIsIndex !== bIsIndex) return aIsIndex ? -1 : 1
    return a.url.localeCompare(b.url)
  })
}

export function pagesInSections(ids: readonly string[]): CorpusPage[] {
  const wanted = new Set(ids)
  return allPages().filter((page) => wanted.has(sectionOf(page).id))
}

export function groupBySection(
  pages: CorpusPage[]
): { section: SectionDescriptor; pages: CorpusPage[] }[] {
  const groups = new Map<
    string,
    { section: SectionDescriptor; pages: CorpusPage[] }
  >()
  for (const page of pages) {
    const section = sectionOf(page)
    let group = groups.get(section.id)
    if (!group) {
      group = { section, pages: [] }
      groups.set(section.id, group)
    }
    group.pages.push(page)
  }
  return [...groups.values()]
}

/* ------------------------------------------------------------------ *
 * URLs
 * ------------------------------------------------------------------ */

/** Canonical, absolute URL of a page. */
export function pageUrl(page: CorpusPage): string {
  return absoluteUrl(page.url)
}

/**
 * The `.md` twin. `next.config.mjs` rewrites `/…/:path*.md` onto the
 * `llms.mdx` route, so appending `.md` to any documentation URL returns that
 * page's processed markdown. This is the one URL transformation an agent may
 * guess.
 */
export function pageMarkdownUrl(page: CorpusPage): string {
  return `${absoluteUrl(page.url)}.md`
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

/**
 * The built set as a lookup, resolved once per build.
 *
 * Lazily, and never as a module-level `const`: `implementedComponents()`
 * reaches through `./contracts` into `lib/registry.ts`, and evaluating it while
 * a module is still initialising is the ReferenceError that file's docblock
 * warns about. Memoised because `renderFrontmatter` runs once per page and this
 * corpus has four hundred of them.
 */
let builtIdCache: Set<string> | null = null

function builtIds(): Set<string> {
  if (!builtIdCache) builtIdCache = new Set(implementedComponents())
  return builtIdCache
}

/**
 * The catalogue id this page documents, or `null` when it documents no single
 * component.
 *
 * Only `content/docs/components/<id>.mdx` carrying `kind: component` qualifies.
 * The same directory also holds the section overview (`kind: guide`), which is
 * not a component and has no catalogue id or anything to install.
 */
export function componentIdOf(page: CorpusPage): string | null {
  if (page.slugs[0] !== "components" || page.slugs.length !== 2) return null
  if (metaOf(page).kind !== "component") return null
  return page.slugs[1] ?? null
}

/**
 * Whether the thing THIS page documents has been built, or `undefined` when the
 * page documents no such thing.
 *
 * Three surfaces need this answer about one page. They are the twin's
 * `implemented:` frontmatter, its `x-opsinjs-implemented` header, and the page
 * record in `/r/docs.json`. Before this they disagreed: the frontmatter
 * answered per page, the header answered for the system, and the bundle did not
 * answer at all while its own docblock said it did. One function, three
 * callers.
 *
 * A component page answers for its catalogue id. Everything else documents
 * nothing that can be built, and gets `undefined` rather than a `false` that
 * would assert something untrue about a page that is real today. That covers a
 * guide, a doctrine page, a pattern and a generated token reference.
 */
export function pageImplemented(page: CorpusPage): boolean | undefined {
  const componentId = componentIdOf(page)
  if (componentId) return builtIds().has(componentId)
  return undefined
}

function annotations(meta: PageMeta): string[] {
  /* `kind` leads now, because it is on every page and the phase is on sixty of
     them. A guide's entry reads `(kind: guide)` and names no phase, which is
     the truth: nothing about a guide is planned, shipped or deprecated. */
  const notes: string[] = []
  if (meta.kind) notes.push(`kind: ${meta.kind}`)
  if (meta.status) notes.push(`status: ${meta.status}`)
  if (meta.evidence) notes.push(`evidence: ${meta.evidence}`)
  if (meta.aliases.length > 0)
    notes.push(`also known as: ${meta.aliases.join(", ")}`)
  return notes
}

/** One `llms.txt` list entry: link, description, and the machine annotations. */
export function renderIndexEntry(page: CorpusPage): string {
  const meta = metaOf(page)
  const description = meta.description
    ? ` ${meta.description.replace(/\s+/g, " ").trim()}`
    : ""
  return `- [${meta.title}](${pageUrl(page)}):${description} (${annotations(meta).join(" · ")})`
}

/**
 * YAML frontmatter for a single page's markdown twin. Deliberately a superset
 * of the authored frontmatter: it adds the canonical URL and, on a component
 * page, the implementation marker read from the registry index. A page read in
 * isolation therefore still knows where it came from and what it may be used
 * for.
 */
export function renderFrontmatter(page: CorpusPage): string {
  const meta = metaOf(page)
  const lines: string[] = ["---"]
  const put = (key: string, value: string | undefined) => {
    if (value) lines.push(`${key}: ${JSON.stringify(value)}`)
  }
  const putList = (key: string, values: string[]) => {
    if (values.length > 0)
      lines.push(`${key}: [${values.map((v) => JSON.stringify(v)).join(", ")}]`)
  }
  put("title", meta.title)
  put("description", meta.description)
  put("url", pageUrl(page))
  put("source", pageMarkdownUrl(page))
  put("section", sectionOf(page).title)
  put("status", meta.status)
  put("kind", meta.kind)
  put("category", meta.category)
  put("evidence", meta.evidence)
  put("reviewed", meta.reviewed)
  put("reviewer", meta.reviewer)
  putList("aliases", meta.aliases)
  putList("implements", meta.implements)
  putList("governedBy", meta.governedBy)
  putList("usedIn", meta.usedIn)
  /* The one field on this page that nobody authored, and therefore the one
     field no MDX edit can correct. It used to be the literal `false`, which
     told every reader that the twenty-four built components did not exist.
     That `false` went out on the same HTTP response whose
     `x-opsinjs-implemented` header said they did, and directly under a
     frontmatter phase word saying so too. It is now read from the generated
     index that both of those are read from, which is also the only reason
     this line survived the day `status` stopped meaning "there is code": the
     phase and the implementation answer were never the same claim, and only
     one of them was ever measured.

     It is emitted only on a page that documents something buildable, which
     means a component or a screen specimen. That is what `pageImplemented()`
     decides, and what the twin's `x-opsinjs-implemented` header and the
     `/r/docs.json` page record now decide with it. A health doctrine page, a
     token reference or an ADR is not an unimplemented anything; stamping
     `implemented: false` on one asserts something false about a page that is
     real today. */
  const implemented = pageImplemented(page)
  if (implemented !== undefined) lines.push(`implemented: ${implemented}`)
  lines.push("---")
  return lines.join("\n")
}

/**
 * The one-paragraph warning that precedes an unbuilt component or screen
 * specification. It is repeated per page rather than stated once at the top of
 * a shard because a page is very often read alone, retrieved by a search, with
 * no preamble.
 *
 * IT IS DECIDED BY THE REGISTRY, NOT BY THE WORD. `pageImplemented()` reads
 * the generated index: it answers `true` or `false` for a component page and a
 * screen page, and `undefined` for everything else, because a guide, a
 * handbook chapter, a foundation or an ADR documents nothing that can be
 * built. That `undefined` is what scopes this notice, so the `kind` guard that
 * used to do the scoping is gone rather than duplicated. Stamping "do not tell
 * a reader that it exists" on the `.md` twin of `/docs/start/installation`
 * contradicted the working install instructions twenty lines below it, in the
 * one copy of the page only machines read, and that is the mistake the scope
 * exists to prevent.
 *
 * It used to read `status: planned` instead, and the two answers disagree.
 * `content/docs/screens/results-screen.mdx` was `planned` while
 * `registry/screens/results-screen.tsx` existed, so its twin carried NOT
 * IMPLEMENTED about a screen that had been composed. A phase word is a claim
 * somebody typed; the index is a directory listing. Read the listing.
 *
 * This notice is the specific signal and it says something a phase alone
 * cannot: do not write code against the API sketched below. Keep it narrow
 * enough to stay true.
 */
export function notImplementedNotice(page: CorpusPage): string | null {
  const implemented = pageImplemented(page)
  if (implemented !== false) return null
  const meta = metaOf(page)
  return [
    `> NOT IMPLEMENTED. "${meta.title}" is a specification and has not been implemented.`,
    "> Do not generate code against the API sketched below, and do not tell a",
    `> reader that it exists. The definitive machine answer is at ${SITE_URL}/r/index.json.`,
  ].join("\n")
}

/**
 * The response headers that are true of ONE documentation twin.
 *
 * `x-opsinjs-kind` IS THE SCOPE MARKER, and it is sent on every twin. It says
 * which of these headers the reader is entitled to expect, and it is the
 * header `scripts/check-llms.mts` uses to tell a per-page build from an older
 * system-scoped one. `x-opsinjs-status` used to do that job, which worked only
 * while every page carried a phase. Now that only a component page does, an absent
 * `x-opsinjs-status` means "this page is not a component", and taking that for
 * "this build is old" would have made the check silently stop comparing.
 *
 * `x-opsinjs-status` is therefore sent only by a `kind: component` page, and
 * it is that component's release phase. `/r/<id>.json` has always sent one;
 * the twin route did not, which left an agent doing
 * `HEAD /docs/components/toast.md` holding a single system-scoped
 * `x-opsinjs-implemented: true` with nothing to qualify it. For a page whose
 * subject has no code that is not ambiguity, it is a wrong answer to the only
 * question the header exists to answer.
 *
 * `x-opsinjs-implemented` is overridden whenever `pageImplemented()` has an
 * answer for this page, exactly as `/r/<id>.json` overrides it. A guide, a
 * handbook chapter or a doctrine page names nothing buildable, so it has none,
 * and the system-scoped value from `implementedHeaders()` stands: that is what
 * the contract in `./contracts` says the header means off a per-item route, and
 * it is not misleading on a page whose subject IS the system.
 * `x-opsinjs-implemented-count` is untouched either way, so the system answer
 * is on every response regardless.
 */
export function pageHeaders(page: CorpusPage): Record<string, string> {
  const meta = metaOf(page)
  const headers: Record<string, string> = {}
  if (meta.kind) headers["x-opsinjs-kind"] = meta.kind
  if (meta.status) headers["x-opsinjs-status"] = meta.status
  const implemented = pageImplemented(page)
  if (implemented !== undefined) {
    headers["x-opsinjs-implemented"] = String(implemented)
  }
  return headers
}

/** Documentation components appear as `<PascalCase …/>` in processed markdown. */
const JSX_ELEMENT = /<[A-Z][A-Za-z0-9]*[\s/>]/

/**
 * `<StubNotice>` is the one documentation component whose children are read
 * rather than its attributes, so the notices below have to single it out.
 * Neither regular expression is global, so neither carries a `lastIndex`
 * between calls and both are safe to reuse on every page.
 */
const STUB_NOTICE_ELEMENT = /<StubNotice[\s/>]/

/**
 * A one-line explanation of the JSX elements the reader is about to meet.
 *
 * Emitted only when there are some. It exists because an agent that finds
 * `<ContrastReport scope="materials" />` in a markdown file has two reasonable
 * readings. One is that the page is broken and the other is that a table is
 * missing, and both are wrong. The third reading, that the element is a named
 * view onto data that is published separately and can be fetched, is the useful
 * one, so it is stated.
 *
 * `<StubNotice>` GETS A SECOND PARAGRAPH, because the first one is false about
 * it and this notice is injected into the single-page twin, which is how a
 * page is very often read. "Their attributes are the content" and "the data
 * simply does not live in the prose" are true of the self-closing,
 * generated-table elements and are the exact opposite of true here: the
 * children of `<StubNotice>` are authored prose, they survive
 * `getText("processed")`, and they are where all 60 component pages state
 * that the code installs, that it has been audited against WCAG 2.2 AA by its
 * own authors, and that it has had no independent accessibility review and no
 * clinical review. An agent that took the first paragraph at its word would skip the
 * one element on the page it must not skip.
 */
export function jsxNotice(body: string): string | null {
  if (!JSX_ELEMENT.test(body)) return null
  const lines = [
    "> Elements written as `<PascalCase … />` below are opsinjs documentation",
    "> components. Their attributes are the content: the values they render are",
    "> generated from `tokens/*.json` and `registry/catalogue.ts` and are",
    `> published separately at ${SITE_URL}/r/index.json and under the Reference`,
    "> section.",
  ]
  if (STUB_NOTICE_ELEMENT.test(body)) {
    lines.push(
      "> `<StubNotice>` IS THE EXCEPTION, AND IT IS THE ONE TO READ. It is a",
      "> paired element rather than a self-closing one, and the text between",
      "> its opening and closing tags is prose an author wrote, reproduced",
      "> below word for word. That prose is where this page says whether the",
      "> component has been reviewed. Read the children, not only the",
      "> attributes.",
    )
  } else {
    lines.push(
      "> Nothing is missing from this page. The data simply does not live in",
      "> the prose.",
    )
  }
  return lines.join("\n")
}

/**
 * A page as standalone markdown: frontmatter, the notices that apply, then the
 * processed body.
 */
export async function renderPage(
  page: CorpusPage,
  options: { frontmatter?: boolean } = {}
): Promise<string> {
  const body = await page.data.getText("processed")
  const parts: string[] = []
  if (options.frontmatter !== false) parts.push(renderFrontmatter(page))
  const notice = notImplementedNotice(page)
  if (notice) parts.push(notice)
  const jsx = jsxNotice(body)
  if (jsx) parts.push(jsx)
  parts.push(body.trim())
  return `${parts.join("\n\n")}\n`
}

/** A page inside a concatenated corpus file: a rule, a heading, the body. */
export async function renderPageInBundle(page: CorpusPage): Promise<string> {
  const meta = metaOf(page)
  const header = [
    "---",
    "",
    `# ${meta.title}`,
    "",
    `Source: ${pageUrl(page)}`,
    `Markdown: ${pageMarkdownUrl(page)}`,
    `Section: ${sectionOf(page).title} · ${annotations(meta).join(" · ")}`,
  ].join("\n")
  const notice = notImplementedNotice(page)
  const body = (await page.data.getText("processed")).trim()
  return [header, notice, body].filter(Boolean).join("\n\n")
}

/**
 * The paragraph a concatenated corpus file states once, instead of repeating
 * `jsxNotice` under every page.
 *
 * It carries the `<StubNotice>` carve-out unconditionally, because a bundle
 * always contains component pages and therefore always contains the element.
 * There is nothing to test for.
 */
export function jsxPreamble(): string {
  return [
    "Elements written as `<PascalCase … />` in the pages below are opsinjs",
    "documentation components. Their attributes are the content; the tables and",
    "figures they render are generated from `tokens/*.json` and",
    "`registry/catalogue.ts` and are published separately under the Reference",
    `section and at ${SITE_URL}/r/index.json.`,
    "`<StubNotice>` is the exception: it is a paired element, and the prose",
    "between its tags is authored text reproduced here word for word, stating",
    "whether that component has been reviewed. Read its children.",
  ].join(" ")
}

/* ------------------------------------------------------------------ *
 * Size budgets
 * ------------------------------------------------------------------ */

/**
 * BYTE budgets. A file that exceeds its budget is truncated at a PAGE boundary
 * and says so, because half a clinical rule is worse than no clinical rule.
 *
 * These used to be counted in JavaScript string length, on the reasoning that a
 * context window is measured in characters rather than bytes. That is true of a
 * context window and false of everything that carries the file: the response
 * header, the CDN limit and check-llms all count bytes. This corpus is full of
 * middots, and every one of them is three bytes and one character, so the two
 * differ by about 0.2%. That difference is
 * enough for a "capped" llms-full.txt to ship 880 kB against a 879 kB cap and
 * warn on every run. Counting what the transport counts makes the cap true.
 */
/**
 * THE SHARD BUDGET IS NOW BIG ENOUGH FOR THE BIGGEST SHARD, AND THAT IS THE
 * POINT OF IT RATHER THAN A CONCESSION.
 *
 * At 400 kB the three shards carried 65%, 46% and 32% of their own sections.
 * A shard is the file an agent fetches INSTEAD of the whole corpus, so a shard
 * that drops two thirds of its sections is not a smaller answer, it is a
 * quieter wrong one: the reader asked for the health doctrine and got half of
 * it, with no way to know which half. `agents/llms-txt.mdx` says a shard at its
 * budget is a signal that it needs splitting rather than trimming, and
 * splitting is what happened. Reference left the foundations shard and became a
 * shard of its own. The four shards are 599, 630, 576 and 899 kB, so this
 * ceiling leaves the smallest of them room to roughly double.
 *
 * `full` DID NOT MOVE, and that is also deliberate. `/llms-full.txt` is capped
 * by published design: the whole corpus is 3.8 MB, which is more context than
 * most readers of that file have, and the cap is what makes the file usable at
 * all. It truncates at a page boundary, prints what it dropped, and names the
 * four shards that carry those pages whole. That is a documented answer to a
 * real constraint rather than an unmet budget, which is why `check-llms` now
 * fails on a truncated SHARD and only reports a truncated `llms-full.txt`.
 *
 * `bundle` was raised for the reason the shards were. `/r/docs.json` is the
 * OFFLINE bundle, the one file whose whole purpose is that its reader cannot
 * fetch anything else afterwards, and it was carrying 2 MB of a 4.1 MB corpus.
 * Half of what an offline agent needed was behind a network it did not have.
 */
export const BUDGETS = {
  full: 900_000,
  shard: 1_200_000,
  bundle: 5_000_000,
} as const

export interface Assembled {
  body: string
  included: number
  omitted: number
}

export function assemble(
  chunks: { key: string; text: string }[],
  budget: number
): Assembled {
  const kept: string[] = []
  const encoder = new TextEncoder()
  let size = 0
  let included = 0
  for (const chunk of chunks) {
    /* +2 for the blank line this chunk is joined with. */
    const cost = encoder.encode(chunk.text).length + 2
    if (size + cost > budget && included > 0) break
    kept.push(chunk.text)
    size += cost
    included += 1
  }
  return {
    body: kept.join("\n\n"),
    included,
    omitted: chunks.length - included,
  }
}

/**
 * The footer a truncated file ends with, which also carries a manifest of the
 * dropped pages when the caller supplies them.
 *
 * "44 of 68 pages were omitted" tells a reader that something is missing and
 * not one thing about WHAT, which is the harder half of the problem: an agent
 * that cannot name the gap cannot go and fetch it. Each line is a `.md` twin
 * URL, so the manifest is not an apology, it is the fetch list. Callers must
 * pay for it in the byte reservation. See `buildCorpusFile`.
 */
export function truncationNotice(
  result: Assembled,
  shardHint: string,
  omittedPages: readonly CorpusPage[] = []
): string {
  if (result.omitted === 0) return ""
  const manifest =
    omittedPages.length === 0
      ? []
      : [
          "",
          "Nothing here has been hidden. Every page this file dropped is listed",
          "below and can be fetched on its own:",
          "",
          ...omittedPages.map(
            (page) =>
              `- [${metaOf(page).title}](${pageMarkdownUrl(page)}) (${metaOf(page).kind ?? "page"})`
          ),
        ]
  return [
    "---",
    "",
    `## Truncated`,
    "",
    `${result.omitted} of ${result.included + result.omitted} pages were omitted to keep this file inside its size budget.`,
    shardHint,
    ...manifest,
  ].join("\n")
}

/** The header every corpus file opens with. */
export function bundleHeader(
  title: string,
  blurb: string,
  extra: string[] = []
): string {
  return [`# ${title} on ${SITE_NAME}`, "", `> ${blurb}`, "", ...extra].join(
    "\n"
  )
}

/* ------------------------------------------------------------------ *
 * Whole-corpus files
 * ------------------------------------------------------------------ */

/**
 * Reading order, with exactly one exception: inside a section, a page that
 * documents a component with real source behind it is emitted before one that
 * does not.
 *
 * These files are size-capped and truncated at a page boundary, so what gets
 * dropped is the tail. In plain alphabetical order that tail was `metric-tile`
 * through `value`, and it included every page an agent reaching for a health
 * readout would want, while the head kept pages with no code behind them. The
 * shard the site nominates as the authority on "what opsinjs provides" was
 * spending its budget on the wrong half.
 *
 * This does not make the file complete; it makes what survives the useful half.
 * The budget itself is a separate, human decision, and `truncationNotice` now
 * names every page that still did not fit.
 *
 * Promotion is decided by whether something is built, never by status and never
 * by hand, so nothing here has to be maintained as components land. Section
 * order and a section's own index page are untouched, and
 * `Array.prototype.sort` is stable, so pages that tie keep the order
 * `allPages()` gave them.
 *
 * Exported because `/r/docs.json` is the fifth capped file over this corpus and
 * drops its tail for the same reason. A bundle that truncated in plain
 * alphabetical order while the shards truncated in this one would be two
 * different answers to "what did opsinjs give me offline".
 */
export function truncationOrder(pages: CorpusPage[]): CorpusPage[] {
  const built = builtIds()
  const rank = (page: CorpusPage): number => {
    const section = sectionRank.get(sectionOf(page).id) ?? SECTIONS.length
    const isIndex = page.slugs.length <= 1 ? 0 : 1
    const id = componentIdOf(page)
    const isBuilt = id !== null && built.has(id) ? 0 : 1
    return section * 4 + isIndex * 2 + isBuilt
  }
  return [...pages].sort((a, b) => rank(a) - rank(b))
}

/**
 * Build one of the four concatenated corpus files: `llms-full.txt` and the
 * three shards. They differ only in which sections they include and how much
 * they are allowed to carry, so they are one function. A shard that drifted
 * from the full file in header, ordering or truncation behaviour would be a
 * second, quieter version of the same corpus.
 */
export async function buildCorpusFile(options: {
  title: string
  blurb: string
  sections: readonly string[] | null
  budget: number
  /** What to read instead when this file had to drop pages. */
  overflowHint: string
  /** Extra lines for the header block, after the blurb. */
  notes?: string[]
}): Promise<string> {
  const pages = truncationOrder(
    options.sections === null ? allPages() : pagesInSections(options.sections)
  )

  const chunks: { key: string; text: string }[] = []
  for (const page of pages) {
    chunks.push({ key: page.url, text: await renderPageInBundle(page) })
  }

  const covered = groupBySection(pages).map(
    (group) => `${group.section.title} (${group.pages.length})`
  )

  /* The line that says what is built.

     It used to be the literal "NOTHING IN THIS SYSTEM IS IMPLEMENTED", printed
     at the head of all four files whatever the registry contained. An agent
     handed a shard therefore read an all-caps negation four lines before it
     read a component page whose own notice said the opposite, and resolved the
     conflict in favour of the shout. It is now read from the same index
     `/r/index.json` reports.

     It speaks about the SYSTEM rather than about "the pages below", because
     this header is shared: `llms-health.txt` and `llms-reference.txt` carry
     no component page at all, and a sentence about "every component page below"
     is false by reference in both. The count is constant for a given build, so
     it does not disturb the byte reservation underneath. */
  const built = implementedComponents()
  const implementedLine =
    built.length === 0
      ? "NOTHING IN THIS SYSTEM IS IMPLEMENTED. Every component page below is a specification. Do not generate code against a proposed API and do not describe a component as shipping."
      : `${built.length} opsinjs component${built.length === 1 ? " is" : "s are"} implemented and installable; every other component id is a specification or a name reserved so the URL answers. Each page carries its own \`status\`, and ${SITE_URL}/r/index.json carries \`implemented\` per id. Read one of those two before you generate code against any API, and never describe an unimplemented component as shipping.`

  const header = (included: number, omitted: number): string =>
    bundleHeader(options.title, options.blurb, [
      `Pages: ${included}${omitted > 0 ? ` of ${pages.length}` : ""}.`,
      `Sections: ${covered.join(" · ") || "none yet"}.`,
      "",
      implementedLine,
      "",
      jsxPreamble(),
      "",
      ...(options.notes ?? []),
    ])

  /* The budget is the size of the FILE, not the size of the pages in it, so the
     header and any truncation notice are paid for first. Both are measured in
     their worst case, because the header prints "N of M" only when pages were
     dropped and the notice exists only then. The reservation is therefore never
     an underestimate, and the finished file is always inside its budget. Adding
     them afterwards was how a capped llms-full.txt shipped 880 kB against a
     879 kB cap and warned on every single run. */
  const encoder = new TextEncoder()
  const reserved =
    encoder.encode(header(pages.length, pages.length)).length +
    /* The manifest is measured over EVERY page, which is the worst case: the
       real notice lists a subset of the same lines, so the reservation cannot
       be an underestimate. It costs a few per cent of the budget in exchange
       for a file that never drops a page without naming it. */
    encoder.encode(truncationNotice({ body: "", included: 1, omitted: pages.length }, options.overflowHint, pages)).length +
    /* the two "\n\n" joins and the trailing newline */
    5

  const assembled = assemble(chunks, Math.max(0, options.budget - reserved))
  /* `assemble` keeps a prefix of `chunks`, and `chunks` is `pages` in order, so
     the tail is exactly what was dropped. */
  const truncation = truncationNotice(
    assembled,
    options.overflowHint,
    pages.slice(assembled.included)
  )

  return `${[header(assembled.included, assembled.omitted), assembled.body, truncation].filter(Boolean).join("\n\n").trimEnd()}\n`
}
