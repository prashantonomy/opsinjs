/**
 * assert-ia.mts - the information-architecture gate.
 *
 *   node scripts/assert-ia.mts            # errors fail, warnings report
 *   node scripts/assert-ia.mts --strict   # warnings fail too (nightly)
 *   node scripts/assert-ia.mts --quiet    # only print findings and the summary
 *
 * A documentation site written by many hands in parallel drifts in ways no
 * reviewer catches by reading: a heading that a page's kind does not have, a
 * component id that exists on one page and not in the catalogue, a doctrine page
 * that claims a component implements it while the component has never heard of
 * the doctrine, an alias that means two different things, a route nothing links
 * to. This script is where those become build failures instead of slow rot.
 *
 * IT READS THE CONTRACT RATHER THAN RESTATING IT. The frontmatter schema comes
 * from content/_templates/frontmatter.schema.json and the section outline for
 * each `kind` comes from the matching content/_templates/<kind>.mdx. Those files
 * are what contributors are told to copy, so the gate and the instructions can
 * never disagree - which was the single largest risk in authoring 270-odd pages
 * in parallel.
 *
 * WHAT IS AN ERROR AND WHAT IS A WARNING. An error is a statement the site makes
 * that is untrue or unreachable: a missing required section, a dangling
 * reference, an unknown component tag, a page nothing links to. A warning is a
 * weaker signal that needs a human: a page with no `implements`, an unusually
 * long description, a considered component with no address yet. CI runs the
 * default mode; the nightly job runs --strict.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/assert-ia.mts needs Node 24 or newer.",
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
import { fileURLToPath, pathToFileURL } from "node:url"

/* THE OUTLINE TABLE, READ FROM THE SAME PLACE <PageTemplate> READS IT.
   A component page's outline depends on its `status` as well as its `kind`, so
   it cannot be derived from a single template file: the moment one page reaches
   `alpha`, a template-derived outline demands "Proposed API" while
   <PageTemplate> demands "Usage", and no page edit satisfies both. Both
   enforcers now read lib/status.ts, which is also what
   content/_templates/component.mdx implements - and the template is checked
   against it below (OUT012) so it cannot rot unnoticed.

   The specifier carries an explicit `.ts` because this file is executed by
   plain `node` under native type stripping, which does not rewrite specifiers
   and does not read tsconfig's `@/*` alias. `lib/status.ts` has no imports of
   its own and no non-erasable syntax, so this costs nothing at load time.
   `registry/catalogue.ts:36` imports the same module the same way. */
import {
  accessibilitySectionFor,
  componentSections,
  isStatus,
  SECTION_OUTLINES,
  type Status,
} from "../lib/status.ts"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const DOCS_DIR = join(APP_DIR, "content", "docs")
const TEMPLATES_DIR = join(APP_DIR, "content", "_templates")

/* ADR 0008. The complete outline for a `considered` component page - the only
   kind of page in the corpus that is generated rather than authored. Kept here
   rather than in a template file because there is no _templates/considered.mdx:
   a contributor never writes one of these by hand. */
const CONSIDERED_COMPONENT_HEADINGS = [
  "What this name refers to",
  "Why it is not on the roster",
  "What to use instead",
]

/* ================================================================== *
 * FROZEN CONTRACTS                                                    *
 * ================================================================== */

/**
 * The 24 component ids opsinjs specifies (contract C1). Kebab-case in paths and
 * in the catalogue, PascalCase in prose. This list is the fallback used when
 * registry/catalogue.ts cannot be imported, and it is also compared against the
 * catalogue so that a silent divergence is reported rather than tolerated.
 */
const SHIPPED_IDS = [
  "result-card",
  "range-bar",
  "score-dial",
  "trend-sparkline",
  "metric-tile",
  "status-pill",
  "alert-banner",
  "care-card",
  "term",
  "consent-sheet",
  "disclaimer-note",
  "log-sheet",
  "reading-input",
  "value",
  "relative-time",
  "surface",
  "card",
  "sheet",
  "dialog",
  "callout",
  "empty-state",
  "skeleton",
  "button",
  "field",
]

/**
 * The considered roster (contract C2): components opsinjs has thought about and
 * is deliberately not shipping. They are catalogue rows and legitimate targets
 * for `implements`. They exist so that an agent asking about one gets
 * "considered, not implemented" instead of a 404 it fills by inventing an API.
 */
const CONSIDERED_IDS = [
  "questionnaire",
  "symptom-picker",
  "dose-tracker",
  "body-map",
  "goal-ring",
  "timeline-entry",
  "scale-input",
  "source-citation",
  "range-legend",
  "toast",
  "tooltip",
  "popover",
  "tabs",
  "accordion",
  "select",
  "combobox",
  "switch",
  "checkbox",
  "radio-group",
  "slider",
  "number-field",
  "textarea",
  "progress",
  "spinner",
  "badge",
  "divider",
  "scroll-area",
  "tab-bar",
  "segmented-control",
  "stepper",
  "menu",
  "icon-button",
  "link",
  "avatar",
  "table",
  "visually-hidden",
]

/**
 * The frozen top navigation (addendum A10). lib/layout.shared.tsx is the only
 * file allowed to define it; this list is what route reachability is measured
 * against, and a mismatch between the two is itself reported.
 */
const TOP_NAV = [
  "/docs",
  "/docs/components",
  "/docs/health",
  "/docs/foundations",
  "/playground",
  "/colors",
]

/**
 * The CLOSED MDX vocabulary (contract C4). Content pages may use these tags and
 * only these tags, and they never define one. Any other capitalised JSX tag in
 * an .mdx file is an error, because at build time it is either an undefined
 * component or a silent HTML element.
 *
 * Keep this in step with components/mdx.tsx. A tag present in that file but
 * missing here is reported as vocabulary drift rather than as a page error, so
 * the two can be reconciled deliberately.
 */
const MDX_VOCABULARY = [
  "ComponentPreview",
  "ComponentSource",
  "ComponentInstall",
  "NotBuiltYet",
  "StubNotice",
  "NoDataYet",
  "Todo",
  "PageTemplate",
  "StatusBadge",
  "SinceBadge",
  "StatusMatrix",
  "SectionProgress",
  "ComponentsList",
  "WhenToUse",
  "Anatomy",
  "CompositionTree",
  "PropsTable",
  "DataAttributesTable",
  "CssVariablesTable",
  "KeyboardTable",
  "TokenTable",
  "BundleSize",
  "ContrastReport",
  "A11yReport",
  "ContrastOracle",
  "CvdSimulator",
  "ColorScale",
  "TokenSwatch",
  "StatusLadder",
  "StatusAxisDemo",
  "MaterialLadder",
  "MotionCurve",
  "MotionDemo",
  "TypeScaleSpecimen",
  "SpaceSpecimen",
  "RadiusSpecimen",
  "DoDont",
  "SafetyCallout",
  "Callout",
  "ClinicalNote",
  "ResearchNote",
  "Reviewed",
  "LastUpdated",
  "PlainLanguage",
  "Term",
  "Glossary",
  "ReadingLevel",
  "RangeDemo",
  "IframePreview",
  "DeviceFrame",
  "ViewportToolbar",
  "CodeBlockCommand",
  "CodeTabs",
  "CodeCollapsible",
  "CopyButton",
  "PageActions",
  "OpenInSandbox",
  "BrowserSupport",
  "RelatedComponents",
  "ApiLink",
  "FlowDiagram",
  "RegistryItem",
  "VersionNotice",
  "PromptRecipe",
  "EvalResult",
  "Feedback",
  "SectionsRail",
  "StatusLegend",
  "Steps",
  "Tabs",
  "Accordions",
  "Files",
  "Kbd",
  "Figure",

  /* Reconciled with components/mdx.tsx rather than removed from it. Each of
     these is a real, exported component that content may legitimately reach
     for, so the contract is widened to admit it instead of the export being
     withdrawn — which is the choice MDX003 asks a human to make.

     TypeTable is not optional: remarkAutoTypeTable rewrites `<auto-type-table>`
     into it, so removing the export would break every generated API table.
     PlannedApi is how a component page states an API that does not exist yet
     without implying it does. CategoryGrid is the catalogue-driven index used
     on section landing pages. */
  "TypeTable",
  "PlannedApi",
  "CategoryGrid",
]

/**
 * The required children of vocabulary tags that are containers. `<Steps>` is
 * meaningless without `<Step>`, and the anatomy contract names the container
 * rather than enumerating its parts, so these are admitted explicitly rather
 * than by widening the rule.
 */
const MDX_CHILD_TAGS = ["Step", "Tab", "Accordion", "File", "Folder"]

/**
 * Files allowed to contain an absolute /docs path in TypeScript (addendum A11).
 * Everything else builds paths through lib/routes.ts, which is the seam that
 * makes the deferred [lang] retrofit a bounded change instead of a migration.
 */
const DOCS_PATH_ALLOWLIST = [
  "lib/routes.ts",
  "lib/source.ts",
  "lib/layout.shared.tsx",
  "app/robots.ts",
  "app/sitemap.ts",
  "next.config.mjs",
]

/**
 * Routes that are reachable without being linked, each for a stated reason
 * (addendum A10). A route not in the navigation, not in the sidebar and not
 * here is an orphan: it exists, it renders, and nobody will ever see it.
 */
const ROUTE_ALLOWLIST: Array<{ route: string; reason: string }> = [
  { route: "/", reason: "the home page; the wordmark links to it from every layout" },
  {
    route: "/docs/[[...slug]]",
    reason: "the docs corpus itself, reached through the Docs nav item and the sidebar",
  },
  {
    route: "/view/[base]/[style]/[kind]/[name]",
    reason:
      "the chrome-less render surface: an iframe and screenshot target, deliberately unlinked and disallowed in robots.txt",
  },
]

/**
 * Canonicality (decision 15). Two topics are documented in exactly one place and
 * linked from everywhere else. Restating them is the failure this prevents: two
 * pages that both explain rounding will disagree within a quarter.
 */
const CANONICAL_TOPICS = [
  {
    canonical: "content/plain-english-a-z",
    widget: "Glossary",
    reason:
      "the A-Z is rendered once, from tokens/glossary.json, on its canonical page; every other page links to it",
  },
  {
    canonical: "health/numbers-units-precision",
    markers: ["significant figure", "decimal place", "rounding rule"],
    reason:
      "numeric formatting is canonical on health/numbers-units-precision; content pages link to it rather than restating it",
  },
]

/* ================================================================== *
 * Findings                                                            *
 * ================================================================== */

interface Finding {
  level: "error" | "warn"
  rule: string
  file: string
  line?: number
  message: string
}

const findings: Finding[] = []

function fail(rule: string, file: string, message: string, line?: number): void {
  findings.push({ level: "error", rule, file, message, line })
}

function warn(rule: string, file: string, message: string, line?: number): void {
  findings.push({ level: "warn", rule, file, message, line })
}

/* ================================================================== *
 * Filesystem helpers                                                  *
 * ================================================================== */

function exists(file: string): boolean {
  try {
    statSync(file)
    return true
  } catch {
    return false
  }
}

function isDirectory(file: string): boolean {
  try {
    return statSync(file).isDirectory()
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

function rel(file: string): string {
  return relative(APP_DIR, file).split(sep).join("/")
}

/* ================================================================== *
 * Frontmatter                                                         *
 *                                                                     *
 * A deliberately small YAML subset: scalars, inline arrays, block      *
 * arrays and one level of nesting, which is exactly what the           *
 * frontmatter contract uses. Anything richer than that in a docs page  *
 * is itself a smell, and this parser reporting it as unparseable is    *
 * the correct outcome.                                                 *
 * ================================================================== */

type Scalar = string | number | boolean
type FrontmatterValue = Scalar | Scalar[] | Record<string, Scalar>
type Frontmatter = Record<string, FrontmatterValue>

function parseScalar(raw: string): Scalar {
  const text = raw.trim()
  if (
    (text.startsWith('"') && text.endsWith('"') && text.length > 1) ||
    (text.startsWith("'") && text.endsWith("'") && text.length > 1)
  ) {
    return text.slice(1, -1)
  }
  if (text === "true") return true
  if (text === "false") return false
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  return text
}

function parseInlineArray(raw: string): Scalar[] {
  const inner = raw.trim().slice(1, -1).trim()
  if (inner.length === 0) return []
  const parts: string[] = []
  let current = ""
  let quote: string | undefined
  for (const character of inner) {
    if (quote) {
      if (character === quote) quote = undefined
      else current += character
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === ",") {
      parts.push(current)
      current = ""
      continue
    }
    current += character
  }
  parts.push(current)
  return parts.map((part) => parseScalar(part)).filter((part) => part !== "")
}

interface ParsedPage {
  file: string
  /** Slug relative to content/docs, without the extension: "health/two-colour-axes". */
  slug: string
  frontmatter: Frontmatter
  /** Everything after the frontmatter. */
  body: string
  /** 1-indexed line where the body starts, for useful error positions. */
  bodyOffset: number
  /** Level-2 headings in document order. */
  headings: string[]
  frontmatterError?: string
}

function parsePage(file: string): ParsedPage {
  const contents = readMaybe(file) ?? ""
  const slug = relative(DOCS_DIR, file).replace(/\.mdx$/, "").split(sep).join("/")
  const lines = contents.split("\n")

  if ((lines[0] ?? "").trim() !== "---") {
    return {
      file,
      slug,
      frontmatter: {},
      body: contents,
      bodyOffset: 1,
      headings: collectHeadings(contents),
      frontmatterError: "no frontmatter block: the file does not begin with ---",
    }
  }

  let end = -1
  for (let index = 1; index < lines.length; index += 1) {
    if ((lines[index] ?? "").trim() === "---") {
      end = index
      break
    }
  }
  if (end === -1) {
    return {
      file,
      slug,
      frontmatter: {},
      body: contents,
      bodyOffset: 1,
      headings: collectHeadings(contents),
      frontmatterError: "the frontmatter block is never closed",
    }
  }

  const frontmatter: Frontmatter = {}
  let error: string | undefined
  for (let index = 1; index < end; index += 1) {
    const line = lines[index] ?? ""
    if (line.trim() === "" || line.trim().startsWith("#")) continue

    /* A block list item or a nested mapping belonging to the previous key. */
    if (/^\s+/.test(line)) {
      const keys = Object.keys(frontmatter)
      const owner = keys[keys.length - 1]
      if (!owner) continue
      const item = line.trim()
      if (item.startsWith("- ")) {
        const existing = frontmatter[owner]
        const list = Array.isArray(existing) ? existing : []
        list.push(parseScalar(item.slice(2)))
        frontmatter[owner] = list
        continue
      }
      const nested = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(item)
      if (nested) {
        const existing = frontmatter[owner]
        const map =
          existing && typeof existing === "object" && !Array.isArray(existing)
            ? (existing as Record<string, Scalar>)
            : {}
        map[nested[1] as string] = parseScalar(nested[2] ?? "")
        frontmatter[owner] = map
      }
      continue
    }

    const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (!match) {
      error = `line ${index + 1} of the frontmatter is not "key: value"`
      continue
    }
    const key = match[1] as string
    const raw = (match[2] ?? "").trim()
    if (raw === "") {
      frontmatter[key] = []
      continue
    }
    frontmatter[key] = raw.startsWith("[") && raw.endsWith("]")
      ? parseInlineArray(raw)
      : parseScalar(raw)
  }

  const body = lines.slice(end + 1).join("\n")
  return {
    file,
    slug,
    frontmatter,
    body,
    bodyOffset: end + 2,
    headings: collectHeadings(body),
    frontmatterError: error,
  }
}

/**
 * Blank out fenced code blocks and inline code spans.
 *
 * Fences are matched with ANY leading indentation and with either delimiter,
 * because a fence nested in a list item is indented and is still a fence. The
 * previous form anchored on `^```` at column zero, so every example inside a
 * bullet read as prose — which is how a `render={(props) => <MyButton …>}`
 * illustration in handbook/composition-and-render was reported as an unknown
 * MDX tag, and how a `## heading` inside an indented block would have been
 * counted as a real section.
 *
 * Removed lines become empty lines rather than disappearing, so line numbers in
 * anything derived from the result still match the source file.
 */
function stripCode(text: string): string {
  const out: string[] = []
  let delimiter: string | null = null
  let width = 0

  for (const line of text.split("\n")) {
    const match = /^\s*(`{3,}|~{3,})/.exec(line)
    const run = match?.[1]

    if (delimiter === null) {
      if (run) {
        delimiter = run[0] as string
        width = run.length
        out.push("")
        continue
      }
      out.push(line)
      continue
    }

    // A closing fence carries the same delimiter, is at least as long, and
    // carries nothing else on the line. Anything else is still block content.
    if (run && run[0] === delimiter && run.length >= width && line.trim() === run) {
      delimiter = null
    }
    out.push("")
  }

  return out.join("\n").replace(/`[^`\n]*`/g, "")
}

function collectHeadings(body: string): string[] {
  const headings: string[] = []
  for (const line of stripCode(body).split("\n")) {
    const match = /^##\s+(.+?)\s*$/.exec(line)
    if (match && match[1]) headings.push(match[1])
  }
  return headings
}

function asArray(value: FrontmatterValue | undefined): string[] {
  if (value === undefined) return []
  if (Array.isArray(value)) return value.map((entry) => String(entry))
  if (typeof value === "object") return []
  return [String(value)]
}

function asText(value: FrontmatterValue | undefined): string | undefined {
  if (value === undefined || Array.isArray(value) || typeof value === "object") return undefined
  return String(value)
}

/* ================================================================== *
 * The contract, read from content/_templates/                         *
 * ================================================================== */

interface SchemaProperty {
  type?: string
  enum?: string[]
  items?: { type?: string }
}

interface FrontmatterSchema {
  required: string[]
  properties: Record<string, SchemaProperty>
  additionalProperties: boolean
}

function loadSchema(): FrontmatterSchema | undefined {
  const raw = readMaybe(join(TEMPLATES_DIR, "frontmatter.schema.json"))
  if (raw === undefined) return undefined
  try {
    const parsed = JSON.parse(raw) as {
      required?: string[]
      properties?: Record<string, SchemaProperty>
      additionalProperties?: boolean
    }
    return {
      required: parsed.required ?? [],
      properties: parsed.properties ?? {},
      additionalProperties: parsed.additionalProperties ?? true,
    }
  } catch {
    return undefined
  }
}

/**
 * How strictly a kind's headings are checked.
 *
 *  exact   - the template's H2s, in the template's order, no additions.
 *  fixed   - the template's H2s must all be present in order; extra H2s are
 *            allowed between them (guides own their task sections).
 *  header  - one named H2 must exist; everything else comes from a generator.
 *  free    - no outline; other rules apply instead.
 */
const OUTLINE_POLICY: Record<string, "exact" | "fixed" | "header" | "free"> = {
  component: "exact",
  foundation: "exact",
  health: "exact",
  accessibility: "exact",
  content: "exact",
  pattern: "exact",
  recipe: "exact",
  screen: "exact",
  handbook: "exact",
  guide: "fixed",
  reference: "header",
  project: "free",
}

/**
 * H2s that are conditional rather than required. "Clinical meaning" is present
 * if and only if the component's category begins with `health-`, and the
 * anatomy contract enforces both directions.
 *
 * `component` is deliberately absent: `componentSections(status, category)`
 * already drops "Clinical meaning" for a non-`health-` category, and OUT010
 * below is what reports the two directions with a message worth reading.
 */
const CONDITIONAL_HEADINGS: Record<string, string[]> = {}

/**
 * Kinds whose template contains placeholder headings, where only a named subset
 * is actually required. A guide's task sections are the author's to name - "First
 * task" in the template is an illustration, not a heading anyone should ship -
 * but the four structural sections and their order are the contract.
 */
const REQUIRED_HEADINGS: Record<string, string[]> = {
  guide: ["Overview", "Verify it worked", "Troubleshooting", "Next"],
}

function loadOutlines(): Record<string, string[]> {
  const outlines: Record<string, string[]> = {}
  for (const kind of Object.keys(OUTLINE_POLICY)) {
    /* `component` is status-gated and comes from lib/status.ts, not from a
       template - see the import at the top of this file and OUT012 below. */
    if (kind === "component") continue
    const file = join(TEMPLATES_DIR, `${kind}.mdx`)
    if (!exists(file)) continue
    const parsed = parsePage(file)
    if (parsed.headings.length > 0) outlines[kind] = parsed.headings
  }
  return outlines
}

/**
 * OUT012 - the template must keep implementing the table.
 *
 * Sourcing the component outline from `lib/status.ts` removes the only thing
 * that was checking `content/_templates/component.mdx`, and an unchecked
 * template rots: a contributor copies it, gets a page that fails the build, and
 * concludes the enforcer is broken. So the template is now asserted against
 * `componentSections("planned", "health-")` directly.
 *
 * The other exact-outline kinds are checked the same way against
 * `SECTION_OUTLINES`, because the same argument applies to all of them and the
 * two lists agree today.
 */
function checkTemplateOutlines(): void {
  const cases: { kind: string; expected: string[] }[] = [
    { kind: "component", expected: componentSections("planned", "health-") },
  ]
  for (const kind of Object.keys(OUTLINE_POLICY)) {
    if (kind === "component") continue
    if (OUTLINE_POLICY[kind] !== "exact") continue
    const expected = SECTION_OUTLINES[kind as keyof typeof SECTION_OUTLINES]
    if (expected) cases.push({ kind, expected })
  }

  for (const { kind, expected } of cases) {
    const file = join(TEMPLATES_DIR, `${kind}.mdx`)
    if (!exists(file)) {
      warn(
        "OUT004",
        relative(APP_DIR, file),
        `content/_templates/${kind}.mdx is missing, so nothing checks that the template still implements the outline in lib/status.ts.`,
      )
      continue
    }
    const found = parsePage(file).headings
    if (found.join(" ") === expected.join(" ")) continue
    fail(
      "OUT012",
      relative(APP_DIR, file),
      `the template no longer implements the outline in lib/status.ts. Expected ${expected
        .map((heading) => `"${heading}"`)
        .join(" -> ")}, found ${found.map((heading) => `"${heading}"`).join(" -> ")}. Change lib/status.ts and the template together, never one alone.`,
      1,
    )
  }
}

/* ================================================================== *
 * Catalogue                                                           *
 * ================================================================== */

interface CatalogueRow {
  name: string
  status?: string
  category?: string
  aliases?: string[]
}

async function loadCatalogue(): Promise<{ rows: CatalogueRow[]; source: string }> {
  const generated = readMaybe(join(APP_DIR, "lib", "generated", "catalogue.json"))
  if (generated) {
    try {
      const parsed = JSON.parse(generated) as { items?: CatalogueRow[] }
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        return { rows: parsed.items, source: "lib/generated/catalogue.json" }
      }
    } catch {
      /* fall through to the frozen roster */
    }
  }

  const file = join(APP_DIR, "registry", "catalogue.ts")
  if (exists(file)) {
    try {
      const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>
      for (const key of ["catalogue", "components", "entries", "items", "default"]) {
        const value = mod[key]
        if (Array.isArray(value) && value.length > 0) {
          return { rows: value as CatalogueRow[], source: "registry/catalogue.ts" }
        }
      }
    } catch {
      /* fall through to the frozen roster */
    }
  }

  return {
    rows: [
      ...SHIPPED_IDS.map((name) => ({ name, status: "planned" })),
      ...CONSIDERED_IDS.map((name) => ({ name, status: "considered" })),
    ],
    source: "the frozen roster in assert-ia.mts (no catalogue could be read)",
  }
}

/* ================================================================== *
 * Checks                                                              *
 * ================================================================== */

function checkFrontmatter(page: ParsedPage, schema: FrontmatterSchema | undefined): void {
  const file = rel(page.file)
  if (page.frontmatterError) {
    fail("FM001", file, page.frontmatterError, 1)
    return
  }

  const front = page.frontmatter
  const kind = asText(front.kind)
  const status = asText(front.status)

  if (!schema) {
    if (!kind) fail("FM002", file, "frontmatter is missing `kind`", 1)
    if (!status) fail("FM002", file, "frontmatter is missing `status`", 1)
    return
  }

  for (const required of schema.required) {
    const value = front[required]
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      fail("FM002", file, `frontmatter is missing \`${required}\` (required by the schema)`, 1)
    }
  }

  for (const [key, value] of Object.entries(front)) {
    const property = schema.properties[key]
    if (!property) {
      if (!schema.additionalProperties) {
        fail(
          "FM004",
          file,
          `\`${key}\` is not in the frontmatter contract. Add it to content/_templates/frontmatter.schema.json and source.config.ts, or remove it.`,
          1,
        )
      }
      continue
    }
    if (property.type === "array" && !Array.isArray(value)) {
      fail("FM005", file, `\`${key}\` must be a list`, 1)
      continue
    }
    if (property.type === "string" && (Array.isArray(value) || typeof value === "object")) {
      fail("FM005", file, `\`${key}\` must be a single string`, 1)
      continue
    }
    if (property.type === "boolean" && typeof value !== "boolean") {
      fail("FM005", file, `\`${key}\` must be true or false`, 1)
      continue
    }
    if (property.enum && typeof value !== "object") {
      const text = String(value)
      if (!property.enum.includes(text)) {
        fail(
          "FM003",
          file,
          `\`${key}: ${text}\` is not one of ${property.enum.join(" | ")}`,
          1,
        )
      }
    }
  }

  for (const dateField of ["reviewed", "a11yDate"]) {
    const value = asText(front[dateField])
    if (value !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      fail("FM012", file, `\`${dateField}: ${value}\` is not an ISO date (YYYY-MM-DD)`, 1)
    }
  }

  const description = asText(front.description)
  if (description !== undefined && description.length > 240) {
    warn(
      "FM013",
      file,
      `the description is ${description.length} characters. It is the search snippet and the card subtitle - one sentence.`,
      1,
    )
  }

  if (kind === "health") {
    if (asText(front.evidence) === undefined) {
      fail(
        "FM010",
        file,
        "a health page must declare `evidence: cited | opinion | mixed`. An honest `opinion` is always better than a plausible-looking reference.",
        1,
      )
    }
    if (asText(front.reviewed) === undefined) {
      fail("FM010", file, "a health page must carry `reviewed:` with the date it was last reviewed", 1)
    }
  }

  if (kind === "component" && asText(front.status) !== "considered") {
    const category = asText(front.category) ?? ""
    if (category.startsWith("health-") && asArray(front.governedBy).length === 0) {
      fail(
        "FM011",
        file,
        `category \`${category}\` begins with health-, so \`governedBy\` is mandatory: name the doctrine pages that decide what this component may assert.`,
        1,
      )
    }
  }
}

/**
 * Headings that are legitimately written two ways.
 *
 * This table is a deliberate copy of the one in
 * `components/docs/page-template.tsx:74-81`, and the two must stay identical:
 * that file runs during `next build` and throws, this one runs in `pnpm check`
 * and can name a line. A page that satisfies one and fails the other is a page
 * nobody can write. The table cannot be shared through `lib/status.ts` without
 * teaching the status vocabulary about heading spellings, which is a different
 * concern - so it is duplicated, and this comment is the reason.
 */
const HEADING_ALIASES: Record<string, string[]> = {
  "when to use it": ["when to use"],
  accessibility: ["accessibility requirements"],
  "accessibility requirements": ["accessibility"],
  "research and rationale": ["research & rationale", "research"],
  "approved / rejected": ["approved and rejected"],
  "why (evidence)": ["why", "why — evidence"],
}

/** "Approved / Rejected" and "approved  /  rejected" are the same heading. */
function normaliseHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/[.:]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
}

function headingCandidates(heading: string): string[] {
  const key = normaliseHeading(heading)
  return [key, ...(HEADING_ALIASES[key] ?? []).map(normaliseHeading)]
}

function checkOutline(page: ParsedPage, outlines: Record<string, string[]>): void {
  const file = rel(page.file)
  const kind = asText(page.frontmatter.kind)
  if (!kind) return
  const policy = OUTLINE_POLICY[kind]
  if (!policy || policy === "free") return

  const present = page.headings
  const presentSet = new Set(present)
  const status = asText(page.frontmatter.status)

  /* ADR 0008 - the second status gate. A `considered` component page is not a
     specification and must not be checked as one: it exists so that a guessed
     URL answers instead of 404-ing, and it carries the notice, what the name
     refers to, why it is not on the roster, and the alternative. Nothing else.
     Holding it to the `planned` outline would demand a Proposed API and an
     Accessibility bar for a component nobody has designed - which is exactly
     the padding-into-substance the ADR rejects. `componentSections()` in
     lib/status.ts already returns [] here for <PageTemplate>; this is the same
     gate on the authoring side.

     This runs BEFORE the outline is resolved, and it has to:
     `componentSections("considered", …)` returns an empty array, which is
     truthy, so a considered page would otherwise reach the `exact` branch with
     an empty allow-list and fail OUT002 on every one of its own headings. */
  if (kind === "component" && status === "considered") {
    for (const heading of CONSIDERED_COMPONENT_HEADINGS) {
      if (!presentSet.has(heading)) {
        fail(
          "OUT001",
          file,
          `missing "## ${heading}". A considered component page carries exactly ${CONSIDERED_COMPONENT_HEADINGS.map((h) => `"${h}"`).join(", ")} - see ADR 0008.`,
        )
      }
    }
    const allowedConsidered = new Set(CONSIDERED_COMPONENT_HEADINGS)
    for (const heading of present) {
      if (!allowedConsidered.has(heading)) {
        fail(
          "OUT002",
          file,
          `"## ${heading}" is not part of a considered component page. These pages are thin by design - see ADR 0008.`,
        )
      }
    }
    return
  }

  /* THE OUTLINE. For every kind but `component` it is the template's H2 list.
     For `component` it is status-gated and comes from the same table
     <PageTemplate> throws on, because a component page's outline is a function
     of its release phase: `planned` has "Proposed API" and "Accessibility
     requirements", `alpha` replaces them with "Usage", "Examples", "API
     reference" and "Accessibility". A single template cannot express that, and
     a page cannot satisfy two enforcers that disagree about it. */
  let outline: string[] | undefined
  let outlineSource: string
  if (kind === "component") {
    if (!isStatus(status)) {
      /* FM003 reports the bad status with a better message; checking a page's
         headings against an outline we cannot resolve would only add noise. */
      return
    }
    outline = componentSections(status as Status, asText(page.frontmatter.category) ?? "")
    outlineSource = `componentSections("${status}", …) in lib/status.ts`
  } else {
    outline = outlines[kind]
    outlineSource = `content/_templates/${kind}.mdx`
  }

  if (!outline) {
    warn(
      "OUT004",
      file,
      `content/_templates/${kind}.mdx is missing, so this page's headings could not be checked against its kind.`,
    )
    return
  }

  const conditional = new Set(CONDITIONAL_HEADINGS[kind] ?? [])

  if (policy === "header") {
    const first = outline[0]
    if (first && !presentSet.has(first)) {
      fail("OUT001", file, `a ${kind} page must carry the "## ${first}" section`)
    }
    return
  }

  /* Heading aliases, mirroring <PageTemplate>. Two enforcers that disagree
     about whether "## Accessibility" and "## Accessibility requirements" are
     the same section produce a page nobody can write: this script would demand
     one spelling and `next build` would throw on the other. So a component
     page's headings are folded onto their canonical section name here, and
     every check below runs on the folded list. Nothing is loosened - the
     canonical section must still be present, in the right place, and a heading
     that folds onto nothing is still OUT002.

     Only `component` is folded. The other eleven kinds keep the byte-exact
     matching they have always had. */
  const canonicalOf = new Map<string, string>()
  if (kind === "component") {
    for (const section of outline) {
      for (const candidate of headingCandidates(section)) canonicalOf.set(candidate, section)
    }
    /* Both spellings of section 14 resolve at every status; the canonical one
       for THIS status is the one the outline already asked for. */
    const a11y = normaliseHeading(accessibilitySectionFor(status as Status))
    const a11ySection = outline.find((section) => headingCandidates(section).includes(a11y))
    if (a11ySection) canonicalOf.set(a11y, a11ySection)
  }
  const folded =
    kind === "component"
      ? present.map((heading) => canonicalOf.get(normaliseHeading(heading)) ?? heading)
      : present
  const foldedSet = new Set(folded)

  /* OUT013 - section 14 is spelled by its status, and only by its status.
     Folding the two spellings above is what stops a page failing OUT001 and
     OUT002 for one heading, but it must not make the spelling optional: the
     section is "Accessibility requirements" at `planned`, because at that
     status it is a bar the implementation has to clear, and "Accessibility"
     from `alpha` onwards, when there is something measured to report. That
     distinction is the whole reason `accessibilitySectionFor()` exists, and
     <PageTemplate> cannot enforce it - it accepts either spelling at every
     status by design, because a runtime throw is the wrong place to argue
     about a word. This is the right place. */
  if (kind === "component") {
    const canonicalA11y = accessibilitySectionFor(status as Status)
    const spellings = headingCandidates(canonicalA11y)
    for (const heading of present) {
      const key = normaliseHeading(heading)
      if (!spellings.includes(key)) continue
      if (key === normaliseHeading(canonicalA11y)) continue
      fail(
        "OUT013",
        file,
        `"## ${heading}" carries this component's accessibility contract, but at status: ${status} that section is spelled "## ${canonicalA11y}". accessibilitySectionFor() in lib/status.ts owns the name - "Accessibility requirements" at planned, "Accessibility" from alpha onwards - because at planned it is a bar to clear and afterwards it is a result to report.`,
      )
    }
  }

  const required =
    REQUIRED_HEADINGS[kind] ?? outline.filter((heading) => !conditional.has(heading))
  for (const heading of required) {
    if (!foldedSet.has(heading)) {
      fail(
        "OUT001",
        file,
        `missing "## ${heading}". The outline for kind: ${kind} is fixed - see ${outlineSource}.`,
      )
    }
  }

  if (policy === "exact") {
    const allowed = new Set(outline)
    /* A non-health component carrying "## Clinical meaning" is one defect, not
       two. It is allowed through here so that OUT010 below reports it with the
       message that says what to do about it. */
    if (kind === "component") allowed.add("Clinical meaning")
    for (const heading of folded) {
      if (!allowed.has(heading)) {
        fail(
          "OUT002",
          file,
          kind === "component"
            ? `"## ${heading}" is not part of the outline for a component at status: ${status}. The outline is ${outline.map((section) => `"${section}"`).join(" -> ")}. Use an H3 inside an existing section, or move the page to the status whose outline has it.`
            : `"## ${heading}" is not part of the outline for kind: ${kind}. Use an H3 inside an existing section, or change the page's kind.`,
        )
      }
    }
  }

  /* Order. Only the headings the contract names are ordered; a guide's own task
     sections may appear between them. */
  const ordering = REQUIRED_HEADINGS[kind] ?? outline
  const ordered = folded.filter((heading) => ordering.includes(heading))
  const expected = ordering.filter((heading) => foldedSet.has(heading))
  if (ordered.join("\u0000") !== expected.join("\u0000")) {
    fail(
      "OUT003",
      file,
      `the sections are out of order. Expected ${expected.map((heading) => `"${heading}"`).join(" -> ")}.`,
    )
  }

  /* Nothing is built (contract C6). A component page at `planned` must carry
     the machine-readable not-implemented affordance, because the page's whole
     job is to be a definitive negative answer rather than an invitation to
     generate code against a specification. */
  if (kind === "component" && asText(page.frontmatter.status) === "planned") {
    if (!/<StubNotice[\s/>]/.test(stripCode(page.body))) {
      fail(
        "C6001",
        file,
        "a component page at status: planned must render <StubNotice> under ## Status. Without it the page reads as documentation for something that exists.",
      )
    }
  }

  /* Project pages carry their own freshness stamp (content-plan, kind: project). */
  if (kind === "project") {
    const body = stripCode(page.body)
    if (!/<LastUpdated[\s/>]/.test(body) || !/<Reviewed[\s/>]/.test(body)) {
      warn(
        "OUT011",
        file,
        "a project page ends with <LastUpdated /> and <Reviewed />. These pages are the ones readers check for currency, and an undated one is worse than an absent one.",
      )
    }
  }

  /* Clinical meaning, in both directions. */
  if (kind === "component") {
    const category = asText(page.frontmatter.category) ?? ""
    const hasClinical = foldedSet.has("Clinical meaning")
    if (category.startsWith("health-") && !hasClinical) {
      fail(
        "OUT010",
        file,
        'category begins with health-, so "## Clinical meaning" is mandatory: say what this component asserts about a person\'s health and what it must never be read as.',
      )
    }
    if (!category.startsWith("health-") && hasClinical) {
      fail(
        "OUT010",
        file,
        '"## Clinical meaning" is only for components whose category begins with health-. Remove the section or fix the category.',
      )
    }
  }
}

function knownMdxTags(): { known: Set<string>; drift: string[] } {
  const known = new Set([...MDX_VOCABULARY, ...MDX_CHILD_TAGS])
  const drift: string[] = []
  const source = readMaybe(join(APP_DIR, "components", "mdx.tsx"))
  if (!source) return { known, drift }

  const exported = new Set<string>()
  for (const line of source.split("\n")) {
    const entry = /^\s{2,}([A-Z][A-Za-z0-9]*)\s*[,:]/.exec(line)
    if (entry && entry[1]) exported.add(entry[1])
    const declared = /^export\s+(?:const|function)\s+([A-Z][A-Za-z0-9]*)/.exec(line)
    if (declared && declared[1]) exported.add(declared[1])
  }
  for (const name of exported) {
    if (!known.has(name)) {
      known.add(name)
      drift.push(name)
    }
  }
  return { known, drift }
}

function checkMdxTags(page: ParsedPage, known: Set<string>): void {
  const file = rel(page.file)
  const scrubbed = stripCode(page.body).replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
  const seen = new Set<string>()
  const pattern = /<([A-Z][A-Za-z0-9]*)(\.[A-Za-z0-9]+)?/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(scrubbed)) !== null) {
    const tag = match[1] as string
    if (seen.has(tag)) continue
    seen.add(tag)
    if (!known.has(tag)) {
      fail(
        "MDX001",
        file,
        `<${tag}> is not in the MDX vocabulary. The vocabulary is closed: content pages use the documented tags and never define one. If <${tag}> should exist, it belongs in components/mdx.tsx and in the anatomy contract first.`,
      )
    }
  }
}

function checkMdxLinks(page: ParsedPage): void {
  const file = rel(page.file)
  const lines = page.body.split("\n")
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (/\]\(\/docs(\/|\))/.test(line) || /href=["']\/docs(\/|["'])/.test(line)) {
      fail(
        "MDX002",
        file,
        "absolute /docs link. MDX uses relative file links resolved by createRelativeLink - `[Two colour axes](../health/two-colour-axes.mdx)` - so the corpus survives a base-path or locale change.",
        page.bodyOffset + index,
      )
    }
  }
}

/**
 * Blank out comments in a TypeScript source, preserving line count.
 *
 * The hardcoded-`/docs` rule looks for a quote character immediately before
 * the path, which is what tells a route literal apart from a filesystem path
 * like "content/docs/…". In a JSDoc block a backtick is markdown emphasis, not
 * a template literal, so a comment that merely NAMES the `/docs/<slug>.md`
 * route read as a hardcoded route and three files were failed for documenting
 * themselves accurately. A comment cannot be a link, so comments are removed
 * before the rule runs.
 *
 * String and template literals are tracked so a `//` inside "https://…" does
 * not swallow the rest of the line.
 */
function stripTsComments(source: string): string {
  let out = ""
  let quote: string | null = null
  let block = false
  let line = false

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i] as string
    const next = source[i + 1]

    if (block) {
      if (ch === "*" && next === "/") { block = false; i += 1; out += "  "; continue }
      out += ch === "\n" ? "\n" : " "
      continue
    }
    if (line) {
      if (ch === "\n") { line = false; out += "\n"; continue }
      out += " "
      continue
    }
    if (quote) {
      out += ch
      if (ch === "\\") { out += source[i + 1] ?? ""; i += 1; continue }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; out += ch; continue }
    if (ch === "/" && next === "*") { block = true; i += 1; out += "  "; continue }
    if (ch === "/" && next === "/") { line = true; i += 1; out += "  "; continue }
    out += ch
  }
  return out
}

function checkHardcodedDocsPaths(): void {
  const files: string[] = []
  for (const dir of ["app", "components", "lib"]) {
    walk(join(APP_DIR, dir), (name) => name.endsWith(".ts") || name.endsWith(".tsx"), files)
  }
  const configFile = join(APP_DIR, "next.config.mjs")
  if (exists(configFile)) files.push(configFile)

  /* A string literal that begins an absolute /docs path. "content/docs/..." is
     a filesystem path and is deliberately not matched. */
  const pattern = /(["'`])\/docs(\/|\1)/

  for (const file of files) {
    const relative_ = rel(file)
    if (DOCS_PATH_ALLOWLIST.includes(relative_)) continue
    if (relative_.startsWith("lib/generated/")) continue
    const contents = readMaybe(file)
    if (contents === undefined) continue
    const lines = stripTsComments(contents).split("\n")
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? ""
      /* Next's generated route keys — `PageProps<"/docs/[[...slug]]">` and the
         Layout/Route equivalents — are the route's own identity, produced by
         `next typegen`. They cannot be built through lib/routes.ts and renaming
         the segment would change them anyway, so they are not what this rule is
         looking for. */
      const executable = line.replace(
        /\b(?:PageProps|LayoutProps|RouteContext|LayoutSlots)<[^>]*>/g,
        "",
      )
      if (pattern.test(executable)) {
        fail(
          "TS001",
          relative_,
          "hardcoded /docs path. Build it through lib/routes.ts - that module is the single seam the deferred [lang] retrofit needs, and this rule is what keeps it single.",
          index + 1,
        )
        break
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * meta.json trees, orphans and dangling references                    *
 * ------------------------------------------------------------------ */

function checkMetaTrees(pages: ParsedPage[]): void {
  /* ADR 0008. Basenames of the generated `considered` component pages, which are
     resolvable routes that are deliberately absent from the sidebar. */
  const consideredComponentPages = new Set(
    pages
      .filter(
        (page) =>
          asText(page.frontmatter.kind) === "component" &&
          asText(page.frontmatter.status) === "considered",
      )
      .map((page) => page.file.replace(/\.mdx$/, "").split(sep).pop() ?? ""),
  )

  const bySlug = new Map(pages.map((page) => [page.slug, page]))

  const visit = (dir: string): void => {
    let entries: Dirent[]
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    const metaFile = join(dir, "meta.json")
    const meta = readMaybe(metaFile)
    const dirSlug = relative(DOCS_DIR, dir).split(sep).join("/")

    const children = entries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => ({
        name: entry.isDirectory() ? entry.name : entry.name.replace(/\.mdx$/, ""),
        isDirectory: entry.isDirectory(),
        raw: entry.name,
      }))
      .filter((child) => child.isDirectory || child.raw.endsWith(".mdx"))

    if (meta !== undefined) {
      let parsed: { pages?: unknown[] } | undefined
      try {
        parsed = JSON.parse(meta) as { pages?: unknown[] }
      } catch (error) {
        fail("IA004", rel(metaFile), `not valid JSON - ${(error as Error).message}`)
        parsed = undefined
      }

      const listed = Array.isArray(parsed?.pages) ? parsed.pages.map((entry) => String(entry)) : []
      /* fumadocs has three rest forms and none of them names a file.
         "..."   sweeps everything else in source order;
         "z...a" sweeps everything else in DESCENDING order, which is what a
                 changelog wants so entries never have to be re-sorted by hand
                 (fumadocs-core calls it `restReversed`);
         "...folder" EXTRACTS that folder's pages inline, which is how the
                 reference section lifts its generated pages to its own level.
         A leading "!" excludes, "---" is a separator and "[Label](url)" is an
         external link. Only what survives all of that is a page name. */
      const REST = new Set(["...", "z...a"])
      const rest = listed.some((entry) => REST.has(entry))
      const names = new Set(
        listed
          .filter(
            (entry) =>
              !entry.startsWith("---") && !entry.startsWith("[") && !REST.has(entry),
          )
          .map((entry) => entry.replace(/^!/, "").replace(/^\.\.\./, "")),
      )

      for (const name of names) {
        const asPage = join(dir, `${name}.mdx`)
        const asFolder = join(dir, name)
        if (!exists(asPage) && !isDirectory(asFolder)) {
          fail(
            "IA002",
            rel(metaFile),
            `lists "${name}", but neither ${name}.mdx nor ${name}/ exists in this folder.`,
          )
        }
      }

      if (!rest && listed.length > 0) {
        for (const child of children) {
          if (child.name === "index") continue

          /* ADR 0008 - the one deliberate exception to the orphan rule, and it
             runs in both directions. A `considered` component page must NOT be
             in the sidebar: thirty-six reserved names would swamp a navigation
             tree that describes a system with no components in it. But it must
             still resolve, so it is a real page at a guessable URL, reachable
             through search, the .md twins and /r/index.json. Listing one is the
             error here; omitting one is correct. */
          if (consideredComponentPages.has(child.name) && dirSlug === "components") {
            if (names.has(child.name)) {
              fail(
                "IA001",
                rel(join(dir, child.raw)),
                `is listed in components/meta.json, but a considered component page is deliberately absent from the sidebar - see ADR 0008. Remove it from meta.json; it stays resolvable without being listed.`,
              )
            }
            continue
          }

          if (names.has(child.name)) continue
          fail(
            "IA001",
            rel(join(dir, child.raw)),
            `not listed in ${dirSlug === "" ? "content/docs/meta.json" : `${dirSlug}/meta.json`} and that file has no "..." entry, so this page exists at a URL nothing in the sidebar links to.`,
          )
        }
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".")) visit(join(dir, entry.name))
    }
  }

  visit(DOCS_DIR)

  /* The Sections rail in the root meta.json is the one allowlisted place an
     absolute /docs link may appear (addendum A11). Everything it points at must
     resolve, or the rail sends readers to a 404 from every page on the site. */
  const rootMeta = readMaybe(join(DOCS_DIR, "meta.json"))
  if (rootMeta) {
    const pattern = /\[[^\]]+\]\((\/docs[^)]*)\)/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(rootMeta)) !== null) {
      const href = (match[1] as string).replace(/^\/docs\/?/, "")
      const slug = href === "" ? "index" : href
      if (!bySlug.has(slug) && !bySlug.has(`${slug}/index`)) {
        fail(
          "IA005",
          "content/docs/meta.json",
          `the Sections rail links to /docs/${href}, which is not a page in the corpus.`,
        )
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Route reachability (addendum A10)                                   *
 * ------------------------------------------------------------------ */

function routeForPageFile(file: string): string {
  const parts = relative(join(APP_DIR, "app"), file).split(sep)
  parts.pop()
  const segments = parts.filter((part) => !(part.startsWith("(") && part.endsWith(")")))
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/"
}

function checkRouteReachability(pages: ParsedPage[]): void {
  const appDir = join(APP_DIR, "app")
  if (!isDirectory(appDir)) return

  const pageFiles: string[] = []
  walk(appDir, (name) => name === "page.tsx" || name === "page.ts", pageFiles)

  /* Every literal string anywhere in the app's own source. A route linked from
     the home page, from the playground index or from lib/routes.ts is reachable;
     a route no file mentions is not. */
  const sourceFiles: string[] = []
  for (const dir of ["app", "components", "lib"]) {
    walk(join(APP_DIR, dir), (name) => name.endsWith(".ts") || name.endsWith(".tsx"), sourceFiles)
  }
  const corpus = new Map<string, string>()
  for (const file of sourceFiles) {
    const contents = readMaybe(file)
    if (contents !== undefined) corpus.set(file, contents)
  }

  const allowed = new Map(ROUTE_ALLOWLIST.map((entry) => [entry.route, entry.reason]))
  const navSet = new Set(TOP_NAV)
  const docsSlugs = new Set(pages.map((page) => page.slug))

  for (const file of pageFiles) {
    const route = routeForPageFile(file)
    if (allowed.has(route)) continue
    if (navSet.has(route)) continue

    /* A docs route is reachable if the corresponding page exists in the tree. */
    if (route.startsWith("/docs")) {
      const slug = route.replace(/^\/docs\/?/, "") || "index"
      if (docsSlugs.has(slug)) continue
    }

    let linkedFrom: string | undefined
    for (const [source, contents] of corpus) {
      if (source === file) continue
      if (contents.includes(`"${route}"`) || contents.includes(`'${route}'`) || contents.includes(`\`${route}\``)) {
        linkedFrom = source
        break
      }
    }
    if (linkedFrom) continue

    fail(
      "IA003",
      rel(file),
      `nothing links to ${route}. Every page under app/ must be reachable from the top navigation, from a page that links to it, or from the allowlist in assert-ia.mts with a stated reason - otherwise it renders for nobody.`,
    )
  }

  /* The top nav is frozen. If lib/layout.shared.tsx exists, it must agree. */
  const layout = readMaybe(join(APP_DIR, "lib", "layout.shared.tsx"))
  if (layout) {
    for (const href of TOP_NAV) {
      if (!layout.includes(href) && !layout.includes(href.replace("/docs", ""))) {
        warn(
          "IA006",
          "lib/layout.shared.tsx",
          `the frozen top navigation includes ${href}, which this file does not appear to declare. The nav is frozen by addendum A10 and this is the only file allowed to define it.`,
        )
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Catalogue consistency, both directions (addendum B18)               *
 * ------------------------------------------------------------------ */

function checkCatalogue(pages: ParsedPage[], catalogue: CatalogueRow[], source: string): void {
  const ids = new Set(catalogue.map((row) => row.name))
  const bySlug = new Map(pages.map((page) => [page.slug, page]))

  /* The catalogue against the frozen rosters (contracts C1 and C2). */
  const missingFromCatalogue = SHIPPED_IDS.filter((id) => !ids.has(id))
  if (missingFromCatalogue.length > 0) {
    warn(
      "CAT009",
      "registry/catalogue.ts",
      `the frozen roster of 24 specified components names ${missingFromCatalogue.length} id${
        missingFromCatalogue.length === 1 ? "" : "s"
      } the catalogue read from ${source} does not contain: ${missingFromCatalogue.join(", ")}.`,
    )
  }
  const unexpected = [...ids].filter(
    (id) => !SHIPPED_IDS.includes(id) && !CONSIDERED_IDS.includes(id),
  )
  if (unexpected.length > 0) {
    warn(
      "CAT009",
      "registry/catalogue.ts",
      `the catalogue contains ${unexpected.length} id${
        unexpected.length === 1 ? "" : "s"
      } that are in neither frozen roster: ${unexpected.join(", ")}. The rosters are contracts C1 and C2; growing them is a decision, not an edit.`,
    )
  }

  const componentPages = pages.filter((page) => asText(page.frontmatter.kind) === "component")
  const componentSlugs = new Set(componentPages.map((page) => page.slug))

  /* Every shipped id must have a page. */
  for (const row of catalogue) {
    if (row.status === "considered") continue
    if (!componentSlugs.has(`components/${row.name}`)) {
      fail(
        "CAT007",
        "registry/catalogue.ts",
        `\`${row.name}\` is in the catalogue as ${row.status ?? "planned"} but content/docs/components/${row.name}.mdx does not exist. A component only exists if it carries a specification.`,
      )
    }
  }

  /* Considered ids must resolve to something. */
  const catchAll = [
    join(APP_DIR, "app", "(chrome)", "(docs)", "docs", "components", "[id]", "page.tsx"),
    join(APP_DIR, "app", "(docs)", "docs", "components", "[id]", "page.tsx"),
  ].some((file) => exists(file))
  const unaddressed = catalogue
    .filter((row) => row.status === "considered")
    .filter((row) => !componentSlugs.has(`components/${row.name}`) && !catchAll)
    .map((row) => row.name)
  if (unaddressed.length > 0) {
    warn(
      "CAT008",
      "registry/catalogue.ts",
      `${unaddressed.length} considered component${unaddressed.length === 1 ? " has" : "s have"} no address of ${unaddressed.length === 1 ? "its" : "their"} own: neither a components/<id>.mdx page nor a catch-all route resolves ${unaddressed.join(", ")}. They are listed in the generated catalogue page and in /r, so an agent that reads either gets an answer; a reader who guesses the URL gets a 404. Addendum B19 asks for one mechanism to be chosen and recorded in an ADR.`,
    )
  }

  /* implements -> a real catalogue id, and the reverse. */
  const implementsByComponent = new Map<string, string[]>()
  for (const page of pages) {
    const implemented = asArray(page.frontmatter.implements)
    if (implemented.length === 0) {
      if (asText(page.frontmatter.kind) === "health" && page.slug !== "health/index") {
        warn(
          "CAT010",
          rel(page.file),
          "a health rule with no `implements` names no component it governs, so nothing on a component page links back to it.",
        )
      }
      continue
    }
    for (const id of implemented) {
      if (!ids.has(id)) {
        fail(
          "CAT001",
          rel(page.file),
          `\`implements: ${id}\` is not a catalogue id. Every entry must name a real component, shipped or considered - the catalogue is the only namespace.`,
        )
        continue
      }
      const list = implementsByComponent.get(id) ?? []
      list.push(page.slug)
      implementsByComponent.set(id, list)
    }
  }

  for (const page of componentPages) {
    const id = page.slug.replace(/^components\//, "")
    const governedBy = asArray(page.frontmatter.governedBy)

    for (const doctrine of governedBy) {
      const candidates = [doctrine, `health/${doctrine}`, `foundations/${doctrine}`, `accessibility/${doctrine}`]
      const target = candidates.find((slug) => bySlug.has(slug))
      if (!target) {
        fail(
          "CAT002",
          rel(page.file),
          `\`governedBy: ${doctrine}\` does not resolve to a page. Name the doctrine page's slug, for example \`two-colour-axes\` for health/two-colour-axes.`,
        )
        continue
      }
      const declared = asArray(bySlug.get(target)?.frontmatter.implements)
      if (!declared.includes(id)) {
        fail(
          "CAT003",
          rel(page.file),
          `this page says it is governed by ${target}, but that page's \`implements\` does not name \`${id}\`. The relationship is enforced in both directions so neither side can quietly stop being true.`,
        )
      }
    }

    /*
     * The reverse direction, and it is deliberately a warning rather than an
     * error.
     *
     * `governedBy` is a claim the component page makes, so a doctrine page that
     * does not corroborate it is a broken reference and fails above. `implements`
     * is a claim the doctrine page makes, and a rule legitimately governs more
     * components than each of those components chooses to list at the top of its
     * page - the six health pages that all govern AlertBanner would otherwise
     * force a frontmatter list nobody reads. Reported, not enforced, so the
     * asymmetry is visible rather than silent.
     */
    const unlisted = (implementsByComponent.get(id) ?? []).filter((doctrineSlug) => {
      if (doctrineSlug.endsWith("/index") || doctrineSlug === "index") return false
      const shortForm = doctrineSlug.split("/").pop() ?? doctrineSlug
      return !governedBy.includes(shortForm) && !governedBy.includes(doctrineSlug)
    })
    if (unlisted.length > 0) {
      warn(
        "CAT003",
        rel(page.file),
        `${unlisted.length} doctrine page${unlisted.length === 1 ? "" : "s"} claim to govern \`${id}\` without being named in its \`governedBy\`: ${unlisted.join(", ")}. Either list them or accept that the doctrine governs more than this page advertises.`,
      )
    }
  }

  /* usedIn -> a real recipe or screen, and that page must actually mention it. */
  for (const page of componentPages) {
    const id = page.slug.replace(/^components\//, "")
    for (const target of asArray(page.frontmatter.usedIn)) {
      const candidates = [target, `recipes/${target}`, `screens/${target}`, `patterns/${target}`]
      const slug = candidates.find((candidate) => bySlug.has(candidate))
      if (!slug) {
        fail(
          "CAT004",
          rel(page.file),
          `\`usedIn: ${target}\` does not resolve to a recipe, screen or pattern page.`,
        )
        continue
      }
      const target_ = bySlug.get(slug)
      /* Prose names a component in PascalCase and paths name it in kebab-case,
         so both spellings count as a mention. */
      const pascal = id
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")
      /* `implements:` IS the page declaring its composition, and it is the
         machine-readable half of the relation - so it counts as naming the
         component. Requiring a prose mention as well would force every screen to
         write a sentence about Surface and Skeleton, which is padding, not
         documentation. What the reverse index has to guarantee is that the
         relation is declared somewhere on both sides, not that it is narrated. */
      const declared = target_
        ? asArray(target_.frontmatter.implements).includes(id)
        : false
      if (
        target_ &&
        !declared &&
        !target_.body.includes(id) &&
        !target_.body.includes(pascal)
      ) {
        warn(
          "CAT004",
          rel(target_.file),
          `components/${id} declares \`usedIn: ${target}\`, but this page neither lists \`${id}\` in \`implements:\` nor mentions it. The reverse index should be true in both directions.`,
        )
      }
    }
  }

  /* Aliases are one namespace. Two pages claiming the same synonym means a
     reader's search and an agent's lookup can disagree about what it means. */
  const aliasOwners = new Map<string, string[]>()
  for (const page of pages) {
    for (const alias of asArray(page.frontmatter.aliases)) {
      const key = alias.trim().toLowerCase()
      if (key === "") continue
      const owners = aliasOwners.get(key) ?? []
      owners.push(page.slug)
      aliasOwners.set(key, owners)
    }
  }
  for (const [alias, owners] of aliasOwners) {
    if (owners.length > 1) {
      fail(
        "CAT005",
        `content/docs/${owners[0]}.mdx`,
        `the alias "${alias}" is claimed by ${owners.length} pages: ${owners.join(", ")}. Aliases are a single global namespace declared in registry/catalogue.ts; a synonym may point at exactly one page.`,
      )
    }
  }

  /* A component page's aliases must agree with the catalogue's, since search is
     fed from frontmatter while /r and llms.txt are fed from the catalogue. */
  const catalogueAliases = new Map(catalogue.map((row) => [row.name, row.aliases ?? []]))
  for (const page of componentPages) {
    const id = page.slug.replace(/^components\//, "")
    const fromCatalogue = catalogueAliases.get(id)
    if (!fromCatalogue || fromCatalogue.length === 0) continue
    const fromPage = asArray(page.frontmatter.aliases)
    const missing = fromCatalogue.filter((alias) => !fromPage.includes(alias))
    if (missing.length > 0) {
      warn(
        "CAT006",
        rel(page.file),
        `the catalogue gives \`${id}\` the synonyms ${missing.map((alias) => `"${alias}"`).join(", ")}, which this page does not carry. Search reads the page; /r and llms.txt read the catalogue - a reader and an agent should not get different answers.`,
      )
    }
  }
}

/* ------------------------------------------------------------------ *
 * Canonicality (decision 15)                                          *
 * ------------------------------------------------------------------ */

function checkCanonicality(pages: ParsedPage[]): void {
  for (const topic of CANONICAL_TOPICS) {
    const canonicalPage = pages.find((page) => page.slug === topic.canonical)
    if (!canonicalPage) continue

    for (const page of pages) {
      if (page.slug === topic.canonical) continue

      if (topic.widget && new RegExp(`<${topic.widget}[\\s/>]`).test(stripCode(page.body))) {
        fail(
          "DUP001",
          rel(page.file),
          `<${topic.widget}> belongs to ${topic.canonical} only - ${topic.reason}. Link to it instead.`,
        )
      }

      if (topic.markers) {
        const body = stripCode(page.body).toLowerCase()
        const hits = topic.markers.filter((marker) => body.includes(marker))
        if (hits.length < 2) continue
        const linksToCanonical =
          page.body.includes(topic.canonical.split("/").pop() ?? "") ||
          page.body.includes(topic.canonical)
        if (!linksToCanonical) {
          warn(
            "DUP002",
            rel(page.file),
            `this page discusses ${hits.join(" and ")} without linking to ${topic.canonical}, which is canonical for it - ${topic.reason}.`,
          )
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Coverage: <Todo> is measured, not hidden                            *
 * ------------------------------------------------------------------ */

function coverageReport(pages: ParsedPage[]): string[] {
  const withTodo = pages.filter((page) => /<Todo[\s/>]/.test(stripCode(page.body)))
  const byStatus = new Map<string, number>()
  const byKind = new Map<string, number>()
  for (const page of pages) {
    const status = asText(page.frontmatter.status) ?? "unset"
    const kind = asText(page.frontmatter.kind) ?? "unset"
    byStatus.set(status, (byStatus.get(status) ?? 0) + 1)
    byKind.set(kind, (byKind.get(kind) ?? 0) + 1)
  }
  const format = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => `${count} ${key}`)
      .join(" | ")

  return [
    `  pages    ${pages.length}`,
    `  status   ${format(byStatus)}`,
    `  kind     ${format(byKind)}`,
    `  todo     ${withTodo.length} page${withTodo.length === 1 ? "" : "s"} carry a <Todo> marker`,
    ...withTodo.slice(0, 10).map((page) => `             ${page.slug}`),
    withTodo.length > 10 ? `             ... and ${withTodo.length - 10} more` : "",
  ].filter((line) => line !== "")
}

/* ================================================================== *
 * Main                                                                *
 * ================================================================== */

async function main(): Promise<void> {
  const strict = process.argv.includes("--strict")
  const quiet = process.argv.includes("--quiet")

  if (!isDirectory(DOCS_DIR)) {
    console.warn(
      [
        "assert-ia: content/docs does not exist yet, so there is nothing to check.",
        "  Exiting 0. Once the corpus exists this gate is the thing that keeps it",
        "  coherent; before it exists there is nothing to be incoherent about.",
      ].join("\n"),
    )
    return
  }

  const files: string[] = []
  walk(DOCS_DIR, (name) => name.endsWith(".mdx"), files)
  const pages = files.map(parsePage)

  const schema = loadSchema()
  if (!schema) {
    warn(
      "FM000",
      "content/_templates/frontmatter.schema.json",
      "missing, so frontmatter was checked only for `status` and `kind`. That file is the machine-readable contract this gate reads instead of restating.",
    )
  }
  const outlines = loadOutlines()
  checkTemplateOutlines()
  const { known, drift } = knownMdxTags()
  for (const tag of drift) {
    warn(
      "MDX003",
      "components/mdx.tsx",
      `<${tag}> is provided to MDX but is not in the vocabulary list in assert-ia.mts. Either add it to the anatomy contract or stop exporting it - a tag that exists but is undocumented is a tag content authors will use inconsistently.`,
    )
  }

  for (const page of pages) {
    checkFrontmatter(page, schema)
    checkOutline(page, outlines)
    checkMdxTags(page, known)
    checkMdxLinks(page)
  }

  checkHardcodedDocsPaths()
  checkMetaTrees(pages)
  checkRouteReachability(pages)
  checkCanonicality(pages)

  const { rows, source } = await loadCatalogue()
  checkCatalogue(pages, rows, source)

  /* ---------------- report ---------------- */
  const errors = findings.filter((finding) => finding.level === "error")
  const warnings = findings.filter((finding) => finding.level === "warn")

  const print = (finding: Finding) => {
    const where = finding.line === undefined ? finding.file : `${finding.file}:${finding.line}`
    console.log(
      `${finding.level === "error" ? "ERROR" : "warn "}  ${finding.rule}  ${where}\n        ${finding.message}`,
    )
  }

  if (findings.length > 0) {
    console.log("")
    for (const finding of errors) print(finding)
    for (const finding of warnings) print(finding)
    console.log("")
  }

  if (!quiet) {
    console.log("assert-ia coverage")
    for (const line of coverageReport(pages)) console.log(line)
    console.log(`  catalogue read from ${source}`)
    console.log("")
  }

  console.log(
    `assert-ia: ${pages.length} pages checked - ${errors.length} error${errors.length === 1 ? "" : "s"}, ` +
      `${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`,
  )

  if (errors.length > 0 || (strict && warnings.length > 0)) process.exit(1)
}

await main()
