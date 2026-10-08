/**
 * build-reference.mts - emits the generated reference pages as real, committed
 * MDX, so that fumadocs indexes them and site search covers generated content.
 *
 *   node scripts/build-reference.mts            # write
 *   node scripts/build-reference.mts --check    # write nothing; fail on drift
 *
 * WRITES
 *   content/docs/reference/generated/tokens.mdx          from lib/generated/tokens.ts
 *   content/docs/reference/generated/css-variables.mdx   from lib/generated/tokens.ts
 *   content/docs/reference/generated/contrast.mdx        from lib/generated/contrast.json
 *   content/docs/reference/generated/types.mdx           from the exports in lib/,
 *                                                        one section per type
 *   content/docs/reference/generated/data-attributes.mdx component-derived: NoDataYet
 *   content/docs/reference/generated/keyboard.mdx        component-derived: NoDataYet
 *   lib/generated/props.ts                               the component props tables
 *
 * THE TWO HALVES OF A REFERENCE PAGE. Everything between the two MDX comment
 * markers - one reading "opsinjs:generated:begin" and one reading
 * "opsinjs:generated:end", both spelled out in the BEGIN and END constants below -
 * belongs to this script and is replaced wholesale. Everything above the first
 * marker - frontmatter and a short introduction - is hand-written
 * and is preserved when it already exists. That split is deliberate: the source
 * of a table and the explanation of what its rows mean have different owners and
 * different review cadences.
 *
 * A generator with no source data writes <NoDataYet> naming the script that will
 * fill it. It never writes a plausible sample row: a fake row in a reference
 * table is indistinguishable from a real one, which is the exact failure this
 * whole pillar exists to prevent.
 *
 * DETERMINISM: no timestamps. `pnpm check:generated` regenerates and diffs.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/build-reference.mts needs Node 24 or newer.",
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

import {
  type Dirent,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const GENERATED_DIR = join(APP_DIR, "content", "docs", "reference", "generated")
const LIB_DIR = join(APP_DIR, "lib")
/**
 * The component sources, and the module the props tables are emitted to.
 *
 * These are separate from LIB_DIR on purpose. lib/ is scanned for a page per
 * exported type; registry/bases/ is scanned for one thing only - the props
 * interface of each component - and giving every internal helper type in a
 * component file its own reference page would bury the forty-three symbols
 * that earned one.
 */
const BASES_DIR = join(APP_DIR, "registry", "bases")
const PROPS_MODULE = join(APP_DIR, "lib", "generated", "props.ts")

/* The MDX comment markers. Assembled from parts so that this file can describe
   them in prose above without closing its own block comment. */
const BEGIN = `{/* opsinjs:generated:begin - everything below is replaced by scripts/build-reference.mts */}`
const END = `{/* opsinjs:generated:end */}`

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

function readJsonMaybe(file: string): unknown {
  const raw = readMaybe(file)
  if (raw === undefined) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function writeIfChanged(file: string, contents: string): boolean {
  mkdirSync(dirname(file), { recursive: true })
  if (readMaybe(file) === contents) return false
  writeFileSync(file, contents, "utf8")
  return true
}

/**
 * Markdown table cell: escape pipes, collapse newlines, never leave it empty.
 *
 * `<` and `{` are also escaped. Source data is authored prose (glossary
 * definitions say things like "the test did not find <what it looked for>"),
 * and in MDX an unescaped `<` opens a JSX tag and an unescaped `{` opens an
 * expression. Either one fails the build from inside a generated file, which
 * is the worst place to debug it. A backslash escape renders the literal
 * character. Cells rendered through code() are inside a code span and are
 * therefore never parsed as MDX.
 */
function cell(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-"
  return String(value)
    .replace(/\|/g, "\\|")
    .replace(/([<{}>])/g, "\\$1")
    .replace(/\s*\n\s*/g, " ")
    .trim()
}

/** Markdown table cell rendered as inline code. */
function code(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-"
  return `\`${String(value).replace(/`/g, "'").replace(/\|/g, "\\|")}\``
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return ""
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n")
}

function yamlString(value: string): string {
  return JSON.stringify(value)
}

/* ------------------------------------------------------------------ *
 * Page assembly                                                       *
 * ------------------------------------------------------------------ */

interface PageSpec {
  /** File stem under content/docs/reference/generated/. */
  slug: string
  title: string
  description: string
  /** The prose that explains what the rows mean. Used only when the file is new. */
  howItIsGenerated: string
  /** The generated region. */
  body: string
}

/**
 * The FIRST-CREATION page, not the shipped one. assemble() calls this only when
 * the target file is absent, so for all eight reference pages - every one of
 * which exists - the `howItIsGenerated` prose in this file is unread, and what
 * a reader sees above the `opsinjs:generated:begin` marker is the hand-written
 * half of the .mdx, frontmatter included. Editing a `howItIsGenerated` block
 * changes no shipped byte; it changes what would be written if that page were
 * ever deleted and regenerated, which is the documented recovery route, so the
 * blocks still have to be true.
 *
 * Note what a from-scratch header loses: the shipped pages carry `reviewed`,
 * `reviewer`, `reviewEvery` and `aliases` in their frontmatter and this header
 * writes none of them, so a regenerated page needs those restored by hand
 * before check-freshness can see it again. It deliberately does not
 * write `status:`, because a reference page is not a component and is not
 * allowed one.
 */
function defaultHeader(spec: PageSpec): string {
  return [
    "---",
    `title: ${yamlString(spec.title)}`,
    `description: ${yamlString(spec.description)}`,
    /* No `status:` line, and that is the contract rather than an omission. A
       release phase now belongs to a `kind: component` page and to nothing
       else, and FM014 in scripts/assert-ia.mts fails the build on a
       documentation page that declares one. This header used to write
       `status: stable`, which was a claim that the prose was finished wearing
       the word that answers whether code exists. */
    "kind: reference",
    "full: true",
    "---",
    "",
    "{/* This page has two halves. Everything above the generated marker is",
    "    hand-written and is preserved by scripts/build-reference.mts; everything",
    "    below it is replaced wholesale on every `pnpm run generate`. */}",
    "",
    spec.howItIsGenerated,
    "",
  ].join("\n")
}

/**
 * Splices the generated region into an existing page, preserving its
 * hand-written header, or writes a whole new page when none exists.
 */
function assemble(spec: PageSpec, file: string): string {
  const current = readMaybe(file)

  const beginAt = current === undefined ? -1 : current.indexOf("{/* opsinjs:generated:begin")
  const endAt = current === undefined ? -1 : current.indexOf("{/* opsinjs:generated:end")

  const region = [BEGIN, "", spec.body.trim(), "", END, ""].join("\n")

  if (current === undefined) return `${defaultHeader(spec)}\n${region}`

  if (beginAt === -1 || endAt === -1 || endAt < beginAt) {
    /* The page exists but carries no markers - it is a placeholder written
       before this script first ran. Keep its frontmatter and its prose if we can
       find the heading, and append the region; otherwise replace it. */
    const headingAt = current.indexOf("## How this is generated")
    if (headingAt === -1) return `${defaultHeader(spec)}\n${region}`
    const preserved = current.slice(0, headingAt)
    const afterHeading = current.slice(headingAt)
    const prose = afterHeading.split(/\n(?=\{\/\*|## |<NoDataYet)/)[0] ?? afterHeading
    return `${preserved}${prose.trimEnd()}\n\n${region}`
  }

  const endMarkerEnd = current.indexOf("}", endAt) + 1
  const head = current.slice(0, beginAt).trimEnd()
  const tail = current.slice(endMarkerEnd).trimStart()
  return `${head}\n\n${region}${tail.length > 0 ? `\n${tail}` : ""}`
}

/* ------------------------------------------------------------------ *
 * Sources                                                             *
 * ------------------------------------------------------------------ */

/** Mirrors the exported shape of lib/generated/tokens.ts. */
interface GeneratedToken {
  name: string
  cssVar: string
  /** The source file: color | material | motion | type | space | shape. */
  namespace: string
  tier: string
  /** The family within it: status, category, ladder, scale. */
  group: string
  value: string
  darkValue?: string
  p3Value?: string
  p3DarkValue?: string
  description: string
  usedBy: string[]
}

async function loadTokens(): Promise<GeneratedToken[]> {
  const file = join(LIB_DIR, "generated", "tokens.ts")
  if (!exists(file)) return []
  try {
    const mod = (await import(pathToFileURL(file).href)) as { TOKENS?: unknown }
    return Array.isArray(mod.TOKENS) ? (mod.TOKENS as GeneratedToken[]) : []
  } catch (error) {
    console.warn(
      `build-reference: lib/generated/tokens.ts could not be imported (${(error as Error).message}).`,
    )
    return []
  }
}

/* ------------------------------------------------------------------ *
 * Page builders                                                       *
 * ------------------------------------------------------------------ */

function noData(script: string, what: string): string {
  return [
    `<NoDataYet script="${script}" />`,
    "",
    what,
  ].join("\n")
}

function tokensPage(tokens: GeneratedToken[]): PageSpec {
  const namespaces = [...new Set(tokens.map((token) => token.namespace))]
  const sections = namespaces
    .map((namespace) => {
      const scoped = tokens.filter((token) => token.namespace === namespace)
      const groups = [...new Set(scoped.map((token) => token.group))]
      const blocks = groups
        .map((group) => {
          const rows = scoped
            .filter((token) => token.group === group)
            .map((token) => [
              code(token.cssVar),
              cell(token.tier),
              cell(token.description),
              code(token.value),
              token.darkValue ? code(token.darkValue) : "same",
              token.usedBy.length > 0 ? cell(token.usedBy.join(", ")) : "no component",
            ])
          return [
            `#### ${group}`,
            "",
            table(
              ["Token", "Tier", "What it controls", "Light", "Dark", "Used by"],
              rows,
            ),
          ].join("\n")
        })
        .join("\n\n")
      return [`### ${namespace}`, "", blocks].join("\n")
    })
    .join("\n\n")

  return {
    slug: "tokens",
    title: "Tokens",
    description:
      "Every opsinjs design token with its light and dark value, what it controls, and the components documented as consuming it.",
    howItIsGenerated: [
      "Source: `tokens/*.json`. Script: `scripts/build-tokens.mts`, then",
      "`scripts/build-reference.mts`. Command: `pnpm run generate`.",
      "",
      "A row exists for every token that reaches CSS. **What it controls** is the",
      "`description` field in the token source, and it is the column that turns a list",
      "into a decision aid - a token with no description is a token nobody can choose",
      "correctly. **Used by** is derived by `scripts/build-tokens.mts` from the",
      "component sources under `registry/bases`, counting both a literal",
      "`var(--opsin-...)` and any Tailwind utility that `app/product.css` bridges back",
      "to the token. It reads \"no component\" where nothing in the base layer reads the",
      "token directly, which is the ordinary state of a primitive: components consume",
      "roles, and roles reference primitives.",
      "",
      "To change a value, change the JSON and regenerate. Editing this page does",
      "nothing except fail `pnpm check:generated`.",
    ].join("\n"),
    body:
      tokens.length === 0
        ? noData(
            "scripts/build-tokens.mts",
            "No token sources have been authored yet. `tokens/*.json` is the source; running `pnpm run generate` fills this table.",
          )
        : `## Tokens\n\n${sections}`,
  }
}

function cssVariablesPage(tokens: GeneratedToken[]): PageSpec {
  const bySelector: Array<{ selector: string; rows: string[][] }> = [
    {
      selector: ":root, .opsin-product",
      rows: tokens.map((token) => [code(token.cssVar), code(token.value), cell(token.description)]),
    },
    {
      selector: ".dark, .opsin-product.dark",
      rows: tokens
        .filter((token) => token.darkValue !== undefined)
        .map((token) => [code(token.cssVar), code(token.darkValue), cell(token.description)]),
    },
    {
      selector: "@supports (color-gamut: p3)",
      rows: tokens
        .filter((token) => token.p3Value !== undefined || token.p3DarkValue !== undefined)
        .map((token) => [
          code(token.cssVar),
          code(token.p3Value ?? token.p3DarkValue),
          "Chroma escalation only: same hue, same lightness, so measured contrast is unchanged.",
        ]),
    },
  ]

  const sections = bySelector
    .filter((group) => group.rows.length > 0)
    .map((group) =>
      [`### \`${group.selector}\``, "", table(["Variable", "Value", "Controls"], group.rows)].join(
        "\n",
      ),
    )
    .join("\n\n")

  return {
    slug: "css-variables",
    title: "CSS variables",
    description:
      "Every --opsin-* custom property, grouped by the selector that declares it, with its value and what it controls.",
    howItIsGenerated: [
      "Source: `tokens/*.json` by way of `app/tokens.generated.css`. Script:",
      "`scripts/build-reference.mts`. Command: `pnpm run generate`.",
      "",
      "Grouped by **selector**, never as one global dump, because overriding a single",
      "part should not require reading the whole system. If a variable appears under",
      "more than one selector it is because the value genuinely differs there: the dark",
      "theme redeclares only what changes, and the Display-P3 block redeclares only the",
      "chroma escalations.",
      "",
      "This page lists the variables the system declares. It is not a list of variables",
      "you may set: consuming products override tokens at the theme layer, which is",
      "documented under Theming.",
    ].join("\n"),
    body:
      tokens.length === 0
        ? noData(
            "scripts/build-tokens.mts",
            "No custom properties have been generated yet. Authoring `tokens/*.json` and running `pnpm run generate` fills this page.",
          )
        : `## CSS variables\n\n${sections}`,
  }
}

function contrastPage(): PageSpec {
  const data = readJsonMaybe(join(LIB_DIR, "generated", "contrast.json")) as
    | {
        generatedAt?: string
        floor?: Record<string, { apcaLc?: number; wcag?: number }>
        pairs?: Array<Record<string, unknown>>
        cvd?: { collapseThresholdLc?: number; collisions?: Array<Record<string, unknown>> }
        summary?: Record<string, number>
      }
    | undefined
  const pairs = Array.isArray(data?.pairs) ? data.pairs : []
  const collisions = Array.isArray(data?.cvd?.collisions) ? data.cvd.collisions : []
  const advisoryBelowFloor = pairs.filter(
    (pair) => pair.advisory === true && pair.passes !== true,
  ).length

  const scopes = [...new Set(pairs.map((pair) => String(pair.scope ?? "other")))]
  const sections = scopes
    .map((scope) => {
      const blocks = (["light", "dark"] as const)
        .map((theme) => {
          const rows = pairs
            .filter((pair) => pair.scope === scope && pair.theme === theme)
            .map((pair) => [
              cell(pair.pair),
              cell(pair.use),
              cell(typeof pair.apcaLc === "number" ? pair.apcaLc.toFixed(1) : pair.apcaLc),
              cell(typeof pair.wcag === "number" ? `${pair.wcag.toFixed(2)}:1` : pair.wcag),
              /* THREE VERDICTS, NOT TWO. Testing `advisory` first is right - an
                 advisory pair is not gated, so it cannot be a FAIL - but a plain
                 "advisory" then says the same word about a pair that clears the
                 floor and a pair that does not, and eleven of the forty-six do
                 not. The reader of this table is deciding whether to bound an
                 accent with `line` or label it in `ink`; "advisory" alone tells
                 them the pair is exempt, which is the opposite of the answer.
                 No floor moves here and no pair is reclassified: the same rows
                 stay ungated, and the column stops rounding two states into one. */
              pair.advisory === true
                ? pair.passes === true
                  ? "advisory"
                  : "advisory - below floor"
                : pair.passes === true
                  ? "pass"
                  : "FAIL",
            ])
          if (rows.length === 0) return ""
          return [
            `#### ${theme === "light" ? "Light theme" : "Dark theme"}`,
            "",
            table(["Pair", "Role", "APCA Lc", "WCAG 2.2", "Verdict"], rows),
          ].join("\n")
        })
        .filter((block) => block !== "")
        .join("\n\n")
      return [`### ${scope}`, "", blocks].join("\n")
    })
    .join("\n\n")

  const cvdTable = table(
    ["Axis", "Simulation", "Pair", "Lc"],
    collisions.map((entry) => [
      cell(entry.axis),
      cell(entry.type),
      cell(`${String(entry.a)} and ${String(entry.b)}`),
      cell(typeof entry.lc === "number" ? entry.lc.toFixed(1) : entry.lc),
    ]),
  )

  return {
    slug: "contrast",
    title: "Contrast",
    description:
      "Measured APCA Lc and WCAG 2.2 contrast for every opsinjs token pair, in both themes, against the published floor.",
    howItIsGenerated: [
      "Source: `lib/generated/tokens.ts`, measured by the hand-written colour maths in",
      "`lib/color/apca.ts`, `lib/color/wcag.ts` and `lib/color/cvd.ts`. Script:",
      "`scripts/check-contrast.mts`. Command: `pnpm run contrast`.",
      "",
      "Both numbers are reported because they disagree, and the disagreement is",
      "informative. WCAG 2.2's ratio is the number a procurement questionnaire and a",
      "conformance report ask for. APCA's Lc models perceived lightness contrast far",
      "better for the ink-on-tinted-surface pairs a health interface is made of.",
      "opsinjs holds itself to both.",
      "",
      "**Advisory rows are measured but not gated.** The `accent` role is the identity",
      "fill - a bar fill, a dial track, a legend dot - and the token source says",
      "outright that it is chosen for recognition rather than for contrast, and that it",
      "must be bounded by `line` or labelled in `ink`. Publishing its number and saying",
      "what carries the meaning instead is more honest than either hiding it or forcing",
      "a choice between an identity colour and a green build.",
      "",
      "The Verdict column therefore has three words rather than two. `advisory` is a",
      "pair that is not gated and clears its floor anyway; `advisory - below floor` is",
      "a pair that is not gated and does not. Neither fails the build, and the",
      "difference is the whole of what the column is for: the second is where the",
      "bounding line or the ink label stops being good practice and starts being the",
      "only thing carrying the meaning.",
      "",
      "**The colour-vision audit is the last table.** Two accents that collapse under a",
      "simulation are not a palette defect a different hue would fix: four ordered",
      "levels cannot be made mutually distinguishable by hue alone for every form of",
      "colour vision. It is the measurement behind the rule that colour is never the",
      "sole carrier of status.",
      "",
      "Every figure here is measured in CI from the token values in this tree, and a",
      "regression fails the build. The numbers describe the shipped presets only - a",
      "theme derived from your own brand colour has its own, and must be measured with",
      "your own values.",
    ].join("\n"),
    body:
      pairs.length === 0
        ? noData(
            "scripts/check-contrast.mts",
            "No pairs have been measured yet. `pnpm run contrast` measures every token pair and writes `lib/generated/contrast.json`.",
          )
        : [
            "## Measured contrast",
            "",
            [
              data?.generatedAt ? `Measured on ${data.generatedAt}.` : "",
              /* Counted from `pairs` rather than read from `summary`, on
                 purpose. `pnpm run contrast` is not part of `pnpm run generate`,
                 so this page can be rebuilt against a contrast.json written
                 before `summary.advisoryFailing` existed - and a headline that
                 silently said "undefined" or dropped the clause would be the
                 same omission this sentence was added to fix. The rows are
                 always there; the derived count is always true of them. */
              data?.summary
                ? `${data.summary.total} pairs: ${data.summary.passing} pass, ${data.summary.failing} fail, ${data.summary.advisory} advisory` +
                  (advisoryBelowFloor > 0
                    ? `, and ${advisoryBelowFloor} of the advisory pairs measure below the floor for their role. Advisory pairs are not gated, so none of those is a build failure; each is an accent that has to be bounded by \`line\` or labelled in \`ink\` rather than read as text.`
                    : ".")
                : "",
            ]
              .filter((line) => line !== "")
              .join(" "),
            "",
            sections,
            "",
            "## Colour-vision audit",
            "",
            collisions.length === 0
              ? "No accent pair collapses below the threshold under any simulation."
              : [
                  `Pairs that fall below Lc ${data?.cvd?.collapseThresholdLc ?? 15} as flat fills - that is, pairs a reader with this form of colour vision cannot tell apart by colour alone.`,
                  "",
                  cvdTable,
                ].join("\n"),
          ]
            .filter((part) => part !== "")
            .join("\n"),
  }
}

function dataAttributesPage(): PageSpec {
  return {
    slug: "data-attributes",
    title: "Data attributes",
    description:
      "Every data-* attribute opsinjs components emit, the condition that sets it and the values it can take.",
    howItIsGenerated: [
      "Source: the component implementations under `registry/bases/<base>/`. Script:",
      "`scripts/build-reference.mts`. Command: `pnpm run generate`.",
      "",
      "Data attributes are the styling contract. They are how a consuming product",
      "restyles a state without forking the component, and they are versioned: a",
      "`data-*` attribute is part of the public API and is covered by the same semver",
      "promise as the JavaScript surface.",
      "",
      "No row here is ever typed by hand. The table is empty for a reason this page",
      "states rather than hides: the components emit data attributes, and this script",
      "does not extract them yet.",
    ].join("\n"),
    /* This is a generator gap, not an empty system, and the difference decides
       whether anyone fixes it. The base layer does emit data attributes; what is
       missing is the extraction. Two of the four columns are the reason it has
       not been written yet: `data-slot` values are literals a scan can read, but
       the condition that sets `data-status` and the closed set it can take are
       not recoverable from the source text, and a table that guessed them would
       be inventing a styling contract that consumers then select on. */
    body: noData(
      "scripts/build-reference.mts",
      "This script does not read the component sources for `data-*` attributes yet, so there is no table, which is not the same as no attribute being emitted. Every part carries `data-slot`, and `data-status`, `data-category` and `data-opsinjs-value` appear where they apply, with Base UI's `data-open`, `data-starting-style` and `data-ending-style` inherited. That is the whole component contract, closed at those four, as Styling describes. The squircle is not among them: Card, Callout and Dialog set an inline `corner-shape` property instead. `data-opsinjs-not-implemented` is a documentation-site marker, not a component attribute. Each component page lists its own attributes under Props interface.",
    ),
  }
}

function keyboardPage(): PageSpec {
  return {
    slug: "keyboard",
    title: "Keyboard",
    description:
      "Every keyboard interaction in opsinjs, aggregated from the keyboard table on each component page.",
    howItIsGenerated: [
      "Source: the `<KeyboardTable>` on each component page, which is itself derived",
      "from the component implementation. Script: `scripts/build-reference.mts`.",
      "Command: `pnpm run generate`.",
      "",
      "One aggregated table exists because keyboard behaviour has to be consistent",
      "across a system to be learnable, and inconsistency is invisible while every",
      "component is documented only on its own page.",
      "",
      "Until this script parses those blocks, the keyboard contract is readable only on",
      "each component's own page. Accessibility is mandatory at every release phase,",
      "including `planned`; what changes with status is whether the row is a promise or",
      "a measurement, and an aggregate that lost that distinction would be worse than",
      "no aggregate.",
    ].join("\n"),
    /* The blocks exist; the parser does not. Aggregating them also has to carry
       each row's status with it - a `<KeyboardTable>` on a `planned` page states
       a requirement, not a measured behaviour - and a flat table that dropped
       that would read as evidence for keys nobody has pressed. */
    body: noData(
      "scripts/build-reference.mts",
      "This script does not parse the `<KeyboardTable>` blocks yet, so nothing is aggregated here - not because no component documents its keys. Every component page carries its own table, and that is where the contract is readable today. The global contract every component must meet is in Accessibility under Keyboard and focus.",
    ),
  }
}

/* ------------------------------------------------------------------ *
 * Exported symbols: the Types page and the per-symbol API pages.       *
 *                                                                      *
 * Addendum B11 - <ApiLink> resolves a type name to a page, not to an    *
 * anchor on one enormous page, so every exported symbol needs an        *
 * address. The extraction is textual on purpose: it must work before    *
 * anything compiles, it must not import application code into a build   *
 * script, and it must be identical on every machine.                    *
 * ------------------------------------------------------------------ */

interface ExportedSymbol {
  name: string
  /** const | function | type | interface | class */
  kindWord: string
  /** Path relative to apps/www. */
  file: string
  /**
   * First sentence of the JSDoc above it, when there is one. This is the
   * frontmatter description, so it has to stand alone and stay under the
   * 160-character ceiling SEO002 enforces.
   */
  summary?: string
  /**
   * The whole JSDoc, which is what the page body carries.
   *
   * The body used to carry `summary` too, so a symbol whose doc comment ran to
   * a paragraph published its opening line and discarded the rest. The
   * paragraph is the part worth reading, and on a reference page it is the only
   * prose there is.
   */
  detail?: string
  /**
   * The whole declaration, not just its opening line.
   *
   * It used to be the opening line alone, and for a type alias that was the
   * declaration. For an interface it was the word `export`, the word
   * `interface` and the name, which is the one part of an interface a reader
   * already knows from the page title. Twenty-four pages said nothing their own
   * heading had not already said.
   */
  signature: string
}

function walkFiles(dir: string, out: string[]): void {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "generated" || entry.name.startsWith(".")) continue
      walkFiles(full, out)
      continue
    }
    if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) out.push(full)
  }
}

/**
 * The whole declaration, from its opening line to wherever it ends.
 *
 * THREE SHAPES, because TypeScript declarations end three ways and guessing
 * wrong truncates the only unique content on the page.
 *
 *   1. A braced body (`interface X {`, `class X {`, `type X = {`). Ends at the
 *      matching close brace, found by counting rather than by looking for a `}`
 *      in the first column, because a nested object type would end it early.
 *   2. A union or intersection carried over several lines. Ends at the last
 *      line that still begins with `|` or `&`.
 *   3. Everything else, which is one line.
 *
 * INNER COMMENTS ARE STRIPPED. A field's doc comment is prose, some of it many
 * lines of it, and this is a code block. Keeping them would put a paragraph
 * inside a signature and make the shape of the type harder to see, which is the
 * one thing the block is for. The prose is not lost: it is in the source, at
 * the path the table above names.
 */
function captureDeclaration(lines: string[], start: number): string {
  const first = lines[start] ?? ""
  const collected: string[] = [first]

  if (first.trimEnd().endsWith("{")) {
    let depth = 0
    for (let i = start; i < lines.length; i += 1) {
      const line = lines[i] ?? ""
      depth += (line.match(/\{/g) ?? []).length
      depth -= (line.match(/\}/g) ?? []).length
      if (i > start) collected.push(line)
      if (depth <= 0 && i > start) break
    }
  } else {
    for (let i = start + 1; i < lines.length; i += 1) {
      const text = (lines[i] ?? "").trim()
      if (!text.startsWith("|") && !text.startsWith("&")) break
      collected.push(lines[i] ?? "")
    }
  }

  const body = collected.filter((line) => {
    const text = line.trim()
    if (text.startsWith("/**") || text.startsWith("/*")) return false
    if (text.startsWith("*")) return false
    if (text.startsWith("//")) return false
    return true
  })

  /* A stripped comment leaves a blank line where a paragraph was. Collapse any
     run of them so the block does not open with the hole a doc comment left. */
  const tidied: string[] = []
  for (const line of body) {
    if (line.trim() === "" && (tidied.at(-1) ?? "").trim() === "") continue
    tidied.push(line)
  }
  while (tidied.length > 0 && (tidied.at(-1) ?? "").trim() === "") tidied.pop()

  return tidied.join("\n").replace(/\n\s*\n/g, "\n").trimEnd()
}

function extractSymbols(): ExportedSymbol[] {
  const files: string[] = []
  walkFiles(LIB_DIR, files)

  const symbols: ExportedSymbol[] = []
  const declaration =
    /^export\s+(?:declare\s+)?(?:async\s+)?(const|let|function|type|interface|class)\s+([A-Za-z_$][\w$]*)/

  for (const file of files) {
    const contents = readMaybe(file)
    if (contents === undefined) continue
    const lines = contents.split("\n")
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? ""
      const match = declaration.exec(line)
      if (!match) continue
      const [, kindWord, name] = match
      if (!name || name.startsWith("_")) continue

      /* Walk back over a JSDoc block for the first sentence. Both the one-line
         form and the multi-line form are common in this codebase. */
      let detail: string | undefined
      const previous = (lines[index - 1] ?? "").trim()
      const oneLine = /^\/\*\*(.*)\*\/$/.exec(previous)
      if (oneLine) {
        const text = (oneLine[1] ?? "").trim()
        if (text.length > 0) detail = text
      } else if (previous === "*/") {
        const collected: string[] = []
        for (let back = index - 2; back >= 0; back -= 1) {
          const text = (lines[back] ?? "").trim()
          if (text.startsWith("/**")) break
          if (text.startsWith("@")) continue
          collected.unshift(text.replace(/^\*\s?/, ""))
        }
        /* PARAGRAPHS SURVIVE, AND SO DOES A LIST.
           Joining every line with a space turned a comment written as three
           paragraphs into one block of four hundred words, on the page where
           that block is the only prose. So a blank line in a doc comment is a
           paragraph break and is reproduced as one, and the lines within a
           paragraph are rewrapped, because a comment is wrapped to the source
           file's column width and a page is not.

           An INDENTED run is the other thing a comment uses its line breaks
           for. `OpsinErrorSeverity` lists its three severities one per line, and
           rewrapping them produced a sentence that ran the three definitions
           together with no boundary between them. A run of indented lines is
           therefore emitted as a markdown list, which is what it already was
           in everything but syntax. Indentation is what marks it, because the
           lines have been through `.trim()` and then had their leading `* `
           removed, so anything left in front is the author's own. */
        const blocks: string[] = []
        let paragraph: string[] = []
        let list: string[] = []

        const flush = (): void => {
          if (paragraph.length > 0) {
            blocks.push(paragraph.join(" ").replace(/\s+/g, " ").trim())
            paragraph = []
          }
          if (list.length > 0) {
            blocks.push(
              list.map((item) => `- ${item.replace(/\s+/g, " ").trim()}`).join("\n")
            )
            list = []
          }
        }

        for (const text of collected) {
          if (text.trim() === "") {
            flush()
            continue
          }
          if (/^\s/.test(text)) {
            if (paragraph.length > 0) flush()
            list.push(text)
            continue
          }
          if (list.length > 0) flush()
          paragraph.push(text)
        }
        flush()

        const joined = blocks.filter((block) => block.length > 0).join("\n\n")
        if (joined.length > 0) detail = joined
      }

      /* The description is the first sentence; the body is all of it. Splitting
         on ". " rather than "." keeps a decimal, an ellipsis and an abbreviation
         from ending the sentence early. */
      let summary: string | undefined
      if (detail !== undefined) {
        const opening = detail.split("\n\n")[0] ?? detail
        const stop = opening.indexOf(". ")
        summary = stop === -1 ? opening : opening.slice(0, stop + 1)
      }

      symbols.push({
        name,
        kindWord: kindWord ?? "const",
        file: relative(APP_DIR, file),
        summary,
        detail,
        signature: captureDeclaration(lines, index),
      })
    }
  }

  symbols.sort((a, b) => a.name.localeCompare(b.name))
  return symbols
}

/**
 * Which symbols get a page of their own.
 *
 * Types and interfaces only, because that is what <ApiLink> exists to resolve: a
 * type name appearing in prose should be a link rather than a dead end. Every
 * exported function and constant is listed in the table below with the file it
 * lives in, which is what a reader actually needs for those - a page per
 * `STATUS_META` would be forty pages of nothing, and decision 7's whole point is
 * that a page exists only when it has something to say.
 */
function hasOwnPage(symbol: ExportedSymbol): boolean {
  return symbol.kindWord === "type" || symbol.kindWord === "interface"
}

function typesPage(
  symbols: ExportedSymbol[],
  usedBy: Map<string, string[]>,
  byName: Map<string, ExportedSymbol>
): PageSpec {
  const rows = symbols.map((symbol) => [
    hasOwnPage(symbol) ? `[\`${symbol.name}\`](#${symbol.name.toLowerCase()})` : code(symbol.name),
    cell(symbol.kindWord),
    code(symbol.file),
    /* The first paragraph of the doc comment: a table row is for the opening
       paragraph, and the whole comment is in the symbol's own section below. */
    cell(symbol.detail?.split("\n\n")[0]?.replace(/\s+/g, " ")),
  ])

  /* One section per type and interface, in source order: the doc comment, the
     declaration, its members and the symbols that use it. */
  const sections = symbols.filter(hasOwnPage).map((symbol) =>
    [
      `### ${symbol.name}`,
      symbol.detail === undefined
        ? "This symbol has no doc comment yet."
        : escapeForMdx(symbol.detail),
      `A ${symbol.kindWord} in ${code(symbol.file)}.`,
      ["```ts", symbol.signature.trim(), "```"].join("\n"),
      memberTable(symbol),
      usedByLine(usedBy.get(symbol.name) ?? [], byName),
    ]
      .filter((block) => block.trim() !== "")
      .join("\n\n")
  )

  return {
    slug: "types",
    title: "Types",
    description:
      "Every symbol opsinjs exports, what kind of declaration it is, where it lives and what it is for.",
    howItIsGenerated: [
      "Generated from the `export` declarations under `lib/` by",
      "`scripts/build-reference.mts`. Each type and interface has a section below with its",
      "declaration, its members and the symbols that use it. Component props are on each",
      "component page instead.",
    ].join("\n"),
    body:
      symbols.length === 0
        ? noData(
            "scripts/build-reference.mts",
            "`lib/` exports nothing yet. This table lists every exported symbol as soon as one exists.",
          )
        : [
            `## Exported symbols\n\n${table(["Symbol", "Kind", "Declared in", "Summary"], rows)}`,
            ...(sections.length > 0 ? ["## Declarations", ...sections] : []),
          ].join("\n\n"),
  }
}

/**
 * A doc comment on its way into MDX.
 *
 * Every comment in `lib/` is plain prose with backticked code spans today, and
 * this function is here for the one that is not. MDX reads a bare `<` as the
 * start of a JSX tag and a bare `{` as the start of an expression, so a comment
 * that mentions `Array<string>` without backticks would either fail the build or,
 * worse, fail MDX001 as an undeclared tag in the closed vocabulary. Escaping is
 * cheaper than discovering that from a red build months from now.
 *
 * Code spans are left exactly as they are, because inside a span MDX is not
 * looking for either character.
 */
function escapeForMdx(text: string): string {
  return text
    .split(/(`[^`]*`)/)
    .map((part) =>
      part.startsWith("`") ? part : part.replace(/([<{}])/g, "\\$1")
    )
    .join("")
}

/**
 * WHO ELSE MENTIONS THIS SYMBOL, name to the names of the symbols that do.
 *
 * WHY A REVERSE INDEX IS WORTH BUILDING. A per-symbol page had four things on
 * it: a heading, a doc comment, a two-cell table and a declaration. Fifty-six
 * of them averaged six hundred characters, which is shorter than the sidebar
 * that ships above them, and the only way off one was the previous and next
 * arrows, which land on whatever sorts alphabetically beside it. `Oklab` and
 * `Oklch` are the same subject and were adjacent by luck; `Ramp` and
 * `RolePair` are not the same subject and were adjacent for the same reason.
 *
 * A reference page is read by somebody who arrived at one type and needs the
 * two it is made of. That relationship is already written down, in the
 * declarations, and nothing was reading it. So it is read here: every symbol
 * whose declaration names this one becomes a row on this one's page, with its
 * own summary beside it, linked to its page.
 *
 * `\b` on both sides is what keeps `StatusMeta` out of `Status`'s list. The
 * match is textual, like the extraction it reads from, and for the same
 * reasons given above `walkFiles`.
 */
function referenceIndex(symbols: ExportedSymbol[]): Map<string, string[]> {
  const index = new Map<string, string[]>()
  for (const subject of symbols) {
    const pattern = new RegExp(`\\b${subject.name}\\b`)
    const users = symbols
      .filter(
        (other) => other.name !== subject.name && pattern.test(other.signature)
      )
      .map((other) => other.name)
      .sort((a, b) => a.localeCompare(b))
    index.set(subject.name, users)
  }
  return index
}

/**
 * The body of an interface declaration, or undefined for anything else.
 *
 * The outer braces are dropped so that `readMembers` sees the members at depth
 * zero, which is the depth it counts from.
 */
function interfaceBody(signature: string): string | undefined {
  const open = signature.indexOf("{")
  const close = signature.lastIndexOf("}")
  if (open === -1 || close <= open) return undefined
  return signature.slice(open + 1, close)
}

/**
 * The members of an interface, as a table.
 *
 * It reuses `readMembers`, which is the chunker the component props tables are
 * built with, so a member is parsed here exactly as it is parsed there rather
 * than by a second reader that fails differently. Returns an empty string when
 * the symbol is not an interface, or when the interface has no member the
 * chunker recognises: an empty table under a heading is worse than no heading,
 * because it reads as a claim that there is nothing to list.
 *
 * The declaration is still printed above this in full. The table is not a
 * substitute for it, it is the part of it a reader can scan, and it is the only
 * place a member's own doc comment appears at all. That comment was being
 * discarded: the code block prints the member and drops the sentence explaining
 * it, so the most useful writing in `lib/` was invisible on the page built to
 * publish it.
 */
function memberTable(symbol: ExportedSymbol): string {
  if (symbol.kindWord !== "interface") return ""
  const body = interfaceBody(symbol.signature)
  if (body === undefined) return ""
  const rows = readMembers(body)
  if (rows.length === 0) return ""

  return [
    "**Members**",
    "",
    table(
      ["Member", "Type", "Required", "What it is"],
      rows.map((row) => [
        code(row.name),
        code(row.type),
        row.required ? "Yes" : "No",
        cell(row.description ? escapeForMdx(row.description) : undefined),
      ])
    ),
  ].join("\n")
}

/**
 * The symbols that name this one in their own declaration, as one line of
 * links to their sections on the same page. A const or a function has no
 * section of its own and is printed as code.
 */
function usedByLine(users: string[], byName: Map<string, ExportedSymbol>): string {
  if (users.length === 0) return ""
  const names = users.map((name) => {
    const other = byName.get(name)
    return other && hasOwnPage(other) ? `[\`${name}\`](#${name.toLowerCase()})` : code(name)
  })
  return `**Used by** ${names.join(", ")}.`
}

/* ------------------------------------------------------------------ *
 * Component prop interfaces: the source <PropsTable> reads.            *
 *                                                                      *
 * <PropsTable name="StatusPillProps" /> had no producer at all: the    *
 * component took a `type` prop in fumadocs' TypeTable shape and         *
 * nothing in the repository built one, so every API table on the site   *
 * rendered <NoDataYet> whatever was built. This is the producer.        *
 *                                                                      *
 * WHY NOT fumadocs-typescript. `<auto-type-table>` is wired through     *
 * source.config.ts and would work, but it THROWS when the interface it  *
 * names is absent, which fails the whole build from inside a page. The  *
 * honest failure for a table with no data is <NoDataYet>, and a         *
 * generated map degrades to exactly that. It also renders fumadocs'     *
 * bare TypeTable rather than the opsinjs one, which is why              *
 * components/mdx.tsx registers TypeTable but tells pages to use         *
 * <PropsTable>.                                                         *
 *                                                                      *
 * The extraction is textual, like the symbol walk above, and for the    *
 * same reasons: it runs before anything compiles, it imports no         *
 * application code into a build step, and it is identical on every      *
 * machine.                                                              *
 * ------------------------------------------------------------------ */

/** One row of a generated props table, in fumadocs' TypeNode shape. */
interface PropRow {
  name: string
  /** The type exactly as written. Never reconstructed, never normalised. */
  type: string
  description?: string
  /** From an `@default` or `@defaultValue` tag on the prop's doc comment. */
  defaultValue?: string
  required: boolean
}

interface PropsInterface {
  /** The exported interface name: `StatusPillProps`. */
  name: string
  /** Path relative to apps/www. */
  file: string
  rows: PropRow[]
}

/**
 * Only `<Pascal>Props`. A component file may export other interfaces, and they
 * are none of this table's business: the contract is that a component's public
 * API is one named exported interface ending in `Props`, and narrowing here is
 * what stops an internal helper type turning up in the API reference of a page.
 */
const PROPS_DECLARATION = /^export\s+interface\s+([A-Za-z_$][\w$]*Props)\b/

/**
 * Bracket depth contributed by one line.
 *
 * `=>` is stripped first. Its `>` would otherwise close a generic that was
 * never opened, and a single miscounted arrow type sends the whole member
 * chunker off by one for the rest of the interface.
 */
function bracketDelta(line: string): number {
  const text = line.replace(/=>/g, "")
  const open = text.match(/[{([<]/g)?.length ?? 0
  const close = text.match(/[})\]>]/g)?.length ?? 0
  return open - close
}

/**
 * A member declaration that is obviously unfinished at the end of its line.
 *
 * A trailing comma is deliberately NOT in this set. It used to be. Comma
 * separators are legal TypeScript, and a contributor coming from a
 * semicolon-less house style might reach for them, so while a trailing comma
 * was in the set an interface written that way merged every one of its members
 * into a single chunk, which parsed as one row whose type was the rest of the
 * interface. The table came out with one prop in it and nothing said a word. A
 * comma inside a bracket is already covered by the caller's `depth > 0` test,
 * which is where that case belongs.
 */
function awaitsMore(line: string): boolean {
  return /(?:[:|&([<=?+-]|=>|\bextends)$/.test(line)
}

/** A line that continues the previous member rather than starting a new one. */
function continuesPrevious(line: string): boolean {
  return /^(?:[|&?:.]|extends\b)/.test(line)
}

/**
 * Turn a `/** ... *\/` block into a description and, if it has one, a default.
 *
 * Tag lines are removed from the description rather than kept, because the
 * description is a table cell: `@deprecated` and `@see` read as noise in a
 * column six words wide, and `@default` has a column of its own.
 */
function parseDoc(lines: string[]): { description?: string; defaultValue?: string } {
  const text = lines
    .join("\n")
    .replace(/^\/\*\*/, "")
    .replace(/\*\/$/, "")
    .split("\n")
    .map((line) => line.trim().replace(/^\*\s?/, ""))
    .join("\n")

  let defaultValue: string | undefined
  const description: string[] = []
  for (const line of text.split("\n")) {
    const tag = /^@(default|defaultValue)\s+(.+)$/.exec(line.trim())
    if (tag) {
      /* First one wins. Two @default tags on one prop is a source bug, and
         silently taking the last would hide it. */
      defaultValue ??= (tag[2] ?? "").trim().replace(/^`|`$/g, "")
      continue
    }
    if (line.trim().startsWith("@")) continue
    description.push(line)
  }

  const joined = description.join(" ").replace(/\s+/g, " ").trim()
  return {
    description: joined.length > 0 ? joined : undefined,
    defaultValue,
  }
}

/**
 * Flatten a member's lines back to one line without losing its separators.
 *
 * A plain `join(" ")` turns a multi-line object type into
 * `{ low: number high: number }`, which is not a type anybody can read or
 * paste. Two adjacent lines that are each complete get a `; ` between them; a
 * line that ended mid-expression, or one whose successor opens with `|`, `&` or
 * a closing bracket, is joined with a space as written.
 */
function joinChunk(chunk: string[]): string {
  let text = ""
  for (const line of chunk) {
    if (text === "") {
      text = line
      continue
    }
    const separated =
      !/(?:[{([<,;|&:]|=>)$/.test(text) && !/^[)\]}>,;|&]/.test(line)
    text += separated ? `; ${line}` : ` ${line}`
  }
  return text.replace(/\s+/g, " ").trim()
}

/** Parse one accumulated member chunk. Returns null for anything not a prop. */
function parseMember(
  chunk: string[],
  doc: string[]
): PropRow | null {
  const text = joinChunk(chunk).replace(/[;,]$/, "")
  /* An index signature (`[key: string]: unknown`) and a method signature
     (`onChange(value: string): void`) both fail this deliberately. Neither is a
     prop a reader sets, and the contract asks for `onChange?: (v) => void`
     instead of a method anyway. */
  const match = /^(?:readonly\s+)?([A-Za-z_$][\w$]*)(\?)?\s*:\s*(.+)$/.exec(text)
  if (!match) return null
  const [, name, optional, type] = match
  if (!name || !type) return null
  const { description, defaultValue } = parseDoc(doc)
  return {
    name,
    /* A leading `|` is how Prettier writes a union that had to wrap. It is
       legal TypeScript and meaningless to a reader in a table cell. */
    type: type.trim().replace(/^\|\s*/, ""),
    description,
    defaultValue,
    required: optional === undefined,
  }
}

/** Every `export interface <Pascal>Props` under registry/bases/, in file order. */
function extractPropsInterfaces(): PropsInterface[] {
  const files: string[] = []
  walkFiles(BASES_DIR, files)

  const found: PropsInterface[] = []
  for (const file of files) {
    const contents = readMaybe(file)
    if (contents === undefined) continue
    const lines = contents.split("\n")

    for (let index = 0; index < lines.length; index += 1) {
      const match = PROPS_DECLARATION.exec(lines[index] ?? "")
      if (!match) continue
      const name = match[1]
      if (!name) continue

      /* Find the interface body by brace depth. Only `{}` is counted here:
         an `extends Something<"span">` on the declaration line carries angle
         brackets that have nothing to do with where the body ends. */
      let depth = 0
      let opened = false
      let last = -1
      for (let scan = index; scan < lines.length; scan += 1) {
        for (const character of lines[scan] ?? "") {
          if (character === "{") {
            depth += 1
            opened = true
          } else if (character === "}") {
            depth -= 1
          }
        }
        if (opened && depth <= 0) {
          last = scan
          break
        }
      }
      if (last === -1) continue

      const region = lines.slice(index, last + 1).join("\n")
      const body = region.slice(region.indexOf("{") + 1, region.lastIndexOf("}"))
      const rows = readMembers(body)
      const obvious = countObviousMembers(body)
      if (rows.length !== obvious) {
        console.error(
          [
            `build-reference: could not read ${name} in ${relative(APP_DIR, file)}.`,
            `  The chunker found ${rows.length} prop(s); a straight line count found ${obvious}.`,
            "",
            "  A props table is published under a heading that says it was generated, so",
            "  emitting the smaller number would put a page on the site claiming to",
            "  document an interface it had only partly read. Rather than do that, this",
            "  script stops.",
            "",
            "  Usual causes: a member whose type wraps in a shape the chunker does not",
            "  expect, a method signature (write `onChange?: (v: string) => void`, not",
            "  `onChange(v: string): void`), or an index signature. Both of the last two",
            "  are refused on purpose - neither is a prop a reader sets.",
          ].join("\n"),
        )
        process.exit(1)
      }
      found.push({ name, file: relative(APP_DIR, file), rows })
      index = last
    }
  }

  return found
}

/**
 * Split an interface body into members.
 *
 * Line-based rather than character-based because this repository's Prettier
 * config omits semicolons, so a newline is the terminator and a chunk has to be
 * judged complete by what it ends with and what follows it. A union split over
 * four lines is the shape this has to survive.
 */
function readMembers(body: string): PropRow[] {
  const lines = body.split("\n")
  const rows: PropRow[] = []

  let doc: string[] = []
  let inDoc = false
  let chunk: string[] = []
  let depth = 0

  for (let index = 0; index < lines.length; index += 1) {
    const line = (lines[index] ?? "").trim()

    if (inDoc) {
      doc.push(line)
      if (line.endsWith("*/")) inDoc = false
      continue
    }
    if (line.startsWith("/**")) {
      /* A new doc comment discards a previous one that never reached a member,
         which happens when a commented-out prop is left behind. */
      doc = [line]
      inDoc = !line.endsWith("*/")
      continue
    }
    if (line === "" || line.startsWith("//") || line.startsWith("/*")) continue

    chunk.push(line)
    depth += bracketDelta(line)

    const next = (lines[index + 1] ?? "").trim()
    if (depth > 0 || awaitsMore(line) || continuesPrevious(next)) continue

    const row = parseMember(chunk, doc)
    if (row) rows.push(row)
    chunk = []
    doc = []
    depth = 0
  }

  return rows
}

/**
 * How many members the body OBVIOUSLY has, counted by a different method.
 *
 * `readMembers` is a chunker, and every chunker has shapes it silently merges or
 * silently drops. The failure mode is not a crash: it is a props table with two
 * rows in it on a page that claims to document six, published under a heading
 * that says it was generated. So the count is taken twice, by two methods that
 * fail differently, and `extractPropsInterfaces` refuses to emit when they
 * disagree. This one is deliberately naive. It counts a member as a line that
 * starts with a name and a colon, at brace depth zero, outside a comment.
 */
function countObviousMembers(body: string): number {
  let count = 0
  let depth = 0
  let inBlockComment = false
  for (const raw of body.split("\n")) {
    const line = raw.trim()
    if (inBlockComment) {
      if (line.includes("*/")) inBlockComment = false
      continue
    }
    if (line.startsWith("/*")) {
      if (!line.includes("*/")) inBlockComment = true
      continue
    }
    if (line === "" || line.startsWith("//") || line.startsWith("*")) continue
    if (depth === 0 && /^(?:readonly\s+)?[A-Za-z_$][\w$]*\??\s*:/.test(line)) count += 1
    depth += bracketDelta(line)
    if (depth < 0) depth = 0
  }
  return count
}

/**
 * The generated module, as text.
 *
 * Interfaces are sorted by name so the file is stable whatever order the
 * filesystem hands them back; props keep DECLARATION order, because that order
 * is the author's argument about which prop matters most and re-sorting it
 * alphabetically would throw that away.
 */
function propsModule(interfaces: PropsInterface[]): string {
  /* Sort first, then keep the first of any duplicate name, so a collision
     resolves the same way on every machine rather than by directory order.
     main() reports the collision; this only decides what the file says. */
  const seen = new Set<string>()
  const sorted = [...interfaces]
    .sort((a, b) => a.name.localeCompare(b.name) || a.file.localeCompare(b.file))
    .filter((entry) => (seen.has(entry.name) ? false : (seen.add(entry.name), true)))
  const q = (value: string): string => JSON.stringify(value)

  const tables = sorted.map((entry) => {
    const rows = entry.rows.map((row) =>
      [
        `    ${q(row.name)}: {`,
        `      type: ${q(row.type)},`,
        row.description === undefined ? null : `      description: ${q(row.description)},`,
        row.defaultValue === undefined ? null : `      default: ${q(row.defaultValue)},`,
        `      required: ${row.required},`,
        `    },`,
      ]
        .filter((line): line is string => line !== null)
        .join("\n"),
    )
    return [`  ${q(entry.name)}: {`, ...rows, `  },`].join("\n")
  })

  const sources = sorted.map((entry) => `  ${q(entry.name)}: ${q(entry.file)},`)
  const propCount = sorted.reduce((total, entry) => total + entry.rows.length, 0)

  return `/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Source:    every \`export interface <Pascal>Props\` under registry/bases/
 * Generator: scripts/build-reference.mts   (\`pnpm run generate\`)
 * Gate:      \`pnpm check:generated\` regenerates this file and fails on a diff.
 *
 * <PropsTable name="StatusPillProps" /> in components/docs/tables.tsx reads this
 * map, and it is the only reader. No page writes a prop row by hand: a typed row
 * is correct on the day it is written and wrong from the next commit onwards,
 * with nothing anywhere to say so.
 *
 * The shape is fumadocs' TypeTable \`type\` prop - prop name to
 * { type, description, default, required } - so the entry is passed straight
 * through with no translation layer of its own to drift.
 *
 * Only the interface's OWN members are here. Props inherited through \`extends\`
 * are deliberately absent: opsinjs re-documents what it adds, and a table that
 * repeated forty upstream props would bury the four that are decisions.
 *
 * No timestamp. This file is behind a byte-for-byte drift gate, and a build time
 * would fail it on every run made on a different second from the commit.
 */

/** One row of a generated props table. Assignable to fumadocs' \`TypeNode\`. */
export interface GeneratedProp {
  /** The type exactly as the interface writes it. */
  type: string
  /** The prop's doc comment with its tags removed. Absent when it has none. */
  description?: string
  /** The value of an \`@default\` or \`@defaultValue\` tag, when there is one. */
  default?: string
  /** False when the prop is declared optional. */
  required: boolean
}

/** One interface's props, keyed by prop name, in declaration order. */
export type GeneratedPropsTable = Record<string, GeneratedProp>

/** Keyed by the exported interface name: \`StatusPillProps\`. */
export const PROPS_TABLES: Record<string, GeneratedPropsTable> = {
${tables.join("\n")}${tables.length > 0 ? "\n" : ""}}

/** Interface name to the file it is exported from, relative to apps/www. */
export const PROPS_SOURCES: Record<string, string> = {
${sources.join("\n")}${sources.length > 0 ? "\n" : ""}}

export const PROPS_META: { interfaces: number; props: number } = {
  interfaces: ${sorted.length},
  props: ${propCount},
}
`
}

/* ------------------------------------------------------------------ *
 * Main                                                                *
 * ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const checkOnly = process.argv.includes("--check")
  const tokens = await loadTokens()
  const symbols = extractSymbols()

  /* The reverse index is built once for the whole set: it is O(n^2) in the
     number of exported symbols and there is one answer for the run. */
  const usedBy = referenceIndex(symbols)
  const byName = new Map(symbols.map((symbol) => [symbol.name, symbol]))

  const specs: PageSpec[] = [
    tokensPage(tokens),
    dataAttributesPage(),
    cssVariablesPage(tokens),
    keyboardPage(),
    typesPage(symbols, usedBy, byName),
    contrastPage(),
  ]

  const outputs: Array<{ file: string; contents: string }> = specs.map((spec) => {
    const file = join(GENERATED_DIR, `${spec.slug}.mdx`)
    return { file, contents: assemble(spec, file) }
  })

  /* The props map goes through the same `outputs` list as the pages, so
     `--check` covers it without a second code path. It is emitted even when
     nothing is built: an empty map renders <NoDataYet>, and a module that
     appears only once a component exists would make the import in
     components/docs/tables.tsx fail on a clean checkout. */
  const propsInterfaces = extractPropsInterfaces()
  const duplicates = propsInterfaces
    .map((entry) => entry.name)
    .filter((name, index, all) => all.indexOf(name) !== index)
  if (duplicates.length > 0) {
    /* Two files exporting the same interface name would silently collapse into
       one key, and the surviving one would depend on directory order. Say so
       rather than publish whichever won. */
    console.warn(
      `build-reference: duplicate props interface name(s): ${[...new Set(duplicates)].join(", ")}. ` +
        "Each component's props interface name must be unique across registry/bases/.",
    )
  }
  outputs.push({ file: PROPS_MODULE, contents: propsModule(propsInterfaces) })

  if (checkOnly) {
    const drifted = outputs.filter((output) => readMaybe(output.file) !== output.contents)
    if (drifted.length > 0) {
      console.error(
        [
          "build-reference --check: generated output is out of date.",
          ...drifted.map((output) => `  ${relative(APP_DIR, output.file)}`),
          "",
          "  Run `pnpm run generate` and commit the result.",
        ].join("\n"),
      )
      process.exit(1)
    }
    console.log("build-reference --check: up to date.")
    return
  }

  let writtenCount = 0
  for (const output of outputs) {
    if (writeIfChanged(output.file, output.contents)) writtenCount += 1
  }

  const emptyPages = specs.filter((spec) => spec.body.includes("<NoDataYet")).length
  console.log(
    [
      `build-reference: ${specs.length} reference pages, ` +
        `${symbols.length} exported symbols, ` +
        `${propsInterfaces.length} props interfaces; ${writtenCount} changed.`,
      emptyPages > 0
        ? `  ${emptyPages} of ${specs.length} render <NoDataYet>: their source data does not exist yet.`
        : "",
    ]
      .filter((line) => line !== "")
      .join("\n"),
  )
}

await main()
