/**
 * check-dashes.mts - no em dash and no en dash anywhere in the repository.
 *
 *   node scripts/check-dashes.mts
 *
 * The two characters are U+2014 EM DASH and U+2013 EN DASH. This file names
 * them by code point and matches them as the escapes \u2014 and \u2013, so
 * the gate stays ASCII and can never report itself. Every other file that has
 * to talk about the ban is written the same way, which is why there is no
 * allowlist here and no exempt path for an agent to grow.
 *
 * WHY THIS EXISTS. A dash is the one punctuation mark a writer reaches for when
 * the relation between two clauses has not been decided yet, and this corpus is
 * a presentation layer for patient-facing health interfaces, where an undecided
 * relation is a safety defect rather than a style preference. opsinjs prose
 * names its relations instead: a statement a dash would have joined is written
 * as two sentences, as one clause with its connective spelled out, or as two
 * separate elements, and a span between two values is written with the word
 * "to". Nothing else in the toolchain notices either character, which makes the
 * rule unenforceable by review alone once the corpus passes a few hundred
 * pages.
 *
 * WHAT IS NOT SCANNED, and why each one is off the list rather than exempt.
 * `node_modules`, `.next`, `.source`, `.turbo`, `.git`, `dist`, `coverage` and
 * the lockfiles are not bytes this repository wrote. `audits`, `.rawres` and
 * `.playwright-mcp` are dated records of what the site did at a moment in time,
 * and rewriting a record falsifies it. Generated output under `lib/generated`,
 * `registry/generated` and the rest IS scanned: a hit there means a dash
 * reached the generator's source, and the fix belongs in the source file rather
 * than in the artefact.
 *
 * WHAT IS NOT BANNED and must survive a sweep untouched: U+2212 MINUS SIGN,
 * which is arithmetic notation and house style for a negative number; U+2192
 * RIGHT ARROW in the colour maths; U+00B7 MIDDLE DOT; the ASCII hyphen in
 * slugs, ids, custom properties and compound modifiers; and markdown structure
 * built from hyphens, including frontmatter fences, horizontal rules and table
 * delimiter rows. None of them is matched here.
 *
 * DEPENDENCIES: none. Walks the working tree and exits.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/check-dashes.mts needs Node 24 or newer.",
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

import { type Dirent, readdirSync, readFileSync } from "node:fs"
import { join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const ROOT_DIR = join(APP_DIR, "..", "..")

/**
 * The two banned code points, as escapes.
 *
 * Written this way on purpose: a literal in the pattern would make this file
 * its own first offender, and a gate that cannot be run on itself is a gate
 * somebody eventually stops trusting.
 */
const BANNED = new Map<string, string>([
  ["\u2014", "U+2014 EM DASH"],
  ["\u2013", "U+2013 EN DASH"],
])
const PATTERN = /[\u2013\u2014]/gu

/** Directory names never entered, at any depth. */
const SKIPPED_DIRS = new Set([
  "node_modules",
  ".next",
  ".source",
  ".turbo",
  ".git",
  ".vercel",
  "dist",
  "coverage",
  /* Captured evidence. Dated records of what the site did; rewriting one falsifies it. */
  "audits",
  ".rawres",
  ".playwright-mcp",
])

/** File names never read, whatever their extension says. */
const SKIPPED_FILES = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock"])

/** Authored text, by extension. */
const SCANNED_EXTENSIONS = new Set([
  ".mdx",
  ".md",
  ".ts",
  ".tsx",
  ".mts",
  ".mjs",
  ".js",
  ".css",
  ".json",
  ".yaml",
  ".yml",
  ".txt",
  ".svg",
])

/**
 * Authored text carrying no extension at all.
 *
 * `LICENSE-DOCS` opens with opsinjs's own preamble prose rather than with
 * licence text, and the dotfiles reach a reader through an editor tooltip or a
 * review diff, so all of them are prose this repository wrote.
 */
const SCANNED_NAMES = new Set([
  "LICENSE",
  "LICENSE-DOCS",
  ".npmrc",
  ".gitignore",
  ".prettierignore",
  ".prettierrc",
  ".editorconfig",
])

/** Beyond this many reported occurrences the report stops being readable. */
const REPORT_LIMIT = 60

/** Longer lines are windowed around the hit so the caret stays on screen. */
const LINE_BUDGET = 120

interface Occurrence {
  readonly file: string
  readonly line: number
  readonly column: number
  readonly character: string
  readonly text: string
}

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot <= 0 ? "" : name.slice(dot).toLowerCase()
}

function isScanned(name: string): boolean {
  if (SKIPPED_FILES.has(name)) return false
  return SCANNED_NAMES.has(name) || SCANNED_EXTENSIONS.has(extensionOf(name))
}

function walk(dir: string, out: string[]): void {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIPPED_DIRS.has(entry.name)) continue
      walk(full, out)
    } else if (entry.isFile() && isScanned(entry.name)) {
      out.push(full)
    }
  }
}

/**
 * Column as a count of characters rather than of UTF-16 units, so an emoji
 * earlier on the line does not push the reported number past the caret.
 */
function columnOf(line: string, index: number): number {
  return [...line.slice(0, index)].length + 1
}

function scan(file: string, label: string, into: Occurrence[]): void {
  let text: string
  try {
    text = readFileSync(file, "utf8")
  } catch {
    return
  }
  if (!PATTERN.test(text)) {
    PATTERN.lastIndex = 0
    return
  }
  PATTERN.lastIndex = 0

  const lines = text.split("\n")
  for (const [index, line] of lines.entries()) {
    let match: RegExpExecArray | null
    PATTERN.lastIndex = 0
    while ((match = PATTERN.exec(line)) !== null) {
      into.push({
        file: label,
        line: index + 1,
        column: columnOf(line, match.index),
        character: match[0] as string,
        text: line,
      })
    }
  }
}

/**
 * One occurrence as three lines: the address, the offending line and a caret
 * under the character. Tabs become single spaces so the caret lands where the
 * column number says it does.
 */
function render(occurrence: Occurrence): string[] {
  const flattened = occurrence.text.replace(/\t/g, " ")
  const characters = [...flattened]
  const zeroBased = occurrence.column - 1

  let start = 0
  let prefix = ""
  let suffix = ""
  if (characters.length > LINE_BUDGET) {
    start = Math.max(0, zeroBased - Math.floor(LINE_BUDGET / 2))
    const end = Math.min(characters.length, start + LINE_BUDGET)
    start = Math.max(0, end - LINE_BUDGET)
    prefix = start > 0 ? "... " : ""
    suffix = end < characters.length ? " ..." : ""
  }
  const window = characters.slice(start, start + LINE_BUDGET).join("")
  const caretAt = prefix.length + (zeroBased - start)

  return [
    `  ${occurrence.file}:${occurrence.line}:${occurrence.column}  ${
      BANNED.get(occurrence.character) ?? "a banned dash"
    }`,
    `    ${prefix}${window}${suffix}`,
    `    ${" ".repeat(Math.max(0, caretAt))}^`,
  ]
}

/* ------------------------------------------------------------------ *
 * Main                                                                *
 * ------------------------------------------------------------------ */

function main(): void {
  const files: string[] = []
  walk(ROOT_DIR, files)

  const occurrences: Occurrence[] = []
  for (const file of files) {
    scan(file, relative(ROOT_DIR, file).split(sep).join("/"), occurrences)
  }

  if (occurrences.length === 0) {
    console.log(`check-dashes: ${files.length} files scanned, no em dash and no en dash.`)
    return
  }

  const byFile = new Map<string, number>()
  for (const occurrence of occurrences) {
    byFile.set(occurrence.file, (byFile.get(occurrence.file) ?? 0) + 1)
  }
  const em = occurrences.filter((occurrence) => occurrence.character === "\u2014").length
  const en = occurrences.length - em
  const shown = occurrences.slice(0, REPORT_LIMIT)
  const worst = [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)

  console.error(
    [
      "",
      `check-dashes: ${em} em dash${em === 1 ? "" : "es"} and ${en} en dash${
        en === 1 ? "" : "es"
      } across ${byFile.size} file${byFile.size === 1 ? "" : "s"}.`,
      "",
      ...shown.flatMap(render),
      ...(occurrences.length > shown.length
        ? [
            "",
            `  ... and ${occurrences.length - shown.length} more. The files carrying the most:`,
            ...worst.map(([file, count]) => `    ${count.toString().padStart(5)}  ${file}`),
          ]
        : []),
      "",
      "  Remove each one by rewriting the sentence, not by moving another mark into",
      "  the hole it leaves. A comma, a colon, a semicolon, a bracket pair, a hyphen",
      "  or three dots in the dash's old seat is the same sentence still reaching for",
      "  a dash, and a reviewer sends it back. Write two sentences, spell the",
      "  connective out as a word, or make the inserted clause the main one. A span",
      "  between two values takes the word \"to\".",
      "",
      "  DASH-DOCTRINE.md at the repository root is the playbook: the recognition",
      "  table, twenty-two reframing roles with worked examples, the seven meanings a",
      "  reframe may never change, and the two named places where a mark rather than a",
      "  rewrite is the answer. AGENTS.md §12 is the short form.",
      "",
      "  Name the characters as U+2014 and U+2013, or as the escapes \\u2014 and",
      "  \\u2013, in any file that has to discuss them. Written that way no file needs",
      "  an exemption, which is why this gate has no allowlist.",
      "",
    ].join("\n"),
  )
  process.exit(1)
}

main()
