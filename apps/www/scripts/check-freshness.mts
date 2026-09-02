/**
 * check-freshness.mts - reports pages past their review window.
 *
 *   node scripts/check-freshness.mts            # report; always exits 0
 *   node scripts/check-freshness.mts --strict   # exit 1 when anything is overdue
 *   node scripts/check-freshness.mts --json     # machine-readable, for the nightly summary
 *
 * Advisory in CI, blocking in the nightly job. That split is deliberate: a page
 * going stale is not a reason to block someone else's pull request, but it is a
 * reason to wake somebody up on a schedule.
 *
 * WHY A HEALTH DESIGN SYSTEM NEEDS THIS. Guidance about how to present a
 * clinical value is not durable in the way a button's API is. Reference ranges
 * change, terminology changes, the evidence changes, and a confidently-worded
 * page from three years ago is worse than no page - a reader cannot tell the
 * difference between advice that is current and advice that has merely survived.
 * So every page declares who reviews it and how often, and this script is what
 * makes the declaration mean something.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/check-freshness.mts needs Node 24 or newer.",
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

/**
 * The default review window per page kind, applied when a page declares no
 * `reviewEvery`. These are opsinjs policy, published on project/docs-freshness.
 *
 * Health and accessibility pages are on the short cycle because they make
 * claims about people; reference pages are generated and are checked by the
 * drift gate instead, so their cadence is about the prose header only.
 */
const DEFAULT_CADENCE: Record<string, "3m" | "6m" | "12m" | "never"> = {
  health: "6m",
  accessibility: "6m",
  content: "12m",
  component: "12m",
  foundation: "12m",
  pattern: "12m",
  recipe: "12m",
  screen: "12m",
  handbook: "12m",
  guide: "12m",
  project: "6m",
  reference: "never",
}

const MONTHS: Record<string, number> = { "3m": 3, "6m": 6, "12m": 12 }

/** Reported before it expires, so a review can be scheduled rather than missed. */
const DUE_SOON_DAYS = 30

interface PageRow {
  slug: string
  file: string
  kind: string
  status: string
  reviewer?: string
  owner?: string
  reviewed?: string
  cadence: string
  dueOn?: string
  daysOverdue?: number
  state: "overdue" | "due-soon" | "current" | "never-reviewed" | "exempt"
}

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

function walk(dir: string, out: string[]): void {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (entry.name.endsWith(".mdx")) out.push(full)
  }
}

function frontmatterOf(file: string): Record<string, string> {
  let contents: string
  try {
    contents = readFileSync(file, "utf8")
  } catch {
    return {}
  }
  const lines = contents.split("\n")
  if ((lines[0] ?? "").trim() !== "---") return {}
  const front: Record<string, string> = {}
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (line.trim() === "---") break
    const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (!match) continue
    const value = (match[2] ?? "").trim().replace(/^["']|["']$/g, "")
    if (value !== "" && !value.startsWith("[")) front[match[1] as string] = value
  }
  return front
}

function addMonths(iso: string, months: number): Date {
  const date = new Date(`${iso}T00:00:00Z`)
  const result = new Date(date)
  result.setUTCMonth(result.getUTCMonth() + months)
  return result
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000)
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length)
}

/* ------------------------------------------------------------------ *
 * Main                                                                *
 * ------------------------------------------------------------------ */

function main(): void {
  const strict = process.argv.includes("--strict")
  const asJson = process.argv.includes("--json")

  let stats: ReturnType<typeof statSync> | undefined
  try {
    stats = statSync(DOCS_DIR)
  } catch {
    stats = undefined
  }
  if (!stats?.isDirectory()) {
    console.log("check-freshness: content/docs does not exist yet - nothing to review.")
    return
  }

  const files: string[] = []
  walk(DOCS_DIR, files)
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`)

  const rows: PageRow[] = files.map((file) => {
    const front = frontmatterOf(file)
    const slug = relative(DOCS_DIR, file).replace(/\.mdx$/, "").split(sep).join("/")
    const kind = front.kind ?? "unset"
    const cadence = front.reviewEvery ?? DEFAULT_CADENCE[kind] ?? "12m"

    const base: PageRow = {
      slug,
      file: relative(APP_DIR, file).split(sep).join("/"),
      kind,
      status: front.status ?? "unset",
      reviewer: front.reviewer,
      owner: front.owner,
      reviewed: front.reviewed,
      cadence,
      state: "current",
    }

    if (cadence === "never") return { ...base, state: "exempt" }
    if (!front.reviewed || !/^\d{4}-\d{2}-\d{2}$/.test(front.reviewed)) {
      return { ...base, state: "never-reviewed" }
    }

    const due = addMonths(front.reviewed, MONTHS[cadence] ?? 12)
    const overdue = daysBetween(today, due)
    return {
      ...base,
      dueOn: isoDate(due),
      daysOverdue: overdue,
      state: overdue > 0 ? "overdue" : overdue > -DUE_SOON_DAYS ? "due-soon" : "current",
    }
  })

  const overdue = rows
    .filter((row) => row.state === "overdue")
    .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0))
  const dueSoon = rows
    .filter((row) => row.state === "due-soon")
    .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0))
  const neverReviewed = rows.filter((row) => row.state === "never-reviewed")

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          $generatedBy: "scripts/check-freshness.mts",
          checkedOn: isoDate(today),
          totals: {
            pages: rows.length,
            overdue: overdue.length,
            dueSoon: dueSoon.length,
            neverReviewed: neverReviewed.length,
            exempt: rows.filter((row) => row.state === "exempt").length,
          },
          overdue,
          dueSoon,
          neverReviewed,
        },
        null,
        2,
      ),
    )
    if (strict && overdue.length > 0) process.exit(1)
    return
  }

  const table = (title: string, subset: PageRow[]) => {
    if (subset.length === 0) return
    console.log(`\n${title}`)
    console.log(
      `  ${pad("page", 46)}${pad("kind", 14)}${pad("reviewer", 12)}${pad("reviewed", 12)}due`,
    )
    for (const row of subset.slice(0, 60)) {
      const due =
        row.state === "never-reviewed"
          ? "no review date"
          : `${row.dueOn} (${(row.daysOverdue ?? 0) > 0 ? `${row.daysOverdue} days over` : `in ${-(row.daysOverdue ?? 0)} days`})`
      console.log(
        `  ${pad(row.slug, 46)}${pad(row.kind, 14)}${pad(row.reviewer ?? "-", 12)}${pad(
          row.reviewed ?? "-",
          12,
        )}${due}`,
      )
    }
    if (subset.length > 60) console.log(`  ... and ${subset.length - 60} more`)
  }

  console.log(
    `check-freshness: ${rows.length} pages as of ${isoDate(today)} - ` +
      `${overdue.length} overdue, ${dueSoon.length} due within ${DUE_SOON_DAYS} days, ` +
      `${neverReviewed.length} never reviewed.`,
  )

  table("OVERDUE", overdue)
  table(`DUE WITHIN ${DUE_SOON_DAYS} DAYS`, dueSoon)
  table("NO REVIEW DATE", neverReviewed)

  if (neverReviewed.length > 0) {
    console.log(
      [
        "",
        "  A page with no `reviewed:` date has never been through review, which is",
        "  different from being out of date and is worth fixing first: it is the set of",
        "  pages nobody has yet taken responsibility for.",
      ].join("\n"),
    )
  }

  if (overdue.length > 0) {
    console.log(
      [
        "",
        "  To clear an entry: read the page, correct what is no longer true, and set",
        "  `reviewed:` to today with the reviewing discipline in `reviewer:`. Bumping the",
        "  date without reading the page is the one failure mode this whole mechanism has.",
      ].join("\n"),
    )
  }

  if (strict && overdue.length > 0) process.exit(1)
}

main()
