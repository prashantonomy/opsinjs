/**
 * app/_machine/corpus.ts — one reading of the documentation corpus, shared by
 * every machine surface.
 *
 * The `.md` twin route, `llms.txt`, `llms-full.txt`, the three shards,
 * `/r/docs.json` and `/rss.xml` are seven answers to the same question — "what
 * does this site say?" — asked at seven granularities. They agree because they
 * all come through here.
 *
 * THE PAGE TEXT API. Page bodies are read with `await page.data.getText(
 * "processed")`. `page.data.content` does not exist in fumadocs 16 and fails
 * typecheck with TS2339; `source.config.ts` enables
 * `postprocess: { includeProcessedMarkdown: true }`, without which
 * `getText("processed")` is unavailable at runtime.
 *
 * WHAT "PROCESSED" DOES AND DOES NOT DO — measured, not assumed. With the
 * boolean form of `includeProcessedMarkdown`, remark runs and the MDAST is
 * stringified back to markdown: imports are stripped, headings gain explicit
 * ids, code blocks and tables come out as markdown. JSX ELEMENTS ARE NOT
 * RENDERED. `<StubNotice component="score-dial" issue="42" />` comes out
 * verbatim, attributes and all — the sentence that component renders in the
 * browser is not in the string. Verified against fumadocs-mdx 15.4.0.
 *
 * That is survivable, and this module is built around it rather than pretending
 * otherwise. The attributes are themselves machine-readable, every page carries
 * `notImplementedNotice()` in plain prose so the one fact that must not be
 * missed is never inside a tag, and `jsxNotice()` tells the reader what the
 * remaining elements are and where their data lives.
 *
 * To render the vocabulary to prose instead, `source.config.ts` would need
 * `includeProcessedMarkdown: { output: "function" }` and every call site would
 * pass markdown implementations of the components:
 * `getText("processed", { components })`. That is a real improvement and a real
 * piece of work — it needs a markdown twin of the whole MDX vocabulary — so it
 * is recorded here rather than half-done.
 */

import { source } from "@/lib/source"
import { absoluteUrl, SITE_NAME, SITE_URL } from "./contracts"

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
 * The sixteen groups of the sidebar, in the order the root `meta.json`
 * declares them. `sectionOf` maps a page to exactly one of these, so a page
 * appears exactly once in `llms.txt` — which `check-llms.mts` asserts.
 */
export const SECTIONS: SectionDescriptor[] = [
  {
    id: "",
    title: "Introduction",
    blurb:
      "What opsinjs is, who it is for, and the one claim it makes about health interfaces.",
  },
  {
    id: "start",
    title: "Start here",
    blurb:
      "Installation, the five-minute map of the site, and an honest fit checklist that says no to clinician-facing and regulated-device work.",
  },
  {
    id: "recipes",
    title: "Recipes",
    blurb:
      "Task-first pages: the components, tokens and copy rules for one job, in one scroll.",
  },
  {
    id: "components",
    title: "Components",
    blurb:
      "Twenty-four specifications. None is implemented; each states intent, the clinical contract, the proposed API and the accessibility bar it must clear.",
  },
  {
    id: "screens",
    title: "Screens",
    blurb:
      "Whole-screen specimens — the two colour axes, the material ladder and motion working together rather than in isolation.",
  },
  {
    id: "health",
    title: "Health",
    blurb:
      "The doctrine layer: clinical status semantics, reference ranges, numbers and units, alarm fatigue, consent, uncertainty. Real today, and independent of any component.",
  },
  {
    id: "foundations",
    title: "Foundations",
    blurb:
      "What a token means — colour, materials, motion, typography, shape, space, data states and data visualisation.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    blurb:
      "Split by role, with a curated path for compliance reviewers and generated, dated contrast measurements.",
  },
  {
    id: "content",
    title: "Content & language",
    blurb:
      "Writing for a patient reader: voice and tone across the four status levels, health literacy, and the plain-English A–Z.",
  },
  {
    id: "patterns",
    title: "Patterns",
    blurb:
      "Components, tokens and guidance assembled for exactly one user task — disclosing a result, logging daily, escalating an alert.",
  },
  {
    id: "handbook",
    title: "Handbook",
    blurb:
      "Mechanics: styling hooks, data attributes, composition, forms, dark mode, error codes, and how to contribute a component.",
  },
  {
    id: "theming",
    title: "Theming & tokens",
    blurb:
      "How to change what a token means — the theme generator, preset codes, category and status palettes, and Tailwind v4 ordering traps.",
  },
  {
    id: "agents",
    title: "Agents & automation",
    blurb:
      "The surfaces that are contractually stable for machines, and the rules an assistant must follow to generate safe health UI.",
  },
  {
    id: "registry",
    title: "Registry & distribution",
    blurb:
      "Shipping as a shadcn-spec registry: namespaces, registry.json, preset codes, version stamps and upgrade diffs.",
  },
  {
    id: "reference",
    title: "Reference",
    blurb:
      "The generated list of every token, data attribute, CSS variable, key binding, type, contrast pair and glossary term.",
  },
  {
    id: "project",
    title: "Project",
    blurb:
      "State of the system, roadmap, release phases, versioning policy, decision records, changelog and licensing.",
  },
]

const SECTION_BY_ID = new Map(SECTIONS.map((section) => [section.id, section]))

const FALLBACK_SECTION: SectionDescriptor = {
  id: "other",
  title: "Other pages",
  blurb: "Pages that do not sit under one of the sixteen documentation groups.",
}

export function sectionOf(page: CorpusPage): SectionDescriptor {
  const first = page.slugs[0] ?? ""
  return SECTION_BY_ID.get(first) ?? FALLBACK_SECTION
}

/** Shards published as their own `llms-*.txt` file. */
export const SHARDS = {
  components: {
    file: "/llms-components.txt",
    title: "Components and screens",
    sections: ["components", "screens"],
    blurb:
      "Every component specification and every screen specimen. Read this before answering a question about what opsinjs provides.",
  },
  health: {
    file: "/llms-health.txt",
    title: "Health, accessibility and content doctrine",
    sections: ["health", "accessibility", "content"],
    blurb:
      "The rules that decide what a health interface may assert, how it must be operable, and how it must be worded.",
  },
  foundations: {
    file: "/llms-foundations.txt",
    title: "Foundations, theming and generated reference",
    sections: ["foundations", "theming", "reference"],
    blurb:
      "What each token means, how to change it, and the generated list of every one.",
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
  status: string
  kind?: string
  since?: string
  category?: string
  aliases: string[]
  owner?: string
  reviewed?: string
  reviewer?: string
  reviewEvery?: string
  a11yDate?: string
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
    status: str(data.status) ?? "planned",
    kind: str(data.kind),
    since: str(data.since),
    category: str(data.category),
    aliases: strings(data.aliases),
    owner: str(data.owner),
    reviewed: str(data.reviewed),
    reviewer: str(data.reviewer),
    reviewEvery: str(data.reviewEvery),
    a11yDate: str(data.a11yDate),
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

function annotations(meta: PageMeta): string[] {
  const notes: string[] = [`status: ${meta.status}`]
  if (meta.kind) notes.push(`kind: ${meta.kind}`)
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
 * of the authored frontmatter: it adds the canonical URL and the
 * not-implemented marker, so a page read in isolation still knows where it
 * came from and what it may be used for.
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
  put("since", meta.since)
  put("category", meta.category)
  put("evidence", meta.evidence)
  put("reviewed", meta.reviewed)
  put("reviewer", meta.reviewer)
  put("a11yDate", meta.a11yDate)
  putList("aliases", meta.aliases)
  putList("implements", meta.implements)
  putList("governedBy", meta.governedBy)
  putList("usedIn", meta.usedIn)
  lines.push("implemented: false")
  lines.push("---")
  return lines.join("\n")
}

/**
 * The one-paragraph warning that precedes any page describing a component. It
 * is repeated per page rather than stated once at the top of a shard because a
 * page is very often read alone, retrieved by a search, with no preamble.
 */
export function notImplementedNotice(page: CorpusPage): string | null {
  const meta = metaOf(page)
  if (meta.status !== "planned" && meta.status !== "considered") return null
  const verb =
    meta.status === "considered"
      ? "is on the considered roster and has no specification page yet"
      : "is a specification and has not been implemented"
  return [
    `> NOT IMPLEMENTED. "${meta.title}" ${verb}.`,
    "> Do not generate code against the API sketched below, and do not tell a",
    `> reader that it exists. The definitive machine answer is at ${SITE_URL}/r/index.json.`,
  ].join("\n")
}

/** Documentation components appear as `<PascalCase …/>` in processed markdown. */
const JSX_ELEMENT = /<[A-Z][A-Za-z0-9]*[\s/>]/

/**
 * A one-line explanation of the JSX elements the reader is about to meet.
 *
 * Emitted only when there are some. It exists because an agent that finds
 * `<ContrastReport scope="materials" />` in a markdown file has two reasonable
 * readings — that the page is broken, or that a table is missing — and both are
 * wrong. The third reading, that the element is a named view onto data that is
 * published separately and can be fetched, is the useful one, so it is stated.
 */
export function jsxNotice(body: string): string | null {
  if (!JSX_ELEMENT.test(body)) return null
  return [
    "> Elements written as `<PascalCase … />` below are opsinjs documentation",
    "> components. Their attributes are the content: the values they render are",
    "> generated from `tokens/*.json` and `registry/catalogue.ts` and are",
    `> published separately at ${SITE_URL}/r/index.json and under the Reference`,
    "> section. Nothing is missing from this page — the data simply does not",
    "> live in the prose.",
  ].join("\n")
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
 */
export function jsxPreamble(): string {
  return [
    "Elements written as `<PascalCase … />` in the pages below are opsinjs",
    "documentation components. Their attributes are the content; the tables and",
    "figures they render are generated from `tokens/*.json` and",
    "`registry/catalogue.ts` and are published separately under the Reference",
    `section and at ${SITE_URL}/r/index.json.`,
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
 * em dashes and middots, so the two differ by about 0.2% — enough for a
 * "capped" llms-full.txt to ship 880 kB against a 879 kB cap and warn on every
 * run. Counting what the transport counts makes the cap true.
 */
export const BUDGETS = {
  full: 900_000,
  shard: 400_000,
  bundle: 2_000_000,
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

export function truncationNotice(result: Assembled, shardHint: string): string {
  if (result.omitted === 0) return ""
  return [
    "---",
    "",
    `## Truncated`,
    "",
    `${result.omitted} of ${result.included + result.omitted} pages were omitted to keep this file inside its size budget.`,
    shardHint,
  ].join("\n")
}

/** The header every corpus file opens with. */
export function bundleHeader(
  title: string,
  blurb: string,
  extra: string[] = []
): string {
  return [`# ${SITE_NAME} — ${title}`, "", `> ${blurb}`, "", ...extra].join(
    "\n"
  )
}

/* ------------------------------------------------------------------ *
 * Whole-corpus files
 * ------------------------------------------------------------------ */

/**
 * Build one of the four concatenated corpus files: `llms-full.txt` and the
 * three shards. They differ only in which sections they include and how much
 * they are allowed to carry, so they are one function — a shard that drifted
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
  const pages =
    options.sections === null ? allPages() : pagesInSections(options.sections)

  const chunks: { key: string; text: string }[] = []
  for (const page of pages) {
    chunks.push({ key: page.url, text: await renderPageInBundle(page) })
  }

  const assembled = assemble(chunks, options.budget)
  const covered = groupBySection(pages).map(
    (group) => `${group.section.title} (${group.pages.length})`
  )

  const header = bundleHeader(options.title, options.blurb, [
    `Pages: ${assembled.included}${assembled.omitted > 0 ? ` of ${pages.length}` : ""}.`,
    `Sections: ${covered.join(" · ") || "none yet"}.`,
    "",
    "NOTHING IN THIS SYSTEM IS IMPLEMENTED. Every component page below is a specification. Do not generate code against a proposed API and do not describe a component as shipping.",
    "",
    jsxPreamble(),
    "",
    ...(options.notes ?? []),
  ])

  const truncation = truncationNotice(assembled, options.overflowHint)

  return `${[header, assembled.body, truncation].filter(Boolean).join("\n\n").trimEnd()}\n`
}
