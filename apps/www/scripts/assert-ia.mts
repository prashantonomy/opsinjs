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
 * long description, a component page with no doctrine governing it. CI runs the
 * default mode; the nightly job runs --strict.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(
  process.versions.node.split(".")[0] ?? "0",
  10
)
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
    ].join("\n")
  )
  process.exit(1)
}

import {
  type Dirent,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

/* THE OUTLINE TABLE, READ FROM THE SAME PLACE <PageTemplate> READS IT.
   A component page's outline depends on its `status` as well as its `kind`, so
   it cannot be derived from a single template file: the moment one page ships,
   a template-derived outline demands "Proposed API" while <PageTemplate>
   demands "Usage", and no page edit satisfies both. Both
   enforcers now read lib/status.ts, which is also what
   content/_templates/component.mdx implements - and the template is checked
   against it below (OUT012) so it cannot rot unnoticed.

   The specifier carries an explicit `.ts` because this file is executed by
   plain `node` under native type stripping, which does not rewrite specifiers
   and does not read tsconfig's `@/*` alias. `lib/status.ts` has no imports of
   its own and no non-erasable syntax, so this costs nothing at load time.
   `registry/catalogue.ts` imports the same module the same way, in its
   `import type { HealthCategory, Status } from "../lib/status.ts"`. */
import {
  COMPONENT_OPTIONAL_SECTIONS,
  componentSections,
  isStatus,
  SECTION_OUTLINES,
  type Status,
} from "../lib/status.ts"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const DOCS_DIR = join(APP_DIR, "content", "docs")
const TEMPLATES_DIR = join(APP_DIR, "content", "_templates")

/* ================================================================== *
 * FROZEN CONTRACTS                                                    *
 * ================================================================== */

/**
 * EVERY ID OPSINJS HAS EVER CATALOGUED, frozen as contracts C1 and C2: the
 * twenty-four of the first wave, then the thirty-six that followed. Kebab-case
 * in paths and in the catalogue, PascalCase in prose.
 *
 * It is an allowlist and a fallback, and IT IS NOT A STATUS. Nothing about a
 * name's position in this array says whether the component is built, specified
 * or withdrawn. Read `registry/catalogue.ts` for that, which is the one file
 * that records a release phase. The array is frozen so that a rename is a
 * visible edit here rather than a silent drift, and it is compared against the
 * catalogue in both directions so that a divergence is reported.
 */
const KNOWN_IDS = [
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
 * THE TOP NAVIGATION IS EMPTY, AND THAT IS THE CURRENT DESIGN.
 *
 * Addendum A10 froze a six-item nav bar when the site had a landing page in
 * front of the documentation. It no longer does: the documentation is the site,
 * the sidebar is its navigation, and the tool routes the bar used to carry are
 * in the global footer. So this list is empty and IA006 has nothing to compare.
 *
 * The check it fed is not gone, only unfed. Route reachability below still
 * requires every `page.tsx` to be linked from real source, and with no nav to
 * lean on, a tool page that drops out of `components/site-footer.tsx` is caught
 * by IA003 rather than excused by an entry here. If a nav bar ever returns,
 * name its routes here and `lib/layout.shared.tsx` stays the only file allowed
 * to define it.
 */
const TOP_NAV: string[] = []

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
  "PromptRecipe",
  "EvalResult",
  "Feedback",
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
     withdrawn. That choice is what MDX003 asks a human to make.

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
  {
    route: "/[[...slug]]",
    reason:
      "the docs corpus, which is the whole site: it owns `/` as well as every section, and is reached through the sidebar on every page",
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

function fail(
  rule: string,
  file: string,
  message: string,
  line?: number
): void {
  findings.push({ level: "error", rule, file, message, line })
}

function warn(
  rule: string,
  file: string,
  message: string,
  line?: number
): void {
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

function walk(
  dir: string,
  predicate: (name: string) => boolean,
  out: string[]
): void {
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
  const slug = relative(DOCS_DIR, file)
    .replace(/\.mdx$/, "")
    .split(sep)
    .join("/")
  const lines = contents.split("\n")

  if ((lines[0] ?? "").trim() !== "---") {
    return {
      file,
      slug,
      frontmatter: {},
      body: contents,
      bodyOffset: 1,
      headings: collectHeadings(contents),
      frontmatterError:
        "no frontmatter block: the file does not begin with ---",
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

    /* A FLOW SEQUENCE PRETTIER HAS WRAPPED. `implements:` followed by `[` on
       the next line and one id per line is the same value as `implements: [a,
       b]`, and four pages are written that way. Reading only the single-line
       form left their ids invisible to CAT001, so a page could name a component
       that does not exist and no gate would say so - and CAT004 then reported
       those pages for not listing components they do list. Consume the lines up
       to the closing bracket and hand the joined text to the same parser rather
       than reflowing the pages, which prettier would only wrap again. */
    if (raw === "" || (raw.startsWith("[") && !raw.endsWith("]"))) {
      const buffer: string[] = []
      let scan = index + 1
      if (raw === "") {
        while (scan < end && (lines[scan] ?? "").trim() === "") scan += 1
        if (scan >= end || !(lines[scan] ?? "").trim().startsWith("[")) {
          /* An empty value that is not the head of a wrapped list: the key is
             present with nothing after it, which stays an empty list. */
          frontmatter[key] = []
          continue
        }
      } else {
        buffer.push(raw)
      }

      let closed = false
      for (; !closed && scan < end; scan += 1) {
        const text = (lines[scan] ?? "").trim()
        buffer.push(text)
        if (text.endsWith("]")) closed = true
      }
      if (!closed) {
        error = `the list after "${key}:" is never closed`
        frontmatter[key] = []
        continue
      }
      frontmatter[key] = parseInlineArray(buffer.join(" "))
      index = scan - 1
      continue
    }

    frontmatter[key] =
      raw.startsWith("[") && raw.endsWith("]")
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
 * bullet read as prose. That is how a `render={(props) => <MyButton …>}`
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
    if (
      run &&
      run[0] === delimiter &&
      run.length >= width &&
      line.trim() === run
    ) {
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
  if (value === undefined || Array.isArray(value) || typeof value === "object")
    return undefined
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
 * H2s a page may leave out. Everything else its outline names is required.
 *
 * A conditional heading is still ordered and still allowed: it keeps its place
 * in the outline, so OUT002 and OUT003 go on reading `outline` and only OUT001
 * reads this. That is the whole of the required-plus-optional split on this
 * side, and it is why the five component sections here needed one assignment
 * rather than a second outline table.
 *
 * The component list is imported rather than retyped. `<PageTemplate>` reads
 * the same array at render time, and two enforcers that disagree about which
 * heading may be missing produce a page nobody can write: this script would
 * pass it and `next build` would throw on it.
 *
 * "Clinical meaning" is not here, although it too can be absent. It is
 * conditional on the component's category rather than on the author's
 * judgement, `componentSections(status, category)` has already dropped it for a
 * non-`health-` category by the time this set is read, and OUT010 below is what
 * reports both directions with a message worth reading. Listing it here would
 * make it merely optional on a health component, which is the opposite of the
 * rule.
 */
const CONDITIONAL_HEADINGS: Record<string, string[]> = {
  component: [...COMPONENT_OPTIONAL_SECTIONS],
}

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
        `content/_templates/${kind}.mdx is missing, so nothing checks that the template still implements the outline in lib/status.ts.`
      )
      continue
    }
    const found = parsePage(file).headings
    if (found.join("\0") === expected.join("\0")) continue
    fail(
      "OUT012",
      relative(APP_DIR, file),
      `the template no longer implements the outline in lib/status.ts. Expected ${expected
        .map((heading) => `"${heading}"`)
        .join(
          " -> "
        )}, found ${found.map((heading) => `"${heading}"`).join(" -> ")}. Change lib/status.ts and the template together, never one alone.`,
      1
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
  usedIn?: string[]
}

/**
 * The rows as AUTHORED, imported from registry/catalogue.ts, or null when that
 * file is absent, throws, or exports nothing array-shaped.
 *
 * It is its own function because two callers want different copies of the same
 * table. `loadCatalogue()` falls back to it when the generated JSON is absent
 * or unparseable, so the gate degrades to the authored file rather than
 * switching itself off; CAT014 reads it directly, because `usedIn` lives only
 * in the authored file and never in the generated JSON.
 */
async function importAuthoredCatalogue(): Promise<CatalogueRow[] | null> {
  const file = join(APP_DIR, "registry", "catalogue.ts")
  if (!exists(file)) return null
  try {
    const mod = (await import(pathToFileURL(file).href)) as Record<
      string,
      unknown
    >
    /* `CATALOGUE` first, and it was missing. registry/catalogue.ts exports
       `CATALOGUE` (uppercase), `SHIPPED` and `RESERVED_ALIASES`, and none of
       the names below matched. This branch therefore silently found
       nothing and fell through to the frozen roster, which carries NO aliases.
       CAT005 and CAT006 would then have quietly stopped checking anything the
       moment lib/generated/catalogue.json was deleted or corrupted, and a
       gate that stops checking without saying so is worse than no gate.
       The key list in `loadCatalogue()` in scripts/build-registry.mts
       already had it right, and naming the function rather than its line
       number is deliberate: the line this comment used to cite has since
       moved seventy lines and pointed at an unrelated helper. */
    for (const key of [
      "CATALOGUE",
      "catalogue",
      "components",
      "entries",
      "items",
      "default",
    ]) {
      const value = mod[key]
      if (Array.isArray(value) && value.length > 0)
        return value as CatalogueRow[]
    }
  } catch {
    return null
  }
  return null
}

async function loadCatalogue(): Promise<{
  rows: CatalogueRow[]
  source: string
}> {
  const generated = readMaybe(
    join(APP_DIR, "lib", "generated", "catalogue.json")
  )
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

  const authored = await importAuthoredCatalogue()
  if (authored) return { rows: authored, source: "registry/catalogue.ts" }

  return {
    rows: KNOWN_IDS.map((name) => ({ name, status: "planned" })),
    source:
      "the frozen roster in assert-ia.mts (no catalogue could be read, so every " +
      "id is reported as planned, which is the phase that claims least)",
  }
}

/* ================================================================== *
 * Checks                                                              *
 * ================================================================== */

function checkFrontmatter(
  page: ParsedPage,
  schema: FrontmatterSchema | undefined
): void {
  const file = rel(page.file)
  if (page.frontmatterError) {
    fail("FM001", file, page.frontmatterError, 1)
    return
  }

  const front = page.frontmatter
  const kind = asText(front.kind)
  const status = asText(front.status)

  /* No schema file means the JSON contract could not be read, so only the two
     things this function knows without it are checked. `status` is NOT one of
     them any more: it is required on a component page and forbidden everywhere
     else, and FM014 below is the rule that knows the difference. Asserting it
     here would fail every non-component page the moment the schema went missing. */
  if (!schema) {
    if (!kind) fail("FM002", file, "frontmatter is missing `kind`", 1)
    return
  }

  for (const required of schema.required) {
    const value = front[required]
    if (
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      fail(
        "FM002",
        file,
        `frontmatter is missing \`${required}\` (required by the schema)`,
        1
      )
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
          1
        )
      }
      continue
    }
    if (property.type === "array" && !Array.isArray(value)) {
      fail("FM005", file, `\`${key}\` must be a list`, 1)
      continue
    }
    if (
      property.type === "string" &&
      (Array.isArray(value) || typeof value === "object")
    ) {
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
          1
        )
      }
    }
  }

  /* FM014: WHICH PAGES OWE A RELEASE PHASE, IN BOTH DIRECTIONS.
     `status` cannot be required by the JSON schema, because the schema sees one
     page's fields and not the rule that binds two of them together. It is
     required here instead, and the other direction is checked in the same
     place so that the two halves cannot drift apart: an author who adds the
     line to a handbook chapter is told to remove it by the same rule that told
     the component author to add it.

     The word used to sit on every page and mean two different things. On a
     component page it answered a question about code. Everywhere else it meant
     "this prose is finished", which is a different claim wearing the same word,
     and it was the claim that published `status: stable` on 262 pages while the
     components those pages describe had been through no review at all. */
  if (kind === "component" && status === undefined) {
    fail(
      "FM014",
      file,
      "a component page must declare `status`: planned, shipped or deprecated. It is the only page kind where the word answers a question about code rather than about prose, and /r, the .md twin and the search shard all read it.",
      1
    )
  }
  if (kind !== "component" && status !== undefined) {
    fail(
      "FM014",
      file,
      "`status` is only for kind: component. On a documentation page the word used to mean 'this prose is finished', which is a different claim wearing the same word, and it is gone. Delete the line.",
      1
    )
  }

  /* One date field left. `a11yDate` was the other, and it went with the
     frontmatter property: a single review date stamped across seventy-eight
     pages in one pass recorded nothing that happened. */
  const reviewedValue = asText(front.reviewed)
  if (reviewedValue !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(reviewedValue)) {
    fail("FM012", file, `\`reviewed: ${reviewedValue}\` is not an ISO date (YYYY-MM-DD)`, 1)
  }

  const description = asText(front.description)
  if (description !== undefined && description.length > 240) {
    warn(
      "FM013",
      file,
      `the description is ${description.length} characters. It is the search snippet and the card subtitle - one sentence.`,
      1
    )
  }

  if (kind === "health") {
    if (asText(front.evidence) === undefined) {
      fail(
        "FM010",
        file,
        "a health page must declare `evidence: cited | opinion | mixed`. An honest `opinion` is always better than a plausible-looking reference.",
        1
      )
    }
    if (asText(front.reviewed) === undefined) {
      fail(
        "FM010",
        file,
        "a health page must carry `reviewed:` with the date it was last reviewed",
        1
      )
    }
  }

  if (kind === "component") {
    const category = asText(front.category) ?? ""
    if (
      category.startsWith("health-") &&
      asArray(front.governedBy).length === 0
    ) {
      fail(
        "FM011",
        file,
        `category \`${category}\` begins with health-, so \`governedBy\` is mandatory: name the doctrine pages that decide what this component may assert.`,
        1
      )
    }
  }
}

/**
 * Headings that are legitimately written two ways.
 *
 * This table is a deliberate copy of the one in
 * `components/docs/page-template.tsx`, and the two must stay identical:
 * that file runs during `next build` and throws, this one runs in `pnpm check`
 * and can name a line. A page that satisfies one and fails the other is a page
 * nobody can write. The table cannot be shared through `lib/status.ts` without
 * teaching the status vocabulary about heading spellings, which is a different
 * concern - so it is duplicated, and this comment is the reason.
 */
const HEADING_ALIASES: Record<string, string[]> = {
  "when to use it": ["when to use"],
  "approved / rejected": ["approved and rejected"],
  "why (evidence)": ["why"],
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

/**
 * What SAFE001 says when a component page drops the review floor.
 *
 * It is a constant rather than an inline string because it is long, and it is
 * long because a one-line message would get the sentence put back in the wrong
 * place. The two things an author needs to know are what to write and where it
 * has to live, and the second one is counter-intuitive.
 */
const SAFE001_MESSAGE =
  "this component page does not say inside <StubNotice>, in authored MDX, " +
  "that it has had no accessibility review and no clinical review and is " +
  "not for a production health surface. Write both halves. `shipped` means " +
  "the source installs and means nothing about either review, and no " +
  "component in this catalogue has had either, so the phase word cannot " +
  "carry this and the page has to. It belongs in the MDX body rather than " +
  "in the React component because app/_machine/corpus.ts builds every .md " +
  "twin from getText(\"processed\"), which keeps a JSX tag and the children " +
  "an author wrote and never what the component renders at runtime. A " +
  "sentence moved into chrome reaches a human on the rendered page and " +
  "disappears from all 60 twins, from every llms-*.txt shard, from " +
  "/r/docs.json and from the offline bundle, which is where an agent reads " +
  "this page. Take it out in the same commit as the first review that " +
  "lands, and not before."

function checkOutline(
  page: ParsedPage,
  outlines: Record<string, string[]>
): void {
  const file = rel(page.file)
  const kind = asText(page.frontmatter.kind)
  if (!kind) return
  const policy = OUTLINE_POLICY[kind]
  if (!policy || policy === "free") return

  const present = page.headings
  const presentSet = new Set(present)
  const status = asText(page.frontmatter.status)

  /* THE OUTLINE. For every kind but `component` it is the template's H2 list.
     For `component` it is status-gated and comes from the same table
     <PageTemplate> throws on, because a component page's outline is a function
     of its release phase: `planned` has "Proposed API" and no "Usage",
     "Examples" or "API reference", because there is nothing yet to use, show or
     document. A single template cannot express that, and a page cannot satisfy
     two enforcers that disagree about it.

     What the outline is NOT is the list of headings the page must carry. Five
     of a shipped component's sections are in CONDITIONAL_HEADINGS above and may
     be left out; the outline still fixes where they go if they are there. So
     OUT001 below runs on the outline minus the conditional set, while OUT002
     and OUT003 run on the whole outline. */
  let outline: string[] | undefined
  let outlineSource: string
  if (kind === "component") {
    if (!isStatus(status)) {
      /* FM003 reports the bad status with a better message; checking a page's
         headings against an outline we cannot resolve would only add noise. */
      return
    }
    outline = componentSections(
      status as Status,
      asText(page.frontmatter.category) ?? ""
    )
    outlineSource = `componentSections("${status}", …) in lib/status.ts`
  } else {
    outline = outlines[kind]
    outlineSource = `content/_templates/${kind}.mdx`
  }

  if (!outline) {
    warn(
      "OUT004",
      file,
      `content/_templates/${kind}.mdx is missing, so this page's headings could not be checked against its kind.`
    )
    return
  }

  const conditional = new Set(CONDITIONAL_HEADINGS[kind] ?? [])

  if (policy === "header") {
    const first = outline[0]
    if (first && !presentSet.has(first)) {
      fail(
        "OUT001",
        file,
        `a ${kind} page must carry the "## ${first}" section`
      )
    }
    return
  }

  /* Heading aliases, mirroring <PageTemplate>. Two enforcers that disagree
     about whether two spellings are the same section produce a page nobody can
     write: this script would demand one and `next build` would throw on the
     other. So a component page's headings are folded onto their canonical
     section name here, and every check below runs on the folded list. Nothing
     is loosened - the canonical section must still be present, in the right
     place, and a heading that folds onto nothing is still OUT002.

     The accessibility section used to need folding of its own, because it was
     spelled "Accessibility requirements" at `planned` and "Accessibility"
     afterwards. It is now spelled "Accessibility" at every status, which is
     also why rule code OUT013 no longer exists. That code is retired and is
     not to be reused: a code that turns up in a commit message, a review
     comment or a contributor's notes has to keep meaning what it meant.

     Only `component` is folded. The other eleven kinds keep the byte-exact
     matching they have always had. */
  const canonicalOf = new Map<string, string>()
  if (kind === "component") {
    for (const section of outline) {
      for (const candidate of headingCandidates(section))
        canonicalOf.set(candidate, section)
    }
  }
  const folded =
    kind === "component"
      ? present.map(
          (heading) => canonicalOf.get(normaliseHeading(heading)) ?? heading
        )
      : present
  const foldedSet = new Set(folded)

  const required =
    REQUIRED_HEADINGS[kind] ??
    outline.filter((heading) => !conditional.has(heading))
  for (const heading of required) {
    if (!foldedSet.has(heading)) {
      fail(
        "OUT001",
        file,
        kind === "component"
          ? `missing "## ${heading}". It is required for a component at status: ${status}, and only ${[...conditional].map((section) => `"${section}"`).join(", ")} may be left out - see ${outlineSource}. Write the section, or, if there is genuinely nothing to say yet, say that in prose under the heading rather than dropping it.`
          : `missing "## ${heading}". The outline for kind: ${kind} is fixed - see ${outlineSource}.`
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
            ? `"## ${heading}" is not part of the outline for a component at status: ${status}. The outline is ${outline.map((section) => (conditional.has(section) ? `"${section}" (optional)` : `"${section}"`)).join(" -> ")}. Optional sections may be omitted; this one is not in the outline at all. Use an H3 inside an existing section, or move the page to the status whose outline has it.`
            : `"## ${heading}" is not part of the outline for kind: ${kind}. Use an H3 inside an existing section, or change the page's kind.`
        )
      }
    }
  }

  /* Order, as a subsequence rather than an equality. `expected` is the outline
     narrowed to the sections this page actually carries, so leaving out an
     optional one is not an ordering defect; what is present still has to run in
     outline order. Only the headings the contract names are ordered either way,
     so a guide's own task sections may appear between them. */
  const ordering = REQUIRED_HEADINGS[kind] ?? outline
  const ordered = folded.filter((heading) => ordering.includes(heading))
  const expected = ordering.filter((heading) => foldedSet.has(heading))
  if (ordered.join("\u0000") !== expected.join("\u0000")) {
    fail(
      "OUT003",
      file,
      `the sections are out of order. Expected ${expected.map((heading) => `"${heading}"`).join(" -> ")}.`
    )
  }

  /* THIS ONE is not built (contract C6), whatever else is. A component page at
     `planned` must carry the machine-readable not-implemented affordance,
     because that page's whole job is to be a definitive negative answer rather
     than an invitation to generate code against a specification. The rule is
     per page and always has been; the heading on this comment used to read
     "Nothing is built", which was a description of the corpus rather than of
     the check, and it stopped being true the day the first component shipped.

     A COMPONENT PAGE WITH CODE BEHIND IT IS HELD TO THE SAME REQUIREMENT, for
     a different reason. Promotion sheds <NotBuiltYet> and <Todo> and nothing
     else: <StubNotice> survives it and gains its real phase, where it stops
     saying "nothing is implemented" and starts saying "installable, and not
     reviewed". That was a convention 23 of the 24 built pages kept and no
     check enforced, which is how the one page with the most unmeasured
     questions came to be the one publishing no machine-readable marker at
     all. A page's prose is not what /r, the markdown twins or the search
     shards read. The rule now covers every phase rather than naming two of
     three, so adding a fourth phase could not quietly exempt a page. */
  if (kind === "component") {
    const notice = /<StubNotice\b[\s\S]*?<\/StubNotice>/.exec(stripCode(page.body))
    if (!/<StubNotice[\s/>]/.test(stripCode(page.body))) {
      fail(
        "C6001",
        file,
        status === "planned"
          ? "a component page at status: planned must render <StubNotice> under ## Status. Without it the page reads as documentation for something that exists."
          : status === "deprecated"
            ? 'a component page at status: deprecated must render <StubNotice status="deprecated"> under ## Status. A component on its way out is the one a reader is most likely to meet through an old link, so the page that names the replacement is the last page that may drop the marker.'
            : 'a component page must render <StubNotice status="shipped"> under ## Status. Promotion sheds <NotBuiltYet> and <Todo>; <StubNotice> stays, carries the phase, and carries the open safety questions, which are still open on every component in this catalogue.'
      )
    } else {
      /* SAFE001. THE REVIEW FLOOR, IN AUTHORED MDX, ON EVERY COMPONENT PAGE.
         Collapsing the phase vocabulary to three words took away the only
         gradient a reader had between "this works" and "somebody checked
         this", and `shipped` answers the first question and is silent on the
         second. The sentence below is what replaced the gradient. It is
         carried on six surfaces and this is the only one a build can hold,
         because the other five are single strings in TypeScript.

         The rule is per page and it is not keyed on the phase. A `planned`
         page has had no review either, and a `deprecated` one is the page a
         reader is most likely to reach through a stale link. Keying the floor
         to `shipped` would have made the two quiet phases the loud exception,
         which is backwards.

         Matching is done on the normalised text of the whole element, so the
         sentence may wrap wherever the prose reads best; `metric-tile` wraps
         it across two lines and a naive line grep found 31 of 60 pages that
         carry it. Both halves are required, because either half alone is a
         half-truth: "no review" without "not for production" reads as a
         caveat, and "not for production" without "no review" reads as a
         maturity note.

         JSX COMMENTS ARE CUT OUT BEFORE THE MATCH, and that is not tidiness.
         A JSX comment, the brace-slash-star form MDX allows in a body,
         renders nothing and reaches no reader, and until it was stripped the
         sentence sitting inside one satisfied this rule on a page that
         showed a reader no warning at all. It takes one author
         commenting the paragraph out mid-edit and forgetting. The build
         stayed green and the page lost the only thing on it that carries
         risk. Only `stripCode()`'s own fenced blocks were being removed here,
         and `stripCode()` is shared with roughly fifteen other checks that do
         want comment text, so the strip is done on this one string rather
         than in the helper. */
      const block = (notice?.[0] ?? "")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
        .split(/\s+/)
        .join(" ")
      if (
        !/no accessibility review and no clinical review/i.test(block) ||
        !/not for a production health surface/i.test(block)
      ) {
        fail("SAFE001", file, SAFE001_MESSAGE)
      }
    }
  }

  /* Project pages carry their own freshness stamp (content-plan, kind: project). */
  if (kind === "project") {
    const body = stripCode(page.body)
    if (!/<LastUpdated[\s/>]/.test(body) || !/<Reviewed[\s/>]/.test(body)) {
      warn(
        "OUT011",
        file,
        "a project page ends with <LastUpdated /> and <Reviewed />. These pages are the ones readers check for currency, and an undated one is worse than an absent one."
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
        'category begins with health-, so "## Clinical meaning" is mandatory: say what this component asserts about a person\'s health and what it must never be read as.'
      )
    }
    if (!category.startsWith("health-") && hasClinical) {
      fail(
        "OUT010",
        file,
        '"## Clinical meaning" is only for components whose category begins with health-. Remove the section or fix the category.'
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
    const declared = /^export\s+(?:const|function)\s+([A-Z][A-Za-z0-9]*)/.exec(
      line
    )
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
        `<${tag}> is not in the MDX vocabulary. The vocabulary is closed: content pages use the documented tags and never define one. If <${tag}> should exist, it belongs in components/mdx.tsx and in the anatomy contract first.`
      )
    }
  }
}

/**
 * A relative link that `createRelativeLink` will not resolve, and a relative
 * link that resolves to nothing.
 *
 * fumadocs resolves an href ONLY when it starts with `./` or `../`. Its
 * `resolveHref` is four lines and the prefix test is the first of them:
 * anything else is handed back untouched. So `[colour](colour/tokens.mdx)`
 * never becomes a URL. It reaches the browser as written, the browser resolves
 * it against the CURRENT page rather than against the file, and
 * `/foundations` plus `colour/tokens.mdx` is `/colour/tokens.mdx`,
 * which is a 404 with no build error behind it. 353 links in the corpus were
 * written that way, including the six token-family links on the Foundations
 * index, which is why Colour looked missing from a pillar that has always
 * contained it.
 *
 * MDX005 is the other half. A prefix is what makes a link resolvable, not what
 * makes it correct, and a `./` in front of a filename that does not exist fails
 * exactly as quietly. Both are errors rather than warnings because neither has
 * a legitimate form: there is no page for which an unresolvable link is right.
 */
function checkMdxLinks(page: ParsedPage): void {
  const file = rel(page.file)
  const dir = dirname(page.file)
  const lines = page.body.split("\n")
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (
      /\]\(\/docs(\/|\))/.test(line) ||
      /href=["']\/docs(\/|["'])/.test(line)
    ) {
      fail(
        "MDX002",
        file,
        "absolute /docs link. MDX uses relative file links resolved by createRelativeLink - `[Two colour axes](../health/two-colour-axes.mdx)` - so the corpus survives a base-path or locale change.",
        page.bodyOffset + index
      )
    }

    const bare =
      /\]\((?!https?:|mailto:|#|\/|\.\/|\.\.\/)([A-Za-z0-9][A-Za-z0-9._/-]*\.mdx)/g
    let match: RegExpExecArray | null
    while ((match = bare.exec(line)) !== null) {
      fail(
        "MDX004",
        file,
        `relative link \`${match[1] as string}\` has no \`./\` prefix, so createRelativeLink hands it to the browser unresolved and it 404s against whatever URL the reader is on. Write \`./${match[1] as string}\`.`,
        page.bodyOffset + index
      )
    }

    const target =
      /\]\((\.{1,2}\/[A-Za-z0-9._/-]*\.mdx)(?:#[A-Za-z0-9._-]+)?\)/g
    while ((match = target.exec(line)) !== null) {
      const href = match[1] as string
      if (!existsSync(resolve(dir, href))) {
        fail(
          "MDX005",
          file,
          `relative link \`${href}\` resolves to no file, so the page it points at does not exist.`,
          page.bodyOffset + index
        )
      }
    }
  }
}

/**
 * Blank out comments in a TypeScript source, preserving line count.
 *
 * The hardcoded-`/docs` rule reads string and template literals, and a comment
 * is neither. In a JSDoc block a backtick is markdown emphasis rather than a
 * template literal, so a comment that merely NAMES the `/docs/<slug>.md` route
 * read as a hardcoded route and three files were failed for documenting
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
      if (ch === "*" && next === "/") {
        block = false
        i += 1
        out += "  "
        continue
      }
      out += ch === "\n" ? "\n" : " "
      continue
    }
    if (line) {
      if (ch === "\n") {
        line = false
        out += "\n"
        continue
      }
      out += " "
      continue
    }
    if (quote) {
      out += ch
      if (ch === "\\") {
        out += source[i + 1] ?? ""
        i += 1
        continue
      }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch
      out += ch
      continue
    }
    if (ch === "/" && next === "*") {
      block = true
      i += 1
      out += "  "
      continue
    }
    if (ch === "/" && next === "/") {
      line = true
      i += 1
      out += "  "
      continue
    }
    out += ch
  }
  return out
}

/**
 * Blank out everything that is NOT the text of a string or template literal,
 * preserving line count, offsets and the literal's own delimiters.
 *
 * The rule below used to require a quote character immediately before the path,
 * which is a cheap way of telling a route literal apart from a filesystem path
 * - and it left a hole wide enough to drive a route through. `${base}/docs/${slug}`
 * has an interpolation before the path, not a quote, so the one construction
 * most likely to be a hand-built route was the one construction the rule could
 * not see. So did any route named inside a longer sentence in an error message.
 *
 * Narrowing to literal TEXT is what lets the check drop that requirement safely.
 * Two things fall out of it that a looser regex over raw source gets wrong:
 *
 *   - A REGEX LITERAL is not a string. `pathname.replace(/^\/docs\/?/, "")` is
 *     a component reading a prefix off a value it was handed, not a component
 *     minting a route, and components/docs/meta.tsx does exactly that.
 *   - An INTERPOLATION is not literal text either. The expression inside `${…}`
 *     is code, and it is blanked, which is what keeps the regex-literal case
 *     above true even when the regex sits inside a template.
 *
 * Nested quotes inside an interpolation are tracked so that a `}` inside a
 * string does not close the interpolation early.
 */
function stringLiteralsOnly(source: string): string {
  let out = ""
  let quote: string | null = null
  /* One frame per `${` depth, each remembering the quote it is inside. */
  const interpolations: { depth: number; quote: string | null }[] = []
  const blank = (ch: string): string => (ch === "\n" ? "\n" : " ")

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i] as string
    const next = source[i + 1]

    const frame = interpolations[interpolations.length - 1]
    if (frame) {
      if (frame.quote) {
        if (ch === "\\") {
          out += blank(ch) + blank(source[i + 1] ?? " ")
          i += 1
          continue
        }
        if (ch === frame.quote) frame.quote = null
        out += blank(ch)
        continue
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        frame.quote = ch
        out += blank(ch)
        continue
      }
      if (ch === "{") {
        frame.depth += 1
        out += blank(ch)
        continue
      }
      if (ch === "}") {
        frame.depth -= 1
        out += blank(ch)
        if (frame.depth === 0) interpolations.pop()
        continue
      }
      out += blank(ch)
      continue
    }

    if (quote) {
      if (ch === "\\") {
        out += ch + (source[i + 1] ?? "")
        i += 1
        continue
      }
      if (quote === "`" && ch === "$" && next === "{") {
        interpolations.push({ depth: 1, quote: null })
        out += blank(ch) + blank(next)
        i += 1
        continue
      }
      out += ch
      if (ch === quote) quote = null
      continue
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch
      out += ch
      continue
    }
    out += blank(ch)
  }
  return out
}

function checkHardcodedDocsPaths(): void {
  const files: string[] = []
  for (const dir of ["app", "components", "lib"]) {
    walk(
      join(APP_DIR, dir),
      (name) => name.endsWith(".ts") || name.endsWith(".tsx"),
      files
    )
  }
  const configFile = join(APP_DIR, "next.config.mjs")
  if (exists(configFile)) files.push(configFile)

  /* An absolute `/docs` route, anywhere inside a string or template literal.
     Both halves of this pattern are doing work.

     WHAT MUST COME BEFORE IT: anything that is not a word character, a dot, a
     hyphen or a slash - so the start of the literal, a space in a sentence, or
     the blank an interpolation leaves behind. That single character class is
     what spares every path this rule has always been meant to spare, and it
     spares them by their own shape rather than by an allowlist:
     "content/docs/…" and "fumadocs-ui/layouts/docs/page" have a word character
     there, "./docs/anatomy" and "@/components/docs/status" have a dot or a
     slash, and "https://example.com/docs/x" has the `m` of the hostname.

     WHAT MUST COME AFTER IT: the end of the segment. `/docs` may be followed by
     another segment, a fragment, a query, the closing quote, or the punctuation
     that ends a clause in a sentence - but not by a letter, which is what keeps
     "/docsearch" out of it. */
  const pattern = /(^|[^A-Za-z0-9_.\-/])\/docs(?=$|[/#?"'`\s,.);\\])/

  for (const file of files) {
    const relative_ = rel(file)
    if (DOCS_PATH_ALLOWLIST.includes(relative_)) continue
    if (relative_.startsWith("lib/generated/")) continue
    const contents = readMaybe(file)
    if (contents === undefined) continue
    /* `PageProps<"/docs/[[...slug]]">` and the Layout/Route equivalents are
       Next's generated route keys, which are the route's own identity,
       produced by `next typegen`. They cannot be built through lib/routes.ts
       and renaming the segment would change them anyway, so they are not what
       this rule is looking for. Blanked rather than deleted, and confined to
       one line, so that every offset below still names the line it came from. */
    const executable = stripTsComments(contents).replace(
      /\b(?:PageProps|LayoutProps|RouteContext|LayoutSlots)<[^>\n]*>/g,
      (matched) => " ".repeat(matched.length)
    )
    const lines = stringLiteralsOnly(executable).split("\n")
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? ""
      if (pattern.test(line)) {
        fail(
          "TS001",
          relative_,
          "hardcoded /docs path. Build it through lib/routes.ts - that module is the single seam the deferred [lang] retrofit needs, and this rule is what keeps it single.",
          index + 1
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
        name: entry.isDirectory()
          ? entry.name
          : entry.name.replace(/\.mdx$/, ""),
        isDirectory: entry.isDirectory(),
        raw: entry.name,
      }))
      .filter((child) => child.isDirectory || child.raw.endsWith(".mdx"))

    if (meta !== undefined) {
      let parsed: { pages?: unknown[] } | undefined
      try {
        parsed = JSON.parse(meta) as { pages?: unknown[] }
      } catch (error) {
        fail(
          "IA004",
          rel(metaFile),
          `not valid JSON - ${(error as Error).message}`
        )
        parsed = undefined
      }

      const listed = Array.isArray(parsed?.pages)
        ? parsed.pages.map((entry) => String(entry))
        : []
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
              !entry.startsWith("---") &&
              !entry.startsWith("[") &&
              !REST.has(entry)
          )
          .map((entry) => entry.replace(/^!/, "").replace(/^\.\.\./, ""))
      )

      for (const name of names) {
        const asPage = join(dir, `${name}.mdx`)
        const asFolder = join(dir, name)
        if (!exists(asPage) && !isDirectory(asFolder)) {
          fail(
            "IA002",
            rel(metaFile),
            `lists "${name}", but neither ${name}.mdx nor ${name}/ exists in this folder.`
          )
        }
      }

      if (!rest && listed.length > 0) {
        for (const child of children) {
          if (child.name === "index") continue

          if (names.has(child.name)) continue
          fail(
            "IA001",
            rel(join(dir, child.raw)),
            `not listed in ${dirSlug === "" ? "content/docs/meta.json" : `${dirSlug}/meta.json`} and that file has no "..." entry, so this page exists at a URL nothing in the sidebar links to.`
          )
        }
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith("."))
        visit(join(dir, entry.name))
    }
  }

  visit(DOCS_DIR)

  /* A Link entry in the root meta.json is the one allowlisted place an absolute
     /docs link may appear (addendum A11). Everything such an entry points at
     must resolve, or it sends readers to a 404 from every page on the site.

     There are none today. The root meta.json used to carry a `---Sections---`
     run of them, duplicating the pillar rail in plain text; that came out when
     the sidebar tree started opening only the path you are on, which left every
     pillar one line away in the tree itself. The check stays because the
     allowlist stays: the next Link entry anybody adds is checked from the day
     it lands, rather than after the first 404. */
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
          `a Link entry points at /${href}, which is not a page in the corpus.`
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
  const segments = parts.filter(
    (part) => !(part.startsWith("(") && part.endsWith(")"))
  )
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
    walk(
      join(APP_DIR, dir),
      (name) => name.endsWith(".ts") || name.endsWith(".tsx"),
      sourceFiles
    )
  }
  const corpus = new Map<string, string>()
  for (const file of sourceFiles) {
    const contents = readMaybe(file)
    if (contents !== undefined) corpus.set(file, contents)
  }

  const allowed = new Map(
    ROUTE_ALLOWLIST.map((entry) => [entry.route, entry.reason])
  )
  const navSet = new Set(TOP_NAV)
  const docsSlugs = new Set(pages.map((page) => page.slug))

  for (const file of pageFiles) {
    const route = routeForPageFile(file)
    if (allowed.has(route)) continue
    if (navSet.has(route)) continue

    let linkedFrom: string | undefined
    for (const [source, contents] of corpus) {
      if (source === file) continue
      if (
        contents.includes(`"${route}"`) ||
        contents.includes(`'${route}'`) ||
        contents.includes(`\`${route}\``)
      ) {
        linkedFrom = source
        break
      }
    }
    if (linkedFrom) continue

    fail(
      "IA003",
      rel(file),
      `nothing links to ${route}. Every page under app/ must be reachable from the top navigation, from a page that links to it, or from the allowlist in assert-ia.mts with a stated reason - otherwise it renders for nobody.`
    )
  }

  /* The top nav is frozen. If lib/layout.shared.tsx exists, it must agree.
     TOP_NAV is empty today, so this loop does not run. See its declaration. */
  const layout = readMaybe(join(APP_DIR, "lib", "layout.shared.tsx"))
  if (layout) {
    for (const href of TOP_NAV) {
      if (!layout.includes(href)) {
        warn(
          "IA006",
          "lib/layout.shared.tsx",
          `the frozen top navigation includes ${href}, which this file does not appear to declare. The nav is frozen by addendum A10 and this is the only file allowed to define it.`
        )
      }
    }
  }

  /* IA007. THE DOCUMENTATION OWNS THE ROOT, SO TWO THINGS CAN CLAIM ONE NAME.
     `DOCS_BASE` is empty: the corpus renders at `/`, so `content/docs/health/`
     is `/health` and `app/(chrome)/(home)/colors/` is `/colors`. Next resolves a
     static segment before a `[[...slug]]`, so if somebody adds
     `content/docs/colors/`, the tool page wins and an entire documentation
     section returns the colour browser instead. Nothing else catches it: the
     page exists, the sidebar links it, and the link 200s.

     This is the check that makes a rooted corpus safe. The repair is to rename
     one of the two, and renaming the docs folder is almost always the cheaper
     side. */
  const appTopSegments = new Map<string, string>()
  for (const file of pageFiles) {
    const segment = routeForPageFile(file).split("/")[1]
    if (!segment || segment.startsWith("[")) continue
    appTopSegments.set(segment, rel(file))
  }
  const reportedCollisions = new Set<string>()
  for (const slug of docsSlugs) {
    const segment = slug.split("/")[0]
    if (!segment || reportedCollisions.has(segment)) continue
    const owner = appTopSegments.get(segment)
    if (!owner) continue
    reportedCollisions.add(segment)
    fail(
      "IA007",
      `content/docs/${segment}`,
      `collides with ${owner}, which serves /${segment}. The docs corpus is rooted at / (DOCS_BASE is empty), and Next resolves a static route before the catch-all, so every page under this folder is unreachable. Rename one of the two.`
    )
  }
}

/* ------------------------------------------------------------------ *
 * Catalogue consistency, both directions (addendum B18)               *
 * ------------------------------------------------------------------ */

function checkCatalogue(
  pages: ParsedPage[],
  catalogue: CatalogueRow[],
  source: string,
  authored: CatalogueRow[] | null
): void {
  const ids = new Set(catalogue.map((row) => row.name))
  const bySlug = new Map(pages.map((page) => [page.slug, page]))

  /* CAT008, CAT012 and CAT013 are missing from the family below, and the gap
     is deliberate. All three went out with the `considered` machinery and all
     three are retired. Do not reuse them. The reasoning is the one written out
     beside OUT013 further up this file: a rule code turns up in a commit
     message, in a review comment and in a contributor's notes, and it has to
     keep meaning there what it meant when it was written. A new catalogue rule
     takes the next free number after the highest ever issued, which is why the
     one added below is CAT015 and not CAT008. */

  /* The catalogue against the frozen roster (contracts C1 and C2). */
  const missingFromCatalogue = KNOWN_IDS.filter((id) => !ids.has(id))
  if (missingFromCatalogue.length > 0) {
    warn(
      "CAT009",
      "registry/catalogue.ts",
      `the frozen roster of every catalogued id names ${missingFromCatalogue.length} id${
        missingFromCatalogue.length === 1 ? "" : "s"
      } the catalogue read from ${source} does not contain: ${missingFromCatalogue.join(", ")}.`
    )
  }
  const unexpected = [...ids].filter((id) => !KNOWN_IDS.includes(id))
  if (unexpected.length > 0) {
    warn(
      "CAT009",
      "registry/catalogue.ts",
      `the catalogue contains ${unexpected.length} id${
        unexpected.length === 1 ? "" : "s"
      } that the frozen roster of every catalogued id does not name: ${unexpected.join(", ")}. The roster is contracts C1 and C2; growing it is a decision, not an edit.`
    )
  }

  const componentPages = pages.filter(
    (page) => asText(page.frontmatter.kind) === "component"
  )
  const componentSlugs = new Set(componentPages.map((page) => page.slug))

  /* CAT015 - a row and its page must name the same release phase.
     CAT007 below asks only whether the page exists. Nothing asked whether the
     two agree, and the coverage that used to catch a mismatch was an accident:
     each of the six old phases named a different outline, so a page whose
     phase had drifted from its row usually tripped OUT001 or OUT002 on a
     heading. `shipped` and `deprecated` now share one outline in
     `lib/status.ts`, so that accident is gone and the invariant is unheld.

     It is an error rather than a warning because a drifted pair publishes two
     different answers about the same component and nothing reconciles them:
     the page, its `.md` twin and the `x-opsinjs-status` header read the
     frontmatter, while `/r/<id>.json`, `/r/index.json` and the status matrix
     read the row. An agent that asks the machine surface and a reader who
     opens the page are then told different things about whether the component
     is on its way out, which is the one phase distinction that changes what
     somebody should do. CLAUDE.md already states that the two move in one
     commit; this is that sentence with a build behind it. */
  const componentPageBySlug = new Map(
    componentPages.map((page) => [page.slug, page])
  )
  for (const row of catalogue) {
    const page = componentPageBySlug.get(`components/${row.name}`)
    if (!page) continue
    const rowStatus = row.status ?? "planned"
    const pageStatus = asText(page.frontmatter.status)
    if (pageStatus !== rowStatus) {
      fail(
        "CAT015",
        rel(page.file),
        `this page declares \`status: ${pageStatus ? pageStatus : "(none)"}\` and its catalogue row in registry/catalogue.ts declares \`status: "${rowStatus}"\`. The page, its .md twin and the x-opsinjs-status header follow the frontmatter; /r/${row.name}.json, /r/index.json and the status matrix follow the row. Move both in the same commit.`
      )
    }
  }

  /* Every catalogue id must have a page. */
  for (const row of catalogue) {
    if (!componentSlugs.has(`components/${row.name}`)) {
      fail(
        "CAT007",
        "registry/catalogue.ts",
        `\`${row.name}\` is in the catalogue as ${row.status ?? "planned"} but content/docs/components/${row.name}.mdx does not exist. A component only exists if it carries a specification.`
      )
    }
  }

  /* implements -> a real catalogue id, and the reverse. */
  const implementsByComponent = new Map<string, string[]>()
  for (const page of pages) {
    const implemented = asArray(page.frontmatter.implements)
    if (implemented.length === 0) {
      if (
        asText(page.frontmatter.kind) === "health" &&
        page.slug !== "health/index"
      ) {
        warn(
          "CAT010",
          rel(page.file),
          "a health rule with no `implements` names no component it governs, so nothing on a component page links back to it."
        )
      }
      continue
    }
    for (const id of implemented) {
      if (!ids.has(id)) {
        fail(
          "CAT001",
          rel(page.file),
          `\`implements: ${id}\` is not a catalogue id. Every entry must name a real component; the catalogue is the only namespace.`
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
      const candidates = [
        doctrine,
        `health/${doctrine}`,
        `foundations/${doctrine}`,
        `accessibility/${doctrine}`,
      ]
      const target = candidates.find((slug) => bySlug.has(slug))
      if (!target) {
        fail(
          "CAT002",
          rel(page.file),
          `\`governedBy: ${doctrine}\` does not resolve to a page. Name the doctrine page's slug, for example \`two-colour-axes\` for health/two-colour-axes.`
        )
        continue
      }
      const declared = asArray(bySlug.get(target)?.frontmatter.implements)
      if (!declared.includes(id)) {
        fail(
          "CAT003",
          rel(page.file),
          `this page says it is governed by ${target}, but that page's \`implements\` does not name \`${id}\`. The relationship is enforced in both directions so neither side can quietly stop being true.`
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
    const unlisted = (implementsByComponent.get(id) ?? []).filter(
      (doctrineSlug) => {
        if (doctrineSlug.endsWith("/index") || doctrineSlug === "index")
          return false
        const shortForm = doctrineSlug.split("/").pop() ?? doctrineSlug
        return (
          !governedBy.includes(shortForm) && !governedBy.includes(doctrineSlug)
        )
      }
    )
    if (unlisted.length > 0) {
      warn(
        "CAT003",
        rel(page.file),
        `${unlisted.length} doctrine page${unlisted.length === 1 ? "" : "s"} claim to govern \`${id}\` without being named in its \`governedBy\`: ${unlisted.join(", ")}. Either list them or accept that the doctrine governs more than this page advertises.`
      )
    }
  }

  /* Reverse-index ids resolve against the whole page tree, not only its top
     level. A top-level recipe, screen or pattern is named by its bare id
     (`daily-logging`); a page nested under one of those sections is named by
     its section-relative path (`forms/error-summaries`,
     `ask-users-for/symptoms`), which is the spelling the CAT014 loop below
     derives and the catalogue and the two reference pages, Callout and
     CareCard, already use. The section-relative form has always resolved,
     because `patterns/${target}` prepends the section root to the whole
     remainder. What did not resolve was a bare last segment written without its
     subdirectory (`error-summaries` for `patterns/forms/error-summaries`): the
     four candidates below could not reach it, so an id spelled that way failed
     CAT004 as a dangling reference, and the nested patterns/forms and
     patterns/ask-users-for relations were left unwritten rather than fail the
     build. A bare segment now resolves too, but only when exactly one page in
     the tree carries it, so it unambiguously denotes that page; an ambiguous
     one still resolves to nothing and is reported, because guessing which page
     it meant is worse than saying it is unclear. */
  const REVERSE_INDEX_ROOTS = ["recipes", "screens", "patterns"]
  const bareToSlugs = new Map<string, string[]>()
  for (const slug of bySlug.keys()) {
    if (!REVERSE_INDEX_ROOTS.some((root) => slug.startsWith(`${root}/`)))
      continue
    const last = slug.split("/").pop() ?? slug
    const owners = bareToSlugs.get(last) ?? []
    owners.push(slug)
    bareToSlugs.set(last, owners)
  }
  const resolveUsedIn = (target: string): string | undefined => {
    const direct = [
      target,
      `recipes/${target}`,
      `screens/${target}`,
      `patterns/${target}`,
    ].find((candidate) => bySlug.has(candidate))
    if (direct) return direct
    const owners = bareToSlugs.get(target)
    return owners && owners.length === 1 ? owners[0] : undefined
  }

  /* usedIn -> a real recipe or screen, and that page must actually mention it. */
  for (const page of componentPages) {
    const id = page.slug.replace(/^components\//, "")
    for (const target of asArray(page.frontmatter.usedIn)) {
      const slug = resolveUsedIn(target)
      if (!slug) {
        fail(
          "CAT004",
          rel(page.file),
          `\`usedIn: ${target}\` does not resolve to a recipe, screen or pattern page.`
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
          `components/${id} declares \`usedIn: ${target}\`, but this page neither lists \`${id}\` in \`implements:\` nor mentions it. The reverse index should be true in both directions.`
        )
      }
    }
  }

  /* CAT014 - the reverse of CAT004, and the hole the reverse index went stale
     through. CAT004 checks that every `usedIn` a component page declares is
     corroborated by the target screen, recipe or pattern. Nothing checked the
     other direction, so a screen could add a component to its `implements` and
     never appear in that component's `usedIn`, which is precisely how the index
     /r and llms.txt publish to agents drifted out of true. The catalogue's own
     header comment admitted the gap: "nothing in assert-ia.mts compares the two".
     Now something does.

     For every screen, recipe or pattern that names a component in
     `implements`, both halves of the reverse index must record that page: the
     catalogue row's `usedIn`, which is what /r and llms.txt serve, and the
     component page's own frontmatter `usedIn`, which is what search reads.
     Every catalogue row is in scope; there is no exempt row.

     A warning, not an error, the same split CAT006 and CAT011 use for the
     catalogue-versus-page alias disagreement: the default gate surfaces the
     drift for a human to reconcile while the nightly --strict run fails on it.
     The `usedIn` field lives only in the authored catalogue.ts, never in the
     generated JSON the rest of checkCatalogue reads, so this reads `authored`
     directly. With no authored copy there is nothing to compare against and
     the check stays silent. */
  if (authored) {
    const authoredUsedIn = new Map<string, string[]>()
    for (const row of authored) {
      authoredUsedIn.set(row.name, row.usedIn ?? [])
    }
    const pageUsedIn = new Map<string, string[]>()
    for (const page of componentPages) {
      pageUsedIn.set(
        page.slug.replace(/^components\//, ""),
        asArray(page.frontmatter.usedIn)
      )
    }
    for (const page of pages) {
      const section = page.slug.match(/^(screens|recipes|patterns)\//)
      if (!section) continue
      /* The id `usedIn` records is the slug with only the section segment
         removed, so a nested page such as patterns/forms/error-summaries is
         "forms/error-summaries", the section-relative spelling the catalogue and
         both reference pages use and the one the message below asks for. A row
         may also record the page by its bare last segment ("error-summaries")
         when that segment belongs to exactly one page in the tree, matching what
         resolveUsedIn() accepts, so the two spellings CAT004 resolves are the
         two spellings this reverse-index check honours. An ambiguous bare
         segment is not honoured, because it does not name one page. */
      const usage = page.slug.slice(section[0].length)
      if (usage === "" || usage === "index" || usage.endsWith("/index"))
        continue
      const bareUsage = usage.split("/").pop() ?? usage
      const bareUnambiguous =
        bareUsage !== usage && (bareToSlugs.get(bareUsage)?.length ?? 0) === 1
      const records = (list: string[]): boolean =>
        list.includes(usage) || (bareUnambiguous && list.includes(bareUsage))
      for (const id of asArray(page.frontmatter.implements)) {
        if (!ids.has(id)) continue /* CAT001 has already failed this id. */
        if (!records(authoredUsedIn.get(id) ?? [])) {
          warn(
            "CAT014",
            "registry/catalogue.ts",
            `${page.slug} lists \`${id}\` in \`implements\`, but the catalogue row \`${id}\` does not name "${usage}" in \`usedIn\`. The reverse index /r and llms.txt publish is then missing this composition, so an agent asking where \`${id}\` is used never learns about ${page.slug}. Add "${usage}" to that row's \`usedIn\`.`
          )
        }
        if (pageUsedIn.has(id) && !records(pageUsedIn.get(id) ?? [])) {
          warn(
            "CAT014",
            `content/docs/components/${id}.mdx`,
            `${page.slug} lists \`${id}\` in \`implements\`, but this component page's \`usedIn\` frontmatter does not name "${usage}". Search reads the page while /r reads the catalogue, so both sides have to record the composition. Add "${usage}" to \`usedIn\`.`
          )
        }
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
        `the alias "${alias}" is claimed by ${owners.length} pages: ${owners.join(", ")}. Aliases are a single global namespace declared in registry/catalogue.ts; a synonym may point at exactly one page.`
      )
    }
  }

  /* CAT007 - an alias may not be a catalogue id.
     registry/catalogue.ts's own header comment says assert-ia "fails the build
     when ... an alias collides with any catalogue id". It did not: the check
     did not exist. It was not hypothetical either. status-pill's page claimed
     `badge` as a synonym while `badge` is a real catalogue row with a real page
     of its own, so a reader searching for a badge could be sent to a component
     that is its opposite. A pill is a judgement; a badge is a label. */
  const catalogueIds = new Set(catalogue.map((row) => row.name))
  for (const [alias, owners] of aliasOwners) {
    if (!catalogueIds.has(alias)) continue
    const owner = owners[0] ?? "unknown"
    fail(
      "CAT007",
      `content/docs/${owner}.mdx`,
      `the alias "${alias}" is also a catalogue id. A synonym that is somebody else's name resolves to two things and therefore to neither: a reader searching for "${alias}" is sent to ${owner} rather than to components/${alias}. Drop it from the aliases, or rename the component.`
    )
  }
  for (const row of catalogue) {
    for (const alias of row.aliases ?? []) {
      const key = alias.trim().toLowerCase()
      if (key === "" || !catalogueIds.has(key) || key === row.name) continue
      fail(
        "CAT007",
        "registry/catalogue.ts",
        `the catalogue row "${row.name}" claims "${key}" as an alias, and "${key}" is itself a catalogue id. The alias namespace and the id namespace are one namespace.`
      )
    }
  }

  /* A component page's aliases must agree with the catalogue's, since search is
     fed from frontmatter while /r and llms.txt are fed from the catalogue. That
     is a TWO-WAY agreement and it used to be checked one way: an alias the page
     was missing was reported, an alias the page had invented was not, and a row
     with no aliases at all switched the check off. Promotion is when pages grow
     synonyms, so the undetected direction was the one that actually happened.

     `componentPages` includes components/index.mdx and the anatomy page, which
     have no catalogue row; those have nothing to disagree with, so they are the
     one case that is still skipped. */
  const catalogueAliases = new Map(
    catalogue.map((row) => [row.name, row.aliases ?? []])
  )
  for (const page of componentPages) {
    const id = page.slug.replace(/^components\//, "")
    const fromCatalogue = catalogueAliases.get(id)
    if (!fromCatalogue) continue
    const fromPage = asArray(page.frontmatter.aliases)
    const missing = fromCatalogue.filter((alias) => !fromPage.includes(alias))
    if (missing.length > 0) {
      warn(
        "CAT006",
        rel(page.file),
        `the catalogue gives \`${id}\` the synonyms ${missing.map((alias) => `"${alias}"`).join(", ")}, which this page does not carry. Search reads the page; /r and llms.txt read the catalogue - a reader and an agent should not get different answers.`
      )
    }
    const extra = fromPage.filter((alias) => !fromCatalogue.includes(alias))
    if (extra.length > 0) {
      warn(
        "CAT011",
        rel(page.file),
        `this page claims the synonyms ${extra.map((alias) => `"${alias}"`).join(", ")}, which the catalogue row \`${id}\` does not. Search would find the page by a word that /r and llms.txt have never heard of. Add them to the row in registry/catalogue.ts, or drop them here.`
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

      if (
        topic.widget &&
        new RegExp(`<${topic.widget}[\\s/>]`).test(stripCode(page.body))
      ) {
        fail(
          "DUP001",
          rel(page.file),
          `<${topic.widget}> belongs to ${topic.canonical} only - ${topic.reason}. Link to it instead.`
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
            `this page discusses ${hits.join(" and ")} without linking to ${topic.canonical}, which is canonical for it - ${topic.reason}.`
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
  const withTodo = pages.filter((page) =>
    /<Todo[\s/>]/.test(stripCode(page.body))
  )
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
    withTodo.length > 10
      ? `             ... and ${withTodo.length - 10} more`
      : "",
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
      ].join("\n")
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
      "missing, so frontmatter was checked only for `status` and `kind`. That file is the machine-readable contract this gate reads instead of restating."
    )
  }
  const outlines = loadOutlines()
  checkTemplateOutlines()
  const { known, drift } = knownMdxTags()
  for (const tag of drift) {
    warn(
      "MDX003",
      "components/mdx.tsx",
      `<${tag}> is provided to MDX but is not in the vocabulary list in assert-ia.mts. Either add it to the anatomy contract or stop exporting it - a tag that exists but is undocumented is a tag content authors will use inconsistently.`
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
  checkCatalogue(pages, rows, source, await importAuthoredCatalogue())

  /* ---------------- report ---------------- */
  const errors = findings.filter((finding) => finding.level === "error")
  const warnings = findings.filter((finding) => finding.level === "warn")

  const print = (finding: Finding) => {
    const where =
      finding.line === undefined
        ? finding.file
        : `${finding.file}:${finding.line}`
    console.log(
      `${finding.level === "error" ? "ERROR" : "warn "}  ${finding.rule}  ${where}\n        ${finding.message}`
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
      `${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`
  )

  if (errors.length > 0 || (strict && warnings.length > 0)) process.exit(1)
}

await main()
