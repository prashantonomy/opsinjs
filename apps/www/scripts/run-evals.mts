/**
 * run-evals.mts - runs skills/opsinjs/evals/evals.json against the docs corpus
 * and writes dated scores.
 *
 *   node scripts/run-evals.mts                              # score the corpus on disk
 *   node scripts/run-evals.mts --base http://127.0.0.1:4000 # score the served .md twins
 *   node scripts/run-evals.mts --strict                     # exit 1 below the pass mark
 *
 * WRITES public/r/evals.json, which <EvalResult> renders on docs/agents/evals.
 *
 * WHAT IS BEING EVALUATED. Not a model - the documentation. Each task is a
 * question an agent asks in practice, together with the address the answer must
 * live at and the things that answer cannot omit or claim. A failure means the
 * corpus is missing a page, or a page has stopped saying the thing it exists to
 * say. That makes this a coverage probe for the docs-as-API contract rather than
 * a benchmark, and it is why the scores are advisory in CI and blocking nightly.
 *
 * The most valuable assertions are the negative ones. A page can be wrong in
 * both directions - claiming more than its status supports, or still announcing
 * an absence that the registry has since filled - and `mustNotContain` is what
 * catches either. When one trips, check the page's status against
 * registry/catalogue.ts before editing the page: the task may be the stale half.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/run-evals.mts needs Node 24 or newer.",
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

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const REPO_DIR = fileURLToPath(new URL("../../../", import.meta.url))
const DOCS_DIR = join(APP_DIR, "content", "docs")
const EVALS_FILE = join(REPO_DIR, "skills", "opsinjs", "evals", "evals.json")
const OUT_FILE = join(APP_DIR, "public", "r", "evals.json")

/* ------------------------------------------------------------------ *
 * Types                                                               *
 * ------------------------------------------------------------------ */

interface TaskExpectation {
  page?: string
  mustContain?: string[]
  mustNotContain?: string[]
  alsoResolves?: string[]
  frontmatter?: Record<string, string>
  frontmatterAny?: Record<string, string[]>
  catalogueId?: string
  catalogueStatus?: string
}

interface Task {
  id: string
  question: string
  why?: string
  expect: TaskExpectation
}

interface Suite {
  version?: string
  name?: string
  passMark?: number
  tasks: Task[]
}

interface Assertion {
  label: string
  passed: boolean
  detail?: string
}

interface TaskResult {
  id: string
  question: string
  score: number
  assertions: Assertion[]
}

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

function readMaybe(file: string): string | undefined {
  try {
    return readFileSync(file, "utf8")
  } catch {
    return undefined
  }
}

function parseBase(): string | undefined {
  const index = process.argv.indexOf("--base")
  const fromArgv = index === -1 ? undefined : process.argv[index + 1]
  const base = fromArgv ?? process.env.EVALS_BASE_URL
  return base ? base.replace(/\/+$/, "") : undefined
}

/** The page's text, from disk or from its served .md twin. */
async function loadPage(slug: string, base: string | undefined): Promise<string | undefined> {
  if (base) {
    try {
      const response = await fetch(`${base}/${slug}.md`, { redirect: "follow" })
      if (response.status !== 200) return undefined
      return await response.text()
    } catch {
      return undefined
    }
  }
  for (const candidate of [join(DOCS_DIR, `${slug}.mdx`), join(DOCS_DIR, slug, "index.mdx")]) {
    const contents = readMaybe(candidate)
    if (contents !== undefined) return contents
  }
  return undefined
}

function frontmatterOf(text: string): Record<string, string> {
  const lines = text.split("\n")
  if ((lines[0] ?? "").trim() !== "---") return {}
  const front: Record<string, string> = {}
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (line.trim() === "---") break
    const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (!match) continue
    front[match[1] as string] = (match[2] ?? "").trim().replace(/^["']|["']$/g, "")
  }
  return front
}

function loadCatalogue(): Array<{ name: string; status?: string }> {
  const raw = readMaybe(join(APP_DIR, "lib", "generated", "catalogue.json"))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as { items?: Array<{ name: string; status?: string }> }
    return parsed.items ?? []
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ *
 * Running one task                                                    *
 * ------------------------------------------------------------------ */

async function runTask(
  task: Task,
  base: string | undefined,
  catalogue: Array<{ name: string; status?: string }>,
): Promise<TaskResult> {
  const assertions: Assertion[] = []
  const expect = task.expect

  let text: string | undefined
  if (expect.page) {
    text = await loadPage(expect.page, base)
    assertions.push({
      label: `resolves ${expect.page}`,
      passed: text !== undefined,
      detail:
        text === undefined
          ? `no page at content/docs/${expect.page}.mdx${base ? ` and no .md twin at ${base}/${expect.page}.md` : ""}`
          : undefined,
    })
  }

  const haystack = (text ?? "").toLowerCase()

  for (const needle of expect.mustContain ?? []) {
    const found = haystack.includes(needle.toLowerCase())
    assertions.push({
      label: `says "${needle}"`,
      passed: found,
      detail: found ? undefined : "the page exists but does not state the thing it exists to state",
    })
  }

  for (const needle of expect.mustNotContain ?? []) {
    const found = haystack.includes(needle.toLowerCase())
    assertions.push({
      label: `does not say "${needle}"`,
      passed: !found,
      detail: found
        ? "the page states something its status does not support. Check the page's status against registry/catalogue.ts before changing the page - the assertion may be the stale half."
        : undefined,
    })
  }

  if (expect.frontmatter && text !== undefined) {
    const front = frontmatterOf(text)
    for (const [key, value] of Object.entries(expect.frontmatter)) {
      assertions.push({
        label: `frontmatter ${key}: ${value}`,
        passed: front[key] === value,
        detail: front[key] === value ? undefined : `found ${key}: ${front[key] ?? "(absent)"}`,
      })
    }
  }

  if (expect.frontmatterAny && text !== undefined) {
    const front = frontmatterOf(text)
    for (const [key, values] of Object.entries(expect.frontmatterAny)) {
      const actual = front[key]
      assertions.push({
        label: `frontmatter ${key} is one of ${values.join(" | ")}`,
        passed: actual !== undefined && values.includes(actual),
        detail:
          actual !== undefined && values.includes(actual)
            ? undefined
            : `found ${key}: ${actual ?? "(absent)"}`,
      })
    }
  }

  if (expect.catalogueId) {
    const row = catalogue.find((entry) => entry.name === expect.catalogueId)
    assertions.push({
      label: `catalogue contains ${expect.catalogueId}`,
      passed: row !== undefined,
      detail: row ? undefined : "an agent asking about it would get a 404 instead of an answer",
    })
    if (expect.catalogueStatus) {
      assertions.push({
        label: `${expect.catalogueId} is ${expect.catalogueStatus}`,
        passed: row?.status === expect.catalogueStatus,
        detail: row?.status === expect.catalogueStatus ? undefined : `found status ${row?.status ?? "(none)"}`,
      })
    }
  }

  for (const slug of expect.alsoResolves ?? []) {
    const other = await loadPage(slug, base)
    assertions.push({
      label: `resolves ${slug}`,
      passed: other !== undefined,
      detail: other === undefined ? "linked from the answer but absent from the corpus" : undefined,
    })
  }

  const passed = assertions.filter((assertion) => assertion.passed).length
  return {
    id: task.id,
    question: task.question,
    score: assertions.length === 0 ? 1 : passed / assertions.length,
    assertions,
  }
}

/* ------------------------------------------------------------------ *
 * Main                                                                *
 * ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const strict = process.argv.includes("--strict")
  const base = parseBase()

  if (!exists(EVALS_FILE)) {
    console.warn(`run-evals: ${EVALS_FILE} does not exist. Nothing to run.`)
    return
  }

  let suite: Suite
  try {
    suite = JSON.parse(readFileSync(EVALS_FILE, "utf8")) as Suite
  } catch (error) {
    console.error(`run-evals: evals.json is not valid JSON - ${(error as Error).message}`)
    process.exit(1)
  }

  if (!Array.isArray(suite.tasks) || suite.tasks.length === 0) {
    console.warn("run-evals: the suite has no tasks.")
    return
  }

  const catalogue = loadCatalogue()
  const results: TaskResult[] = []
  for (const task of suite.tasks) {
    results.push(await runTask(task, base, catalogue))
  }

  const overall =
    results.reduce((total, result) => total + result.score, 0) / (results.length || 1)
  const passMark = suite.passMark ?? 0.8

  console.log(
    `run-evals: ${results.length} tasks, ${Math.round(overall * 100)}% ` +
      `(pass mark ${Math.round(passMark * 100)}%)${base ? ` against ${base}` : " against the corpus on disk"}.`,
  )
  console.log("")

  for (const result of results) {
    const mark = result.score === 1 ? "PASS" : result.score === 0 ? "FAIL" : "PART"
    console.log(`${mark}  ${Math.round(result.score * 100).toString().padStart(3)}%  ${result.id}`)
    for (const assertion of result.assertions) {
      if (assertion.passed) continue
      console.log(`        - ${assertion.label}${assertion.detail ? `: ${assertion.detail}` : ""}`)
    }
  }

  const payload = {
    $generatedBy: "scripts/run-evals.mts",
    /*
     * What was scored, spelled out, because <EvalResult> renders a score next to
     * a model name and these scores do not belong to a model. They measure the
     * corpus: whether the page an agent would need exists, at the address it
     * would guess, still saying the thing it exists to say. A score copied into
     * a sentence about a model would be a fabricated measurement.
     */
    scored: "the opsinjs documentation corpus, not a model",
    suite: suite.name ?? "opsinjs evals",
    version: suite.version ?? "1",
    ranOn: new Date().toISOString().slice(0, 10),
    mode: base ? "served" : "corpus",
    passMark,
    overall: Math.round(overall * 1000) / 1000,
    tasks: results.map((result) => ({
      id: result.id,
      question: result.question,
      score: Math.round(result.score * 1000) / 1000,
      failed: result.assertions
        .filter((assertion) => !assertion.passed)
        .map((assertion) => assertion.label),
    })),
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  console.log("")
  console.log("  wrote public/r/evals.json")

  if (strict && overall < passMark) {
    console.error(
      `\nrun-evals --strict: ${Math.round(overall * 100)}% is below the ${Math.round(passMark * 100)}% pass mark.\n` +
        "  Every failure above names a page that is missing or has stopped saying what it\n" +
        "  exists to say. Fix the documentation, not the assertion.",
    )
    process.exit(1)
  }
}

await main()
