/**
 * check-a11y.mts - the accessibility rig, in two halves.
 *
 *   node scripts/check-a11y.mts                                  # the static half
 *   node scripts/check-a11y.mts --strict                          # warnings fail too
 *   node scripts/check-a11y.mts --json                            # machine-readable
 *   node scripts/check-a11y.mts --layout --base http://127.0.0.1:4000
 *
 * THE STATIC HALF reads every file under registry/bases, registry/examples and
 * registry/screens and enforces what an accessibility contract can be enforced
 * from source: that a status surface carries a word and an icon and not only a
 * colour, that no type size is in px, that no colour is a literal, that no
 * single element takes colour from both axes, that no banned word reaches copy
 * or an identifier, and that no class is used which resolves under the docs
 * chrome and to nothing under /view. It needs no browser and no dependency, so
 * it runs in CI on every pull request and inside `pnpm check`.
 *
 * THE LAYOUT HALF (--layout) measures the three things a parser cannot see: the
 * 44x44 hit-area floor, survival at a 1.3x root font size, and usability at
 * 200% with no truncated numeric value. It needs a layout engine, and Playwright
 * is deliberately not a dependency of this repository - it is installed at job
 * time in .github/workflows/nightly.yml and nowhere else - so this half loads it
 * by dynamic import and exits 0 with a paragraph when it is absent, exactly as
 * capture-registry.mts does. Do not add playwright to any package.json to make
 * it run locally; start the site and install it in a throwaway shell instead.
 *
 * ── WHAT THE STATIC HALF CAN SEE, AND WHAT IT CANNOT ─────────────────────────
 *
 * It reads one file at a time, as text. It does not build a module graph, it
 * does not evaluate anything, and it never sees the rendered DOM. Being exact
 * about that boundary is the point: a check that over-promises is worse than one
 * that does not exist, because the promise is what stops somebody writing the
 * check that would have caught the defect.
 *
 * It CAN prove: which JSX elements carry which attributes and which classes,
 * which identifiers and string literals a file contains, and which specifiers it
 * imports. That is enough for every rule below, because every rule below is
 * about something written into the source rather than computed at runtime.
 *
 * It CANNOT prove:
 *   - that the icon and the word land on the same surface as the colour. It sees
 *     that a file which stamps `data-status` also reads CLINICAL_STATUS_META and
 *     imports a lucide icon. A file that reads both and renders neither passes.
 *   - that the word is visible. A status word inside an `sr-only` span satisfies
 *     A11Y001 and violates the contract; colour-independence needs a *visible*
 *     word, and only a browser or a person can tell the difference.
 *   - anything across an import. A component that composes StatusPill inherits
 *     its four carriers, and this check neither follows that import nor credits
 *     it; where composition is plausible it downgrades the finding to a warning
 *     and says so rather than guessing.
 *   - anything computed. A class name assembled from a variable, a colour read
 *     from a prop, or a size chosen at runtime is invisible here.
 *   - a status word that is assembled rather than written. A11Y002 reads two
 *     shapes and two only: a quoted string whose whole content is one of the
 *     five words, and a JSX text child whose whole text - whitespace collapsed
 *     the way JSX collapses it - is one of them. So `<span>Needs attention</span>`
 *     is caught and `{"Urg" + "ent"}` is not, and neither is a word that arrives
 *     through a prop, a lookup table keyed somewhere else, or an import.
 *   - contrast. That is measured by check-contrast.mts against the tokens, and
 *     a component that uses only role tokens inherits those measurements.
 *   - icon sizing. The contract asks for icons in `em` beside text; an icon
 *     sized by a class this check does not model is not reported.
 *   - hit area, reflow and text scaling. Those are the layout half, below, and
 *     there is no static approximation of them worth having.
 *
 * A11Y002 in particular is worth stating exactly, because it is the rule most
 * likely to be accused of a false positive. It reads the file with its comments
 * blanked, so the word inside a doc comment explaining the word is not a finding:
 * a comment renders nothing, and a checker that reports its own explanation is a
 * checker that gets switched off. It matches the exact casing CLINICAL_STATUS_META
 * publishes, which is what separates the WORD from the LEVEL ID - `status="watch"`
 * and a `<code>watch</code>` in a demo are the API value and are left alone, while
 * `<span>Watch</span>` is the word and is not. It reads only whole text: a status
 * word inside a sentence is not reported, because "watch" and "urgent" are
 * ordinary English and a rule that fires on them fires on prose.
 *
 * Three gaps follow, and all three are named rather than closed. A shouted
 * `URGENT` is not the published casing. A word buried mid-sentence is not whole
 * text. And the JSX-text scan reads only the FIRST text run after an opening
 * tag, so `<span><svg />Urgent</span>` — a word placed after a sibling element,
 * which is exactly how an icon-then-word pill is written — is invisible to it.
 * The first two cost the level id or the sentence to close. The third is a
 * limitation of scanning JSX with a regex rather than a parser, and the honest
 * position is that this rule raises the cost of restating a status word without
 * making it impossible. What it must never do is claim otherwise.
 *
 * ── SEVERITY, AND WHERE A WARNING ACTUALLY FAILS ──────────────────────────────
 *
 * An error fails the run; a warning does not, and `--strict` promotes every
 * warning to an error so that it does. The split is calibrated rather than
 * decorative: a warning is either a finding that still renders something - a
 * Tailwind t-shirt type size, a neutral ramp step, the retired
 * --opsin-target-min - or one this file cannot settle on its own, like an element
 * carrying `data-status` whose word and glyph may be delegated across an import
 * it does not follow.
 *
 * A warning that fails nothing anywhere is not a finding, it is a decoration. So
 * `--strict` runs BLOCKING in .github/workflows/nightly.yml, at the end of the
 * job where its failure cannot skip the browser half. The pull-request gate stays
 * on the plain run, because an undecidable finding is not a reason to stop
 * somebody else's change - and the escape hatch below stays a warning for the
 * same reason: made an error, the only repair available to a component that
 * legitimately composes another would be to take the rule out.
 *
 * ── WHY THIS IS AN ACCESSIBILITY CHECK AND NOT A LINT RULE ────────────────────
 *
 * Every rule here is one of the measured findings in tokens/color.json, not a
 * matter of taste. The CVD audit at tokens/color.json:1240-1304 records `steady`
 * and `attention` as indistinguishable under deuteranopia and under greyscale,
 * and `steady` and `urgent` as indistinguishable under tritanopia - measured at
 * Lc 0, not "close". A status rendered as a colour alone is therefore not a
 * degraded experience for some readers, it is a status those readers cannot
 * read at all, and the word is the primary carrier with the icon second. A11Y001
 * is that finding, expressed as a gate.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/check-a11y.mts needs Node 24 or newer.",
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

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const REGISTRY_DIR = join(APP_DIR, "registry")

/**
 * The three trees a component author writes into, and the only three this
 * checks. `components/` is deliberately absent: it is the lyra docs chrome,
 * which is authored against app/globals.css and is allowed every class this
 * file forbids. `components/ui/button.tsx` uses four of them.
 */
const SCAN_DIRS = [
  join(REGISTRY_DIR, "bases"),
  join(REGISTRY_DIR, "examples"),
  join(REGISTRY_DIR, "screens"),
]

/* ------------------------------------------------------------------ *
 * The vocabularies this check is written against                      *
 * ------------------------------------------------------------------ */

/**
 * The six words banned by health/reference-ranges.mdx:48-54 that are not in the
 * generated BANNED_WORDS list. The generated ten come from tokens/glossary.json
 * and are read at run time rather than copied here, so this file cannot drift
 * from the token source; these six have no token row yet, so they are declared
 * with the same shape and the same citation discipline. Adding a row to
 * tokens/glossary.json and deleting it from here is a strict improvement.
 */
const BANNED_ADDITIONS: { word: string; instead: string }[] = [
  { word: "healthy", instead: "in the usual range" },
  { word: "unhealthy", instead: "higher than the usual range" },
  { word: "good", instead: "say the direction - higher, or lower" },
  { word: "perfect", instead: "in the usual range" },
  { word: "optimal", instead: "in the usual range" },
  { word: "elevated", instead: "higher than" },
]

/**
 * Suffixes an identifier may add to a banned word and still be that word.
 *
 * This is the whole of the morphology, and it is deliberately short. The
 * temptation is to match any identifier segment that STARTS WITH a banned word,
 * which fires on `badge` (bad), `justify` (just) and `justified` - and a check
 * that fires on `justify-center` is a check somebody switches off within a day.
 * `normalise`, `normalized` and `isNormal` are the cases that matter, they are
 * the cases tokens/glossary.json:19 names, and they are all covered here.
 *
 * `ly` was removed once and has been put back, and the round trip is worth
 * recording. It was removed because it matched `positively` — an ordinary
 * English adverb, in a COMMENT, in a correct file. But the real defect there
 * was that this scan was reading comments at all: an identifier is not a
 * comment, and the scan now reads the comment-blanked source. With that fixed,
 * `ly` costs nothing and covers `normally` and `poorly`, so removing it as well
 * was surplus leniency on a banned-word gate. Two independent reviewers said so
 * and they were right.
 *
 * The gap this leaves is the PREFIXED form: `denormalize` is one segment that
 * does not begin with a banned word, so it passes. Closing it means stripping
 * candidate prefixes, which puts `debadged` and `unjustified` back in range.
 * The gap is named here rather than papered over; a reviewer looking for it
 * knows where it is.
 */
const IDENTIFIER_SUFFIXES = [
  "",
  "s",
  "es",
  "d",
  "ed",
  "ing",
  "ly",
  "ise",
  "ised",
  "ising",
  "ize",
  "ized",
  "izing",
  "isation",
  "ization",
  "ness",
]

/**
 * The CSS named colours, as a set, so a bare `red` in a colour property is
 * caught without a bare "red" in a sentence being caught with it. `transparent`
 * and `currentColor` are deliberately absent: neither names a colour, and both
 * are legitimate in a component.
 */
const CSS_NAMED_COLOURS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue " +
    "blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk " +
    "crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki " +
    "darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue " +
    "dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite " +
    "gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen " +
    "lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen " +
    "magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream " +
    "mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum " +
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen " +
    "steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(" "),
)

/** Tailwind's own palette. None of it is an opsinjs token. */
const TAILWIND_PALETTE =
  "slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|" +
  "cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black"

/** Every Tailwind utility prefix that paints or strokes something. */
const COLOUR_UTILITIES =
  "bg|text|border|ring|outline|fill|stroke|decoration|divide|from|via|to|shadow|caret|" +
  "accent|placeholder"

/**
 * The roles declared only in app/globals.css. Under /view the stylesheet is
 * app/product.css, whose `@theme inline` block bridges eleven surface roles and
 * the two axes and nothing else, so every name here resolves to a colour in the
 * docs and to nothing at all in the product. This is the single most likely
 * defect across twenty-four components, because it looks correct in review: the
 * component is reviewed inside <ComponentPreview>, which renders in the docs
 * document under the docs chrome.
 */
const CHROME_ONLY_ROLES = [
  "secondary-foreground",
  "secondary",
  "accent-foreground",
  "accent",
  "destructive-foreground",
  "destructive",
  "popover-foreground",
  "popover",
  "sidebar-primary-foreground",
  "sidebar-primary",
  "sidebar-accent-foreground",
  "sidebar-accent",
  "sidebar-foreground",
  "sidebar-border",
  "sidebar-ring",
  "sidebar",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
]

/** What to reach for instead of a chrome-only role, by role. */
const CHROME_ONLY_ADVICE: Record<string, string> = {
  secondary: "bg-muted with text-muted-foreground",
  accent: "bg-muted, or a category surface role",
  destructive: "the status axis - bg-status-urgent-surface with text-status-urgent-ink",
  popover: "bg-card with text-card-foreground",
  sidebar: "bg-card or bg-muted",
  chart: "the category axis, per foundations/data-visualisation/chart-colour",
}

/* ------------------------------------------------------------------ *
 * Findings                                                            *
 * ------------------------------------------------------------------ */

interface Finding {
  level: "error" | "warn"
  rule: string
  /** A repo-relative path for the static half; a URL for the layout half. */
  where: string
  line?: number
  message: string
}

const findings: Finding[] = []

/**
 * A `cn()` call inside a JSX tag is inside two regions at once, so the same
 * defect can be reached twice. Reporting it twice would say there are two
 * defects, and a count that overstates is a count nobody trusts.
 */
const emitted = new Set<string>()

function record(finding: Finding): void {
  const key = `${finding.level}|${finding.rule}|${finding.where}|${finding.line}|${finding.message}`
  if (emitted.has(key)) return
  emitted.add(key)
  findings.push(finding)
}

function fail(rule: string, where: string, message: string, line?: number): void {
  record({ level: "error", rule, where, message, line })
}

function warn(rule: string, where: string, message: string, line?: number): void {
  record({ level: "warn", rule, where, message, line })
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

/**
 * The same dynamic-import shim check-contrast.mts uses. `lib/*.ts` modules are
 * written to be loadable by plain node - no JSX, erasable syntax only, explicit
 * `.ts` extensions on their own relative imports - precisely so the scripts can
 * read the vocabulary rather than restating it.
 */
async function importModule(relativePath: string): Promise<Record<string, unknown> | undefined> {
  const file = join(APP_DIR, relativePath)
  if (!exists(file)) return undefined
  try {
    return (await import(pathToFileURL(file).href)) as Record<string, unknown>
  } catch (error) {
    console.warn(`check-a11y: ${relativePath} could not be imported - ${(error as Error).message}`)
    return undefined
  }
}

/** Line-start offsets, so a match index becomes a 1-based line number. */
function lineStarts(source: string): number[] {
  const starts = [0]
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") starts.push(index + 1)
  }
  return starts
}

function lineAt(starts: number[], index: number): number {
  let low = 0
  let high = starts.length - 1
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if ((starts[middle] as number) <= index) low = middle
    else high = middle - 1
  }
  return low + 1
}

/**
 * Every JSX opening tag in the file, as raw text.
 *
 * Attribute values may contain braces, quotes and `>` - `onClick={() => a > b}`
 * is legal - so this walks the characters rather than reaching for a regex,
 * tracking string state and brace depth and stopping at the `>` that closes the
 * tag. It is not a parser and does not need to be: every rule that uses it asks
 * only "which attributes and classes are on this one element", and that question
 * survives an imperfect boundary.
 */
function jsxElements(source: string): { text: string; index: number }[] {
  const elements: { text: string; index: number }[] = []
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== "<") continue
    const next = source[index + 1] ?? ""
    if (!/[A-Za-z]/.test(next)) continue
    let depth = 0
    let quote = ""
    let cursor = index + 1
    for (; cursor < source.length; cursor += 1) {
      const character = source[cursor] as string
      if (quote) {
        if (character === "\\") cursor += 1
        else if (character === quote) quote = ""
        continue
      }
      if (character === '"' || character === "'" || character === "`") {
        quote = character
        continue
      }
      if (character === "{") depth += 1
      else if (character === "}") depth -= 1
      else if (character === ">" && depth <= 0) break
    }
    elements.push({ text: source.slice(index, cursor + 1), index })
    index = cursor
  }
  return elements
}

/**
 * The argument list of every `cn(...)` and `cva(...)` call, as raw text.
 *
 * A cva variant map is not a JSX tag and would otherwise be invisible to the
 * axis rule - which would leave the likeliest form of OPSIN-0001 unchecked,
 * because a component with a `status` variant and a `category` variant declares
 * both in one cva call and applies both to one element. One call produces one
 * element's class list, so a call body answers the same question a tag does.
 */
function styleCallBodies(source: string): { text: string; index: number }[] {
  const bodies: { text: string; index: number }[] = []
  const opener = /(?<![\w$.])(cn|cva)\s*\(/g
  let match: RegExpExecArray | null
  while ((match = opener.exec(source)) !== null) {
    let depth = 1
    let quote = ""
    let cursor = opener.lastIndex
    for (; cursor < source.length && depth > 0; cursor += 1) {
      const character = source[cursor] as string
      if (quote) {
        if (character === "\\") cursor += 1
        else if (character === quote) quote = ""
        continue
      }
      if (character === '"' || character === "'" || character === "`") {
        quote = character
        continue
      }
      if (character === "(") depth += 1
      else if (character === ")") depth -= 1
    }
    bodies.push({ text: source.slice(match.index, cursor), index: match.index })
  }
  return bodies
}

/** Quoted strings and template literals, for the rules that only apply to copy. */
function stringLiterals(source: string): { text: string; index: number }[] {
  const literals: { text: string; index: number }[] = []
  const pattern = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) {
    literals.push({ text: match[0].slice(1, -1), index: match.index })
  }
  return literals
}

/** `isNormal` -> `is`, `Normal`. `NORMAL_RANGE` -> `NORMAL`, `RANGE`. */
function identifierSegments(identifier: string): string[] {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_$0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * A banned word, as the pattern that finds it in COPY.
 *
 * Not a substring search, and the difference is the whole rule: `bad` is a
 * substring of `badge`, `just` of `justify-center` and `adjust`, `normal` of
 * `abnormal`, and `healthy` of `unhealthy`. A substring matcher reports all of
 * those, three of them wrongly, and the check gets switched off.
 *
 * Not `\b` either, and that is the part worth explaining. `\b` treats a hyphen
 * as a word boundary, so it fires on `whitespace-normal`, `font-normal` and
 * `normal-case` — Tailwind utilities, in a file that has done nothing wrong. It
 * fired on the first component this repository ever built, twice, which is
 * exactly how a check earns a reputation for crying wolf and then gets deleted.
 * So a hyphen on either side disqualifies a match here.
 *
 * That leaves a hole, and A11Y010 below is what fills it: the compound
 * IDENTIFIER form — `normalRange`, `isNormal`, `NORMAL_RANGE` — which `\b`
 * never caught in the first place, because there is no boundary between `l` and
 * `R`. The ban on identifiers is real (`tokens/glossary.json:19`), and it is
 * enforced by segmenting identifiers rather than by widening this pattern.
 *
 * The apostrophe in "don't worry" is matched straight, curly or absent, and the
 * space is matched as any run of whitespace so that a line break inside a
 * sentence does not hide it.
 */
function bannedWordPattern(word: string): RegExp {
  const body = word
    .split(/\s+/)
    .map((part) => escapeForRegExp(part).replace(/'/g, "['’]?"))
    .join("\\s+")
  return new RegExp(`\\b${body}\\b`, "gi")
}

/**
 * Does this string look like a list of CSS utility classes rather than prose?
 *
 * It has to be asked, because this repository composes classes with `cn(...)`,
 * so a class list is an ordinary string literal and not an attribute value.
 * A token is utility-shaped when it is lower case, contains no sentence
 * punctuation, and carries a `-` or a `:` — `whitespace-normal`,
 * `dark:bg-status-urgent-surface`, `size-[1em]`. A sentence fails on the first
 * capital or full stop, and a one-word string fails for want of a separator, so
 * `"normal"` on its own is still copy and is still caught.
 */
function looksLikeClassList(text: string): boolean {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  let separated = 0
  for (const token of tokens) {
    if (!/^[a-z0-9:[\]()/.,%_#-]+$/.test(token)) return false
    if (token.includes("-") || token.includes(":")) separated += 1
  }
  return separated > 0
}


/* ------------------------------------------------------------------ *
 * A11Y001-002 - the status carriers                                   *
 * ------------------------------------------------------------------ */

/**
 * Every way a file can paint a status colour.
 *
 * This matters more than it looks. The rule below used to trigger only on
 * `data-status`, which meant the exact defect it exists to catch — a surface
 * coloured `bg-status-urgent` with no word, no glyph and no DOM contract — was
 * the one shape that passed it clean. A check that is evaded by writing LESS is
 * worse than no check, because it reads as coverage.
 *
 * Both spellings are matched: the custom property, and the Tailwind utility the
 * product theme bridges it to. The utility list is every colour-consuming prefix
 * Tailwind generates, because it costs nothing to be complete here and a missed
 * one is a silent hole.
 */
/**
 * The source with its comments blanked out.
 *
 * Every test in `checkStatusCarriers` asks "does this file DO x", and a comment
 * explaining why the file does not do x is not the file doing it. Without this,
 * a comment naming `CLINICAL_STATUS_META` makes the checker report the wrong one
 * of two branches and tell the author something false about their own file —
 * which is exactly the kind of thing that gets a checker distrusted and then
 * disabled. `://` is spared so that a URL in a string is not turned into a
 * comment boundary.
 *
 * Blanked rather than deleted, and every character replaced by a space with the
 * newlines kept, so that an offset into the result is the same offset into the
 * source. A11Y002 reports a line number off this string; a shortened copy would
 * report the wrong one, which for a checker is worse than reporting nothing.
 */
/**
 * The banned words worth reporting in a COMMENT, which is a smaller list than
 * the one worth reporting in copy.
 *
 * The full union contains words with common technical meanings — a constraint
 * that `failed`, `just` the block axis, a `positive` integer, a `perfectly
 * good` comparison, `normal` flow. In reader-facing copy every one of them is a
 * defect. In a comment about code, almost every occurrence is ordinary English,
 * and a rule that reports eight legitimate uses to catch one real one is a rule
 * that gets switched off — which would cost the real one too.
 *
 * So the comment scan takes the words that have no common technical sense: the
 * ones that can only be about a person. `normal` is kept because it is the word
 * this system most wants retired, with an exemption for the two collocations
 * that are terms of art.
 *
 * This is narrower than A11Y009 on purpose, and the narrowing is the reason the
 * rule is usable at all.
 */
const COMMENT_SCANNED = new Set([
  "abnormal",
  "diagnosis",
  "don't worry",
  "healthy",
  "unhealthy",
  "optimal",
  "elevated",
  "normal",
])

/**
 * The text INSIDE comments, with backtick spans removed and offsets kept.
 *
 * The mirror of `withoutComments`. A comment quoting a class name in backticks
 * is quoting code, not writing prose, and reporting it is what made an earlier
 * version of the banned-word scan report a correct file twice.
 */
function commentText(source: string): { text: string; index: number }[] {
  const regions: { text: string; index: number }[] = []
  let index = 0
  const length = source.length

  /* Its own scanner rather than a diff against `withoutComments`. The first
     version compared the blanked string to the source and treated any position
     where they differed as comment — which is every character EXCEPT the spaces,
     because a blanked space equals a real space. Each comment WORD became its
     own region, so "normal flow" arrived as "normal" with nothing after it and
     the terms-of-art exemption below could never fire. The rule appeared to
     work and its exemption never ran once. */
  while (index < length) {
    const char = source[index] as string
    const next = source[index + 1]

    if (char === '"' || char === "'" || char === "`") {
      const quote = char
      index += 1
      while (index < length) {
        const inner = source[index] as string
        if (inner === "\\") {
          index += 2
          continue
        }
        index += 1
        if (inner === quote) break
      }
      continue
    }

    if (char === "/" && (next === "*" || next === "/")) {
      const start = index
      if (next === "*") {
        index += 2
        while (index < length && !(source[index] === "*" && source[index + 1] === "/")) index += 1
        index = Math.min(index + 2, length)
      } else {
        while (index < length && source[index] !== "\n") index += 1
      }
      /* Backtick spans out, length preserved so the offset still lands: a
         comment quoting `whitespace-normal` is quoting code, not writing prose. */
      const text = source
        .slice(start, index)
        .replace(/`[^`]*`/g, (span) => " ".repeat(span.length))
      if (text.trim() !== "") regions.push({ text, index: start })
      continue
    }

    index += 1
  }

  return regions
}


function withoutComments(source: string): string {
  /* Character-by-character rather than two regexes, and the reason is a real
     defect rather than fastidiousness: a `/*` inside one string literal pairs
     with a `*​/` inside another, and the regex form then blanks every line
     between them. That silently switched off A11Y001 and both halves of A11Y002
     over the region — a check that stops checking without saying so, which is
     the failure mode this whole file exists to avoid.

     Blanks rather than deletes: every character inside a comment becomes a
     space and newlines are kept, so an offset into the result is the same
     offset into the source and a reported line number is real. */
  let out = ""
  let index = 0
  const length = source.length

  while (index < length) {
    const char = source[index] as string
    const next = source[index + 1]

    if (char === '"' || char === "'" || char === "`") {
      const quote = char
      out += char
      index += 1
      while (index < length) {
        const inner = source[index] as string
        out += inner === "\n" ? "\n" : inner
        if (inner === "\\") {
          if (index + 1 < length) out += source[index + 1] as string
          index += 2
          continue
        }
        index += 1
        if (inner === quote) break
      }
      continue
    }

    if (char === "/" && next === "*") {
      while (index < length) {
        const inner = source[index] as string
        out += inner === "\n" ? "\n" : " "
        if (inner === "*" && source[index + 1] === "/") {
          out += " "
          index += 2
          break
        }
        index += 1
      }
      continue
    }

    if (char === "/" && next === "/") {
      while (index < length && source[index] !== "\n") {
        out += " "
        index += 1
      }
      continue
    }

    out += char
    index += 1
  }

  return out
}

/**
 * Every literal text child of a JSX element, whitespace collapsed, with the
 * offset of its first real character.
 *
 * The text between an opening tag's `>` and the next `<` is what a reader sees,
 * and it is the shape A11Y002 used to miss entirely: `<span>Needs attention</span>`
 * contains no string literal at all. `{…}` runs are cut out of that text and the
 * fragments either side kept separately, because an expression container is the
 * component reading the word from somewhere rather than restating it - which is
 * the whole distinction the rule is drawing.
 *
 * Whitespace is collapsed because JSX collapses it: a word broken across two
 * source lines renders as one word, and a matcher that cannot see that is a
 * matcher a reformat defeats.
 */
function jsxTextNodes(source: string): { text: string; index: number }[] {
  const nodes: { text: string; index: number }[] = []
  for (const element of jsxElements(source)) {
    const after = element.index + element.text.length
    const next = source.indexOf("<", after)
    const raw = source.slice(after, next === -1 ? source.length : next)
    if (raw.trim() === "") continue

    let depth = 0
    let start = 0
    const fragments: { text: string; offset: number }[] = []
    for (let cursor = 0; cursor < raw.length; cursor += 1) {
      const character = raw[cursor]
      if (character === "{") {
        if (depth === 0) fragments.push({ text: raw.slice(start, cursor), offset: start })
        depth += 1
      } else if (character === "}") {
        depth -= 1
        if (depth <= 0) {
          depth = 0
          start = cursor + 1
        }
      }
    }
    if (depth === 0) fragments.push({ text: raw.slice(start), offset: start })

    for (const fragment of fragments) {
      const leading = fragment.text.length - fragment.text.trimStart().length
      const text = fragment.text.trim().replace(/\s+/g, " ")
      if (text === "") continue
      nodes.push({ text, index: after + fragment.offset + leading })
    }
  }
  return nodes
}

function statusColourPattern(levels: string[]): RegExp {
  const alternation = levels.map(escapeForRegExp).join("|")
  return new RegExp(
    "(?:--opsin-status-(?:" +
      alternation +
      ")-|\\b(?:" +
      COLOUR_UTILITIES +
      ")-status-(?:" +
      alternation +
      ")\\b)",
  )
}

function checkStatusCarriers(
  file: string,
  source: string,
  starts: number[],
  elements: { text: string; index: number }[],
  statusWords: string[],
  statusLevels: string[],
): void {
  const code = withoutComments(source)
  const stamped = elements.filter((element) => /\bdata-status\b/.test(element.text))
  const readsMeta = /\bCLINICAL_STATUS_META\b/.test(code)
  const importsLucide = /from\s+["']lucide-react["']/.test(code)
  const paintsStatus = statusColourPattern(statusLevels).test(code)
  /* THE ESCAPE HATCH, AND WHY IT HAS TO BE THIS WIDE.
     It was briefly narrowed to exclude a file that paints a status colour
     itself, on the theory that painting the surface and delegating the word is
     having it both ways. That is precisely the shape the substrate contract
     PRESCRIBES: an AlertBanner tints its own surface from the status axis and
     renders a StatusPill inside for the word and the glyph. Under the narrowed
     rule that component was a hard error with no repair available except
     deleting the rule — which is how a gate dies. One file cannot tell the
     difference, so it says so, at warning severity, and `--strict` is what
     makes a warning fail. */
  const composesRegistry = /from\s+["']@\/registry\/[^"']+\/ui\/[^"']+["']/.test(code)

  /* Anything that stamps the attribute, reads the vocabulary, or paints the
     colour is a status surface and owes all four carriers. */
  const isStatusSurface = stamped.length > 0 || readsMeta || paintsStatus

  for (const element of stamped) {
    if (readsMeta && importsLucide) break
    const line = lineAt(starts, element.index)
    if (composesRegistry) {
      warn(
        "A11Y001",
        file,
        "This element carries `data-status`, and this file reads neither " +
          "CLINICAL_STATUS_META nor a lucide icon. It does import another registry " +
          "component, so the word and the icon may be delegated to that one - this " +
          "check reads a single file and cannot follow the import. Confirm by eye " +
          "that the surface renders a word and a distinct glyph, not a colour alone.",
        line,
      )
    } else {
      fail(
        "A11Y001",
        file,
        "This element carries `data-status`, and this file reads neither " +
          "CLINICAL_STATUS_META nor an icon from lucide-react, so colour is the only " +
          "carrier of the status. That is OPSIN-0002: the measured CVD audit in " +
          "tokens/color.json finds steady and attention identical under deuteranopia " +
          "and greyscale, and steady and urgent identical under tritanopia. Read the " +
          "word from CLINICAL_STATUS_META[level].word and the glyph from " +
          "CLINICAL_STATUS_META[level].icon.",
        line,
      )
    }
    break
  }

  if (isStatusSurface && stamped.length === 0) {
    const anchor = readsMeta
      ? source.indexOf("CLINICAL_STATUS_META")
      : source.search(statusColourPattern(statusLevels))
    fail(
      "A11Y001",
      file,
      (readsMeta
        ? "This file reads CLINICAL_STATUS_META - so it renders a status word, an " +
          "icon or a status colour - and no element in it carries `data-status`. "
        : "This file paints a status colour and no element in it carries " +
          "`data-status`, so the colour is the only thing that says what level " +
          "this is. ") +
        "`data-status` is the DOM contract the print stylesheet, the greyscale " +
        "audit and every product-side test key on; a status surface without it is " +
        "invisible to all three.",
      lineAt(starts, Math.max(anchor, 0)),
    )
  }

  /* The colour-only case, which is the reason this rule exists. A file that
     paints a status but reads neither the vocabulary nor a glyph has no way to
     be rendering a word or an icon, whatever it stamps. */
  if (isStatusSurface && !(readsMeta && importsLucide) && !composesRegistry && stamped.length === 0) {
    fail(
      "A11Y001",
      file,
      "This file paints a status colour and reads neither CLINICAL_STATUS_META " +
        "nor an icon from lucide-react, so colour is the only carrier of the " +
        "status. That is OPSIN-0002: the measured CVD audit in tokens/color.json " +
        "finds steady and attention identical under deuteranopia and greyscale, " +
        "and steady and urgent identical under tritanopia. Read the word from " +
        "CLINICAL_STATUS_META[level].word and the glyph from " +
        "CLINICAL_STATUS_META[level].icon.",
      lineAt(starts, Math.max(source.search(statusColourPattern(statusLevels)), 0)),
    )
  }

  /* Both passes read `code`, not `source`. A doc comment that quotes a status
     word in order to explain it is not a component restating it, and a rule
     that reports the sentence explaining the rule is one nobody keeps. The
     blanking preserves offsets, so the line numbers below are still the file's
     own. */
  const restatements = [
    ...stringLiterals(code).map((literal) => ({ ...literal, noun: "written as a string literal" })),
    ...jsxTextNodes(code).map((node) => ({ ...node, noun: "written as JSX text" })),
  ]
  for (const candidate of restatements) {
    for (const word of statusWords) {
      /* Whole text, exact case. Whole text because "watch" and "urgent" are
         ordinary English and matching them inside a sentence would fire on
         prose; exact case because the lower-case spelling is the LEVEL ID -
         `status="watch"` is an API value a demo is entitled to write, and
         `Watch` is the word only CLINICAL_STATUS_META may own. */
      if (candidate.text !== word) continue
      fail(
        "A11Y002",
        file,
        `"${word}" is a status word ${candidate.noun}. The five words are ` +
          "owned by CLINICAL_STATUS_META and are read from it, never restated: a " +
          "second copy is a second copy that can drift, and the words are the " +
          "primary carrier of a status for every reader who cannot use the colour. " +
          "Render CLINICAL_STATUS_META[level].word instead. A translation or a " +
          "product's own wording belongs in the value a CONSUMER passes to " +
          "StatusPill's `label` prop, not in a literal inside the registry - this " +
          "rule fires on `label=\"Urgent\"` written here too, and that is " +
          "deliberate: opsinjs shipping its own override of its own vocabulary is " +
          "the drift the rule exists to stop.",
        lineAt(starts, candidate.index),
      )
    }
  }
}

/* ------------------------------------------------------------------ *
 * A11Y003-004 - type size                                             *
 * ------------------------------------------------------------------ */

function checkTypeSize(file: string, source: string, starts: number[]): void {
  const arbitrary = /(?<![\w-])text-\[[^\]]*?\d+(?:\.\d+)?px[^\]]*\]/g
  let match: RegExpExecArray | null
  while ((match = arbitrary.exec(source)) !== null) {
    fail(
      "A11Y003",
      file,
      `\`${match[0]}\` sets a type size in px. Every size in the system is relative, ` +
        "because a reader who has set a larger text size gets a larger reading of " +
        "their own health data and a px size opts out of that permanently. Use one " +
        "of the eleven semantic steps: var(--opsin-text-body-size) and its siblings.",
      lineAt(starts, match.index),
    )
  }

  const declared = /(?<![\w-])font-?[sS]ize\s*:\s*["'`]?[^;,"'`}\n]*?\d+(?:\.\d+)?px/g
  while ((match = declared.exec(source)) !== null) {
    fail(
      "A11Y003",
      file,
      `\`${match[0].trim()}\` sets a type size in px. Use one of the eleven semantic ` +
        "steps - var(--opsin-text-<step>-size) - so the reader's own multiplier " +
        "reaches it. foundations/typography/dynamic-type states the bar: every " +
        "component survives 1.3x with no clipping and no truncation.",
      lineAt(starts, match.index),
    )
  }

  const tshirt = /(?<![\w-])text-(xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g
  while ((match = tshirt.exec(source)) !== null) {
    warn(
      "A11Y004",
      file,
      `\`${match[0]}\` is Tailwind's own t-shirt scale, not one of the eleven ` +
        "opsinjs steps. It resolves - Tailwind ships a default --text-* theme - so " +
        "this is a warning rather than an error, but it resolves to a size this " +
        "design system does not own and does not scale non-linearly. " +
        "foundations/typography/type-scale is the argument. Reach for the step " +
        "whose job matches: body, callout, footnote, caption1.",
      lineAt(starts, match.index),
    )
  }
}

/* ------------------------------------------------------------------ *
 * A11Y005-007 - colour literals and ramp steps                        *
 * ------------------------------------------------------------------ */

function checkColourLiterals(file: string, source: string, starts: number[]): void {
  let match: RegExpExecArray | null

  const hex = /(?<![\w&#])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9A-Za-z_-])/g
  while ((match = hex.exec(source)) !== null) {
    fail(
      "A11Y005",
      file,
      `\`${match[0]}\` is a hex colour. A component consumes roles, never values: ` +
        "the value differs between light and dark, between sRGB and P3, and " +
        "between a consumer's theme and this one, and a literal is the same in all " +
        "four. Use a role token - a surface, line, ink or accent on one of the two " +
        "axes, or one of the eleven bridged surface roles.",
      lineAt(starts, match.index),
    )
  }

  /* `color-mix()` is deliberately absent: it mixes tokens rather than naming a
     colour, and a translucent rung has to composite `-tint` against `-scrim`
     itself because no stylesheet does it for the named material ladder. */
  const functions = /(?<![\w-])(rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\s*\(/g
  while ((match = functions.exec(source)) !== null) {
    fail(
      "A11Y005",
      file,
      `\`${match[1]}()\` is a raw colour. Reach for the token that already holds ` +
        "the measured value; every one of them is published on " +
        "reference/generated/css-variables and every pair between them is measured " +
        "into lib/generated/contrast.json. A literal here is a colour nobody has " +
        "measured against anything.",
      lineAt(starts, match.index),
    )
  }

  const palette = new RegExp(
    `(?<![\\w-])(${COLOUR_UTILITIES})-(${TAILWIND_PALETTE})(-\\d{2,3})?(?![\\w-])`,
    "g",
  )
  while ((match = palette.exec(source)) !== null) {
    fail(
      "A11Y005",
      file,
      `\`${match[0]}\` is a Tailwind palette colour. It is not an opsinjs token, it ` +
        "carries no meaning on either axis, and it has been measured against " +
        "nothing. The two axes and the eleven surface roles are the whole palette " +
        "a component may use.",
      lineAt(starts, match.index),
    )
  }

  const properties =
    "color|background|background-color|backgroundColor|border-color|borderColor|" +
    "outline-color|outlineColor|caret-color|caretColor|accent-color|accentColor|" +
    "text-decoration-color|textDecorationColor|fill|stroke"
  const named = new RegExp(`(?<![\\w-])(${properties})\\s*:\\s*["'\`]?([A-Za-z]+)`, "g")
  while ((match = named.exec(source)) !== null) {
    const value = (match[2] ?? "").toLowerCase()
    if (!CSS_NAMED_COLOURS.has(value)) continue
    fail(
      "A11Y005",
      file,
      `\`${match[1]}: ${match[2]}\` is a CSS named colour. Named colours are ` +
        "literals with friendlier spelling: they do not change between themes, " +
        "they carry no axis, and none of them appears in a contrast measurement.",
      lineAt(starts, match.index),
    )
  }

  const svg = /(?<![\w-])(fill|stroke|stopColor|floodColor)\s*=\s*["']([A-Za-z]+)["']/g
  while ((match = svg.exec(source)) !== null) {
    const value = (match[2] ?? "").toLowerCase()
    if (!CSS_NAMED_COLOURS.has(value)) continue
    fail(
      "A11Y005",
      file,
      `\`${match[0]}\` paints an SVG with a named colour. A graphic that carries ` +
        "meaning is held to the non-text contrast floor, and a literal cannot be " +
        "held to anything. Use `currentColor` and set the colour with a role " +
        "token on the element, which is also what makes the graphic follow the " +
        "surface it sits on.",
      lineAt(starts, match.index),
    )
  }

  /* Two spellings, one defect. `--opsin-category-heart-600` is the custom
     property; `bg-category-heart-600` is the Tailwind class the product theme
     would have to bridge and does not, so it is the worse of the two - it
     resolves to nothing at all under /view and the element renders with no
     colour rather than the wrong one. It is also at least as likely to be
     written, because a class list is where a component author is already
     typing. Matching only the property left the more common half unchecked. */
  const rampStep = new RegExp(
    "(?:--opsin-(?:category|status|brand)-[a-z]+-\\d{2,4}" +
      `|(?<![\\w-])(?:${COLOUR_UTILITIES})-(?:category|status|brand)-[a-z]+-\\d{2,4})` +
      "(?![\\w-])",
    "g",
  )
  while ((match = rampStep.exec(source)) !== null) {
    fail(
      "A11Y006",
      file,
      `\`${match[0]}\` is a numbered ramp step. That is OPSIN-0009: a component ` +
        "consumes roles - `-surface`, `-line`, `-ink`, `-accent` - and the roles " +
        "are what get remapped in dark mode and re-measured when a ramp moves. A " +
        "step is a primitive, and a component holding one holds a value that will " +
        "silently stop meaning what it meant. In the class form it holds nothing " +
        "at all: app/product.css bridges the four roles and no step, so the " +
        "utility generates no CSS and the element takes its colour from whatever " +
        "it inherits.",
      lineAt(starts, match.index),
    )
  }

  const neutralStep = /--opsin-neutral-(\d{1,4})(?![\w-])/g
  while ((match = neutralStep.exec(source)) !== null) {
    warn(
      "A11Y007",
      file,
      `\`${match[0]}\` is a neutral ramp step. The neutrals are the theme layer's ` +
        "raw material - they have no dark-mode override at all, so a component " +
        "holding one renders the same grey in both themes. Use `bg-background`, " +
        "`bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground` or " +
        "`border-border`, which are the roles the theme layer maps for you.",
      lineAt(starts, match.index),
    )
  }
}

/* ------------------------------------------------------------------ *
 * A11Y008 - the never-mix rule, OPSIN-0001, severity: safety          *
 * ------------------------------------------------------------------ */

function checkAxisConflict(
  file: string,
  starts: number[],
  regions: { text: string; index: number; noun: string }[],
): void {
  const axisUtility = new RegExp(`(?<![\\w-])(${COLOUR_UTILITIES})-(status|category)-[a-z]+`, "g")

  for (const element of regions) {
    const line = lineAt(starts, element.index)
    const subject = element.noun
    const hasStatusAttribute = /\bdata-status\b/.test(element.text)
    const hasCategoryAttribute = /\bdata-category\b/.test(element.text)

    if (hasStatusAttribute && hasCategoryAttribute) {
      fail(
        "A11Y008",
        file,
        `${subject} carries both \`data-status\` and \`data-category\`. That is ` +
          "OPSIN-0001, and its severity is `safety` rather than `correctness`: a " +
          "reader looking at one colour cannot tell whether it is answering what " +
          "the reading is about or how urgent it is, and getting that backwards on " +
          "a heart-red card is the failure this whole system exists to prevent. " +
          "Put the category on the surface and render the status as a StatusPill " +
          "inside it.",
        line,
      )
      continue
    }

    const byProperty = new Map<string, Set<string>>()
    let match: RegExpExecArray | null
    axisUtility.lastIndex = 0
    while ((match = axisUtility.exec(element.text)) !== null) {
      const property = match[1] as string
      const axis = match[2] as string
      const seen = byProperty.get(property) ?? new Set<string>()
      seen.add(axis)
      byProperty.set(property, seen)
    }

    const hasStatusVariable = /--opsin-status-/.test(element.text)
    const hasCategoryVariable = /--opsin-category-/.test(element.text)
    const axes = new Set<string>()
    for (const seen of byProperty.values()) for (const axis of seen) axes.add(axis)
    if (hasStatusVariable || hasStatusAttribute) axes.add("status")
    if (hasCategoryVariable || hasCategoryAttribute) axes.add("category")

    const sameProperty = [...byProperty.entries()].find(([, seen]) => seen.size > 1)
    if (sameProperty) {
      fail(
        "A11Y008",
        file,
        `\`${sameProperty[0]}-\` in ${subject.toLowerCase()} resolves both a category ` +
          "colour and a status colour. One property cannot answer two questions: whichever " +
          "declaration wins, the other meaning is silently gone. That is OPSIN-0001.",
        line,
      )
      continue
    }

    if (axes.size > 1) {
      fail(
        "A11Y008",
        file,
        `${subject} takes colour from both axes - category and status. Both axes ` +
          "on one SCREEN is correct and common; both on one SURFACE is OPSIN-0001, " +
          "because the reader has no way to know which question the colour is " +
          "answering. Call axisConflict() from @/lib/opsinjs, render the category " +
          "on the surface, and put the status in a pill inside it.",
        line,
      )
    }
  }
}

/* ------------------------------------------------------------------ *
 * A11Y014 - a threshold with a number in it                           *
 * ------------------------------------------------------------------ */

/**
 * Names that, given a number, make the number a clinical decision.
 *
 * `staleAfterHours`, `thresholdMmol`, `minimumPoints`, `upperLimit`: each of
 * them, defaulted to a literal, is opsinjs deciding when a reading is old, when
 * a trend is worth drawing, or when a value has crossed a line. §7 of the brief
 * forbids every one of those outright — "for any metric, in any population,
 * ever" — and an omitted one renders an explicit "we do not have this" rather
 * than a substituted default.
 */
const THRESHOLD_NAMES =
  /(stale|threshold|cutoff|cut_?off|upperlimit|lowerlimit|minimum|maximum|\blimit\b|expire|expiry|freshfor|band|plausib|refrange|referencerange)/i

/**
 * The subset §7 names by name, which therefore has NO example exemption.
 *
 * "Never ship a reference range, threshold, plausibility bound, score band,
 * staleness default, emergency number, or default disclaimer text — for any
 * metric, in any population, ever… This applies to example data too."
 *
 * `minimumPoints` is not on that list and is not clinical in the same way: it
 * decides whether a line is drawn, not whether a reading is current. So it keeps
 * the `EXAMPLE_` route and these do not. The distinction is the enumeration's,
 * not mine, and it is why `EXAMPLE_HOURS_A_READING_STAYS_CURRENT = 48` reaching
 * a staleness prop is refused however it is spelled: renaming a staleness
 * boundary does not stop it being one.
 */
const NEVER_EXEMPT =
  /(stale|threshold|cutoff|cut_?off|expire|expiry|freshfor|band|plausib|refrange|referencerange)/i

/**
 * Names that LOOK like a threshold and are not one.
 *
 * Every entry here is a real construct in this repository, and the list is short
 * on purpose: a suppression list that grows is a rule that is being argued with
 * rather than obeyed.
 */
const THRESHOLD_EXEMPT =
  /^(minWidth|maxWidth|minHeight|maxHeight|minLength|maxLength|maxFractionDigits|minimumFractionDigits|maximumFractionDigits|limitDepth)$/

/**
 * A11Y014 - a number that decides something clinical, shipped as a default.
 *
 * This rule exists because the same defect arrived three times in one batch and
 * a human found it each time. `relative-time` shipped `staleAfterHours={24}` in
 * the default export that `shadcn add` copies into a consumer's project, and an
 * example carried `STALE_AFTER_HOURS = 48`. Neither number came from anywhere.
 * opsinjs cannot know when a reading goes stale, because it does not know what
 * was measured — and a component that guesses has decided, on behalf of a
 * product that never asked, when to stop telling somebody their result is
 * current.
 *
 * It reads only the code, so a threshold DISCUSSED in a comment or documented on
 * a page is untouched. It fires on a default value and on a module constant,
 * which are the two shapes that ship. It is an ERROR: unlike a word in a
 * comment, this one changes what a reader is told.
 */
function checkShippedThresholds(file: string, source: string, starts: number[]): void {
  const code = withoutComments(source)
  /* `name = 42`, `name: 42`, `name={42}` — a default, a property, a JSX prop. */
  const pattern = /\b([A-Za-z_$][\w$]*)\s*(?:=\s*|:\s*|=\{)\s*(-?\d+(?:\.\d+)?)\b/g
  let match: RegExpExecArray | null
  const reported = new Set<string>()
  /* THE INDIRECTION ROUTE, which is how one got past the first version of this
     rule. `minimumPoints={READINGS_A_TREND_NEEDS}` with
     `const READINGS_A_TREND_NEEDS = 4` above it is the same defect wearing a
     name the pattern above cannot recognise — and it is the name somebody
     reaches for precisely BECAUSE it reads as prose rather than as a threshold.
     So a numeric constant is resolved through to the prop it reaches: the prop
     name is the thing that says what the number decides, and a caller cannot
     rename that. */
  const numericConsts = new Map<string, string>()
  const constPattern = /\bconst\s+([A-Za-z_$][\w$]*)\s*(?::\s*number\s*)?=\s*(-?\d+(?:\.\d+)?)\b/g
  let constMatch: RegExpExecArray | null
  while ((constMatch = constPattern.exec(code)) !== null) {
    numericConsts.set(constMatch[1] as string, constMatch[2] as string)
  }
  const indirect = /\b([A-Za-z_$][\w$]*)\s*=\{\s*([A-Za-z_$][\w$]*)\s*\}/g
  let indirectMatch: RegExpExecArray | null
  while ((indirectMatch = indirect.exec(code)) !== null) {
    const prop = indirectMatch[1] as string
    const via = indirectMatch[2] as string
    const literal = numericConsts.get(via)
    if (literal === undefined) continue
    if (THRESHOLD_EXEMPT.test(prop) || !THRESHOLD_NAMES.test(prop)) continue
    /* `EXAMPLE_` is the same convention `EXAMPLE_SOURCE` uses, and it is the
       only way to write a threshold in this repository. A demo has to pass one
       — the whole point of `minimumPoints` is that a product supplies it, and
       an example with no product is the example standing in for one. Requiring
       the prefix makes that authorship explicit at the call site, so a reader
       sees "this number was the example's choice" rather than a bare 4 that
       reads as the system's.

       IT DOES NOT REACH THE PROPS §7 NAMES, and that restriction was added
       after the prefix was used to ship one. `metric-tile` wrote
       `EXAMPLE_HOURS_A_READING_STAYS_CURRENT = 48` and passed it to a staleness
       prop. Renaming a staleness boundary does not stop it being one, and §7
       lists "staleness default" among the things forbidden "for any metric, in
       any population, ever… This applies to example data too." So `NEVER_EXEMPT`
       carries exactly that enumeration and the hatch does not open for it,
       anywhere, however the constant is spelled. */
    if (via.startsWith("EXAMPLE_") && !NEVER_EXEMPT.test(prop)) continue
    const key = `${prop}:${via}`
    if (reported.has(key)) continue
    reported.add(key)
    fail(
      "A11Y014",
      file,
      `\`${prop}\` is given ${literal}, by way of \`${via}\`. Naming the constant ` +
        "does not change what the number decides — and a name that reads as prose " +
        "is the one somebody reaches for when a literal beside the prop looks " +
        "wrong. opsinjs does not own this number for any metric in any " +
        "population: take it from the caller and render an explicit \"we do not " +
        "have this\" when they have not supplied one.",
      lineAt(starts, indirectMatch.index),
    )
  }

  while ((match = pattern.exec(code)) !== null) {
    const name = match[1] as string
    const value = match[2] as string
    if (THRESHOLD_EXEMPT.test(name)) continue
    if (!THRESHOLD_NAMES.test(name)) continue
    const key = `${name}:${value}`
    if (reported.has(key)) continue
    reported.add(key)
    fail(
      "A11Y014",
      file,
      `\`${name}\` is given the literal ${value}. A name like that with a number ` +
        "in it is a clinical decision — when a reading is stale, when a trend is " +
        "worth drawing, where a value has crossed a line — and opsinjs does not " +
        "own one, for any metric, in any population. It does not know what was " +
        "measured. Take the number from the caller and render an explicit \"we do " +
        "not have this\" when they have not supplied one; never substitute a " +
        "default. If this name is not a threshold, rename it so the next reader " +
        "does not have to work that out.",
      lineAt(starts, match.index),
    )
  }
}

/* ------------------------------------------------------------------ *
 * A11Y015 - a numeric interval with nobody's name on it               *
 * ------------------------------------------------------------------ */

/**
 * A11Y015 - two numeric bounds in one object literal, and no `source`.
 *
 * This is a reference range, a score band or a plausibility bound, whichever
 * word the surrounding code uses, and §7 forbids every one of them: "for any
 * metric, in any population, ever". The tell is not the name — `score-dial`
 * shipped `{ from: 0, to: 40 }` and `trend-sparkline` invented a band bound and
 * attributed it to the caller's source — it is the SHAPE: two numbers that
 * define an interval somebody is compared against, with nothing saying whose
 * interval it is.
 *
 * `ReferenceRange.source` is required by the type for exactly this reason, and
 * an example's must be `EXAMPLE_SOURCE`. So the rule is: a literal with two
 * numeric bounds must carry a `source` in the same literal. That is what makes
 * `{ low: 10, high: 20, source: EXAMPLE_SOURCE }` legitimate and
 * `{ from: 0, to: 40 }` not, and it is checkable without this script knowing
 * anything clinical.
 *
 * A11Y014 catches the same defect when it is spelled as a named constant. This
 * one catches it when it is spelled as a shape, which is how it arrived in
 * Batch C — three components, none of them caught by a name.
 */
const BOUND_PAIRS: [string, string][] = [
  ["low", "high"],
  ["from", "to"],
  ["lower", "upper"],
  ["start", "end"],
]

function checkUnownedIntervals(file: string, source: string, starts: number[]): void {
  const code = withoutComments(source)
  /* Object literals, non-greedy, no nesting: a band is always flat. */
  const literal = /\{[^{}]*\}/g
  let match: RegExpExecArray | null
  while ((match = literal.exec(code)) !== null) {
    const body = match[0]
    for (const [lo, hi] of BOUND_PAIRS) {
      const hasLow = new RegExp(`\\b${lo}\\s*:\\s*-?\\d`).test(body)
      const hasHigh = new RegExp(`\\b${hi}\\s*:\\s*-?\\d`).test(body)
      if (!hasLow || !hasHigh) continue
      if (/\bsource\s*:/.test(body)) break
      fail(
        "A11Y015",
        file,
        `This literal sets \`${lo}\` and \`${hi}\` to numbers and names no ` +
          "`source`. Two numbers that define an interval a reading is compared " +
          "against are a reference range, a score band or a plausibility bound, " +
          "and opsinjs ships none of those for any metric in any population — the " +
          "product owns them, because the product knows who is reading. Take the " +
          "interval from the caller, require a `source` beside it, and render an " +
          "explicit \"we do not have this\" when there is none. In an example the " +
          "source is `EXAMPLE_SOURCE`.",
        lineAt(starts, match.index),
      )
      break
    }
  }
}

/* ------------------------------------------------------------------ *
 * A11Y009-010 - banned words                                          *
 * ------------------------------------------------------------------ */

function checkBannedWords(
  file: string,
  source: string,
  starts: number[],
  banned: { word: string; instead: string }[],
): void {
  /* WHAT COUNTS AS COPY, AND WHY IT IS NOT THE WHOLE FILE.
     This rule reads string literals that are not class lists, plus JSX text.
     It does not read class names, and it no longer reads comments.

     Both exclusions were forced by real false positives on the first component
     this repository built. `whitespace-normal` is a Tailwind utility, and `\b`
     treats a hyphen as a word boundary, so a correct file was reported twice —
     once for the class and once for the comment explaining the class.

     The first repair attempted was to make the word pattern reject a hyphen on
     either side. It was caught in review and reverted: it silenced the ban
     across all hyphenated prose, so "your result is normal-ish" would have
     passed a health system's own lint. The scope was the defect, not the
     boundary.

     Dropping comments narrows what this rule used to CLAIM, and the claim was
     the thing that was wrong. `tokens/glossary.json:19` extends the ban to code
     identifiers, and `health/reference-ranges.mdx` scopes it to "any
     user-facing string about a person's own result". Neither mentions comments,
     and a comment that quotes a banned word in order to explain the ban is not
     the defect anybody meant. Identifiers are covered, harder than before, by
     A11Y010 below. */
  const code = withoutComments(source)
  const copy = [
    ...stringLiterals(code).filter((literal) => !looksLikeClassList(literal.text)),
    ...jsxTextNodes(code),
  ]

  for (const entry of banned) {
    for (const region of copy) {
      const pattern = bannedWordPattern(entry.word)
      let match: RegExpExecArray | null
      while ((match = pattern.exec(region.text)) !== null) {
        fail(
          "A11Y009",
          file,
          `"${match[0]}" is a banned word in reader-facing copy. Write ` +
            `"${entry.instead}" instead. It reaches somebody who is reading about ` +
            "their own health, and every word on the list is one that describes " +
            "the person rather than the measurement.",
          lineAt(starts, region.index + match.index),
        )
      }
    }
  }

  /* A11Y013 - THE SAME WORDS, IN A COMMENT THAT SHIPS.
   *
   * A comment in registry/** is not a private note. `shadcn add` copies the
   * whole file into a consumer's project, so these comments are read by the
   * next developer and by whatever reads their repository afterwards.
   *
   * It is a WARNING and not an error, and the split is the whole design of this
   * rule. The ban's own sources scope it precisely: reference-ranges.mdx says
   * "any user-facing string about a person's own result", and glossary.json:19
   * extends it to "code identifiers". A comment is neither, so an ordinary
   * English use — "a perfectly good comparison" — is not a defect and must not
   * fail a build. But a shipped comment that says "when the reading is normal"
   * is teaching the next person the vocabulary this system exists to retire,
   * and that is worth a line on the way past. `--strict` makes it fail, which
   * is where nightly reads it.
   *
   * Backtick spans are removed first. A comment quoting `whitespace-normal` or
   * `font-normal` is quoting CODE, and that is what made the earlier version of
   * this scan unusable: it reported a correct file twice for naming the class
   * it uses. */
  for (const entry of banned) {
    if (!COMMENT_SCANNED.has(entry.word)) continue
    for (const region of commentText(source)) {
      const pattern = bannedWordPattern(entry.word)
      let match: RegExpExecArray | null
      while ((match = pattern.exec(region.text)) !== null) {
        /* "normal flow" and "normal form" are terms of art about layout and
           about data, not about a person, and a rule that reports them is a
           rule somebody switches off. */
        if (/^\s*(flow|form)\b/.test(region.text.slice(match.index + match[0].length))) continue
        warn(
          "A11Y013",
          file,
          `"${match[0]}" is a banned word, in a comment that ships. \`shadcn add\` ` +
            "copies this file into a consumer's project, so the comment is read by " +
            `the next person who opens it. Write "${entry.instead}", or leave it if ` +
            "the word is being used in its ordinary English sense about something " +
            "other than a reading — this is a warning because a comment is neither " +
            "reader-facing copy nor an identifier, and only those two are banned " +
            "outright.",
          /* The match offset, not the region's. A block comment can be forty
             lines long, and pointing at its first line sends the reader to a
             sentence that does not contain the word. */
          lineAt(starts, region.index + match.index),
        )
      }
    }
  }

  /* Identifiers only, so this reads the comment-blanked source as well.
     `code` above already has the comments removed. Without that, an ordinary
     English adverb in a comment — "the routes it positively recognises" — was
     reported as the banned word `positive` in an identifier, which is neither
     an identifier nor that word. A rule that reports a comment as code is the
     same class of mistake as one that reports a class name as prose, and it
     ends the same way: switched off. */
  const single = banned.filter((entry) => !/\s/.test(entry.word))
  const identifiers = /[A-Za-z_$][A-Za-z0-9_$]*/g
  const reported = new Set<string>()
  let identifier: RegExpExecArray | null
  while ((identifier = identifiers.exec(code)) !== null) {
    const text = identifier[0]
    const lowered = text.toLowerCase()
    const segments = identifierSegments(text).map((segment) => segment.toLowerCase())
    for (const entry of single) {
      /* The whole-file pass above already has the bare word; this pass is only
         for the compound, where a word boundary cannot reach. */
      if (lowered === entry.word) continue
      const hit = segments.some((segment) =>
        IDENTIFIER_SUFFIXES.some((suffix) => segment === `${entry.word}${suffix}`),
      )
      if (!hit) continue
      const key = `${text}:${entry.word}`
      if (reported.has(key)) continue
      reported.add(key)
      fail(
        "A11Y010",
        file,
        `\`${text}\` contains the banned word "${entry.word}" as an identifier ` +
          `segment. Write "${entry.instead}", or name it for what it is: ` +
          "`usualRange`, `inUsualRange`, `toCanonical`. tokens/glossary.json:19 is " +
          'explicit that "normal" is "banned outright across the system, including ' +
          'in code identifiers", and an identifier is the copy of tomorrow: it ' +
          "reaches a prop table, a type page and a consumer's editor.",
        lineAt(starts, identifier.index),
      )
    }
  }
}

/* ------------------------------------------------------------------ *
 * A11Y011-012 - classes that resolve to nothing under /view           *
 * ------------------------------------------------------------------ */

function checkViewPalette(file: string, source: string, starts: number[]): void {
  let match: RegExpExecArray | null

  const roles = CHROME_ONLY_ROLES.map(escapeForRegExp).join("|")
  const utility = new RegExp(`(?<![\\w-])(${COLOUR_UTILITIES})-(${roles})(?:\\/\\d+)?(?![\\w-])`, "g")
  while ((match = utility.exec(source)) !== null) {
    const role = (match[2] ?? "").split("-")[0] as string
    const advice = CHROME_ONLY_ADVICE[role] ?? "one of the eleven bridged surface roles"
    fail(
      "A11Y011",
      file,
      `\`${match[0]}\` resolves to nothing under /view. --${match[2]} is declared ` +
        "only in app/globals.css, which is the docs chrome; the product stylesheet " +
        "is app/product.css and bridges eleven surface roles plus the two axes. " +
        "This is the defect that looks correct in review, because " +
        "<ComponentPreview> renders inline in the docs document. Use " +
        `${advice}.`,
      lineAt(starts, match.index),
    )
  }

  const radius = /(?<![\w-])rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?-([234]xl)(?![\w-])/g
  while ((match = radius.exec(source)) !== null) {
    fail(
      "A11Y011",
      file,
      `\`${match[0]}\` has no opsinjs radius under /view. app/product.css derives ` +
        "sm, md, lg and xl from --radius and stops there; 2xl, 3xl and 4xl exist " +
        "only in the docs chrome, so this falls through to Tailwind's own default " +
        "and stops being a multiple of the system's corner. Use rounded-xl, or " +
        "var(--opsin-radius-xl).",
      lineAt(starts, match.index),
    )
  }

  const chromeVariable =
    /(?<![\w-])--(secondary|accent|destructive|popover|sidebar|chart-[1-5]|radius-[234]xl|font-heading)(?:-[a-z-]+)?(?![\w-])/g
  while ((match = chromeVariable.exec(source)) !== null) {
    fail(
      "A11Y011",
      file,
      `\`${match[0]}\` is declared only in app/globals.css and resolves to nothing ` +
        "under /view. Everything a component may reach for is in app/product.css's " +
        "@theme inline block or in app/tokens.generated.css, which both stylesheets " +
        "import.",
      lineAt(starts, match.index),
    )
  }

  const heading = /(?<![\w-])font-heading(?![\w-])/g
  while ((match = heading.exec(source)) !== null) {
    fail(
      "A11Y011",
      file,
      "`font-heading` exists only in the docs chrome. The product theme has one " +
        "family - --opsin-font-sans, with --opsin-font-numeric for figures - and a " +
        "component that asks for a heading face gets no face at all.",
      lineAt(starts, match.index),
    )
  }

  const targetMin = /--opsin-target-min(?![\w-])/g
  while ((match = targetMin.exec(source)) !== null) {
    warn(
      "A11Y012",
      file,
      "`--opsin-target-min` is the authored name in app/product.css and is being " +
        "retired. The generated token is `--opsin-target-minimum` (2.75rem), and " +
        "the difference matters: the authored one is a hard 44px that does not " +
        "grow when the reader raises their text size, while the generated one is " +
        "rem and does.",
      lineAt(starts, match.index),
    )
  }
}

/* ------------------------------------------------------------------ *
 * The static half                                                     *
 * ------------------------------------------------------------------ */

async function staticChecks(): Promise<number> {
  const files: string[] = []
  for (const dir of SCAN_DIRS) {
    walk(dir, (name) => name.endsWith(".tsx") || name.endsWith(".ts"), files)
  }

  if (files.length === 0) {
    console.log(
      [
        "check-a11y: there is no component source under registry/ yet, so there is",
        "nothing to check.",
        "",
        "  That is the honest state of a design system whose components are specified",
        "  and not implemented, not a failure - and it is why this gate is wired in",
        "  now rather than when the first component lands: a gate added after the",
        "  code it governs is a gate written around the code it governs.",
        "",
        "  Exiting 0.",
      ].join("\n"),
    )
    return 0
  }

  const generated = await importModule("lib/generated/tokens.ts")
  const generatedBanned = generated?.BANNED_WORDS as { word: string; instead: string }[] | undefined
  if (!generatedBanned) {
    fail(
      "A11Y000",
      "lib/generated/tokens.ts",
      "BANNED_WORDS could not be read, so the banned-word rules cannot run. This " +
        "file is committed, so its absence means the tree is broken rather than " +
        "un-generated: run `pnpm run generate`. The check refuses to pass silently " +
        "with two of its rules disabled.",
    )
  }

  const statusModule = await importModule("lib/status.ts")
  const statusMeta = statusModule?.CLINICAL_STATUS_META as
    | Record<string, { word: string }>
    | undefined
  if (!statusMeta) {
    fail(
      "A11Y000",
      "lib/status.ts",
      "CLINICAL_STATUS_META could not be read, so the status-word rule cannot run. " +
        "lib/status.ts is the single status vocabulary and is written to be " +
        "loadable by plain node; if it has gained JSX or non-erasable syntax, that " +
        "is the defect.",
    )
  }

  /* The six additions are declared here only because tokens/glossary.json has
     no row for them yet. The moment somebody adds one, the generated list wins
     and the local copy drops out, so the same word is never linted twice under
     two different pieces of advice. */
  const generatedWords = new Set((generatedBanned ?? []).map((entry) => entry.word.toLowerCase()))
  const banned = [
    ...(generatedBanned ?? []),
    ...BANNED_ADDITIONS.filter((entry) => !generatedWords.has(entry.word)),
  ]
  const statusWords = Object.values(statusMeta ?? {}).map((meta) => meta.word)
  const statusLevels = Object.keys(statusMeta ?? {})

  for (const file of files) {
    const label = relative(APP_DIR, file).split(sep).join("/")
    let source: string
    try {
      source = readFileSync(file, "utf8")
    } catch (error) {
      fail("A11Y000", label, `could not be read - ${(error as Error).message}`)
      continue
    }
    const starts = lineStarts(source)
    const elements = jsxElements(source)

    if (statusMeta) {
      checkStatusCarriers(label, source, starts, elements, statusWords, statusLevels)
    }
    checkTypeSize(label, source, starts)
    checkColourLiterals(label, source, starts)
    checkAxisConflict(label, starts, [
      ...elements.map((element) => ({ ...element, noun: "This element" })),
      ...styleCallBodies(source).map((body) => ({ ...body, noun: "This class list" })),
    ])
    if (generatedBanned) checkBannedWords(label, source, starts, banned)
    checkViewPalette(label, source, starts)
    checkShippedThresholds(label, source, starts)
    checkUnownedIntervals(label, source, starts)
  }

  return files.length
}

/* ------------------------------------------------------------------ *
 * The layout half                                                     *
 * ------------------------------------------------------------------ */

/** The floor from accessibility/target-size-and-motor, and OPSIN-0015's own. */
const TARGET_FLOOR = 44

/**
 * The multiplier foundations/typography/dynamic-type states as the bar: "every
 * component must survive a 1.3x multiplier with no clipping, no truncation, no
 * overlap and no horizontal scroll", chosen because it is unremarkable, unlike
 * 200% which "tends to be treated as a stunt and therefore excused". It is not
 * one of the four ?text= steps, so the layout half sets the root font size
 * directly - which is the same mechanism [data-text-size] uses, at a value the
 * URL does not expose. Never transform: scale(), which cannot produce the
 * failure being tested for.
 */
const SURVIVAL_MULTIPLIER = 1.3

/** Phone first: this is where reflow bites and where the reader actually is. */
const LAYOUT_VIEWPORT = { width: 390, height: 844 }

interface LayoutTarget {
  name: string
  base: string
  style: string
  kind: string
}

interface OverflowReport {
  documentOverflow: number
  clipped: { slot: string; text: string; scroll: number; client: number }[]
  values: { slot: string; text: string; scroll: number; client: number; ellipsis: boolean }[]
}

interface HitAreaReport {
  tag: string
  slot: string
  label: string
  width: number
  height: number
}

async function loadPlaywright(): Promise<
  { chromium: { launch: (options?: unknown) => Promise<unknown> } } | undefined
> {
  for (const specifier of ["playwright", "playwright-core", "@playwright/test"]) {
    try {
      const mod = (await import(specifier)) as { chromium?: unknown }
      if (mod.chromium) {
        return mod as { chromium: { launch: (options?: unknown) => Promise<unknown> } }
      }
    } catch {
      /* not installed; try the next name */
    }
  }
  return undefined
}

async function loadTargets(): Promise<LayoutTarget[] | undefined> {
  const mod = await importModule("registry/__index__.ts")
  const index = mod?.REGISTRY_INDEX as Record<string, LayoutTarget & { component: unknown }> | undefined
  if (!index) return undefined
  return Object.values(index)
    .filter((entry) => entry.component !== null)
    .map((entry) => ({ name: entry.name, base: entry.base, style: entry.style, kind: entry.kind }))
}

async function serverIsUp(base: string): Promise<boolean> {
  try {
    const response = await fetch(base, { redirect: "follow" })
    return response.status < 500
  } catch {
    return false
  }
}

/*
 * Playwright is absent from every package.json by design, so there are no types
 * to import and none are invented. These three interfaces are the whole surface
 * this script uses, declared structurally and asserted at the call sites - the
 * same shape capture-registry.mts uses for the same reason. A wrong guess here
 * fails loudly on the first call rather than silently, because every one of them
 * is awaited.
 */
interface LayoutPage {
  goto: (url: string, options?: unknown) => Promise<unknown>
  waitForSelector: (selector: string, options?: unknown) => Promise<unknown>
  evaluate: (fn: (...args: never[]) => unknown, arg?: unknown) => Promise<unknown>
}

interface LayoutContext {
  newPage: () => Promise<unknown>
  close: () => Promise<void>
}

interface LayoutBrowser {
  newContext: (options: unknown) => Promise<unknown>
  close: () => Promise<void>
}

async function measurePage(
  page: LayoutPage,
): Promise<{ hits: HitAreaReport[]; overflow: OverflowReport }> {
  const hits = (await page.evaluate(() => {
    const root = document.querySelector("#opsin-view-root")
    if (!root) return []
    const selector = [
      "button",
      '[role="button"]',
      "a[href]",
      "input:not([type=hidden])",
      "select",
      "textarea",
      "summary",
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="tab"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(",")
    return [...root.querySelectorAll(selector)].map((node) => {
      const box = node.getBoundingClientRect()
      return {
        tag: node.tagName.toLowerCase(),
        slot: node.getAttribute("data-slot") ?? "",
        label:
          node.getAttribute("aria-label") ?? (node.textContent ?? "").trim().slice(0, 40),
        width: Math.round(box.width * 100) / 100,
        height: Math.round(box.height * 100) / 100,
      }
    })
  })) as HitAreaReport[]

  const overflow = (await page.evaluate(() => {
    const root = document.querySelector("#opsin-view-root")
    const describe = (node: Element) => ({
      slot: node.getAttribute("data-slot") ?? node.tagName.toLowerCase(),
      text: (node.textContent ?? "").trim().slice(0, 40),
      scroll: node.scrollWidth,
      client: node.clientWidth,
    })
    const clipped = root
      ? [...root.querySelectorAll("*")]
          .filter((node) => node.scrollWidth > node.clientWidth + 1 && node.clientWidth > 0)
          .map(describe)
          .slice(0, 12)
      : []
    const values = root
      ? [...root.querySelectorAll("[data-opsinjs-value]")].map((node) => ({
          ...describe(node),
          ellipsis: getComputedStyle(node).textOverflow === "ellipsis",
        }))
      : []
    return {
      documentOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      clipped,
      values,
    }
  })) as OverflowReport

  return { hits, overflow }
}

function reportOverflow(url: string, label: string, overflow: OverflowReport): void {
  if (overflow.documentOverflow > 1) {
    fail(
      "A11Y102",
      url,
      `At ${label} the document scrolls horizontally by ${overflow.documentOverflow}px. ` +
        "SC 1.4.10 is not met, and on a phone a horizontal scrollbar means part of " +
        "a reading is off-screen with nothing saying so.",
    )
  }
  for (const node of overflow.clipped) {
    fail(
      "A11Y102",
      url,
      `At ${label} \`${node.slot}\` clips its own content: scrollWidth ${node.scroll} ` +
        `against clientWidth ${node.client}${node.text ? ` ("${node.text}")` : ""}. ` +
        "A fixed height or a single-line assumption is the usual cause; use a " +
        "minimum height and let the content decide.",
    )
  }
  for (const value of overflow.values) {
    if (value.scroll <= value.client + 1 && !value.ellipsis) continue
    fail(
      "A11Y103",
      url,
      `At ${label} the value \`${value.slot}\`${value.text ? ` ("${value.text}")` : ""} ` +
        `is truncated - scrollWidth ${value.scroll} against clientWidth ${value.client}` +
        `${value.ellipsis ? ", with text-overflow: ellipsis" : ""}. A truncated ` +
        "health value is in the same class as a wrong one: the reader has no way " +
        "to know a digit is missing. Reflow to a single column instead.",
    )
  }
}

async function layoutChecks(base: string): Promise<void> {
  const playwright = await loadPlaywright()
  if (!playwright) {
    console.log(
      [
        "check-a11y: Playwright is not installed, so the layout half did not run.",
        "",
        "  This is expected everywhere except .github/workflows/nightly.yml, which",
        "  installs it at job time and is the only place it exists. Hit area, 1.3x",
        "  survival and 200% usability all need a layout engine, and a layout engine",
        "  is not something a documentation repository should carry in a manifest.",
        "",
        "  To measure locally, in a shell you are willing to dirty:",
        "    pnpm add -D playwright && pnpm exec playwright install chromium",
        "    pnpm run build && pnpm start &",
        "    node scripts/check-a11y.mts --layout --base http://127.0.0.1:4000",
        "",
        "  The static half still ran on every pull request. Exiting 0.",
      ].join("\n"),
    )
    return
  }

  const targets = await loadTargets()
  if (!targets) {
    console.log(
      "check-a11y: registry/__index__.ts could not be read. Run `pnpm run generate`\n" +
        "  first. Exiting 0.",
    )
    return
  }
  if (targets.length === 0) {
    console.log(
      [
        "check-a11y: nothing is built, so there is no layout to measure.",
        "",
        "  Every catalogue entry is specified and none is implemented, which is a",
        "  real state of the world rather than a failure. The first component to",
        "  land appears here on its own.",
        "",
        "  Exiting 0.",
      ].join("\n"),
    )
    return
  }

  if (!(await serverIsUp(base))) {
    console.log(
      [
        `check-a11y: nothing is listening at ${base}, so the layout half did not run.`,
        "",
        "  Start the site first:  pnpm run build && pnpm start",
        "",
        "  Exiting 0.",
      ].join("\n"),
    )
    return
  }

  const { viewPath } = (await importModule("lib/routes.ts")) as {
    viewPath?: (params: { name: string; kind?: string; base?: string; style?: string; text?: number }) => string
  }
  if (!viewPath) {
    console.log("check-a11y: lib/routes.ts did not export viewPath. Exiting 0.")
    return
  }

  const browser = (await playwright.chromium.launch()) as LayoutBrowser
  let measured = 0
  try {
    const context = (await browser.newContext({
      viewport: LAYOUT_VIEWPORT,
      reducedMotion: "reduce",
    })) as LayoutContext
    const page = (await context.newPage()) as LayoutPage

    for (const target of targets) {
      const url = `${base}${viewPath({
        name: target.name,
        kind: target.kind,
        base: target.base,
        style: target.style,
      })}`
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 })
        await page.waitForSelector('[data-opsin-view-state="ready"]', { timeout: 10_000 })
      } catch {
        fail(
          "A11Y100",
          url,
          "This target is built and its /view route never reached " +
            'data-opsin-view-state="ready" within 10s, so nothing could be ' +
            "measured. Either the route errored or the component threw during " +
            "render; neither is a passing state.",
        )
        continue
      }

      /* 1x: the hit-area floor. Measured at the border box, which IS the hit
         area unless the component expands it with a pseudo-element - and that
         is the one case this cannot see, so the number measured is reported
         rather than asserted about. */
      const first = await measurePage(page)
      for (const hit of first.hits) {
        if (hit.width >= TARGET_FLOOR && hit.height >= TARGET_FLOOR) continue
        fail(
          "A11Y101",
          url,
          `<${hit.tag}${hit.slot ? ` data-slot="${hit.slot}"` : ""}> renders a ` +
            `${hit.width}x${hit.height} hit area${hit.label ? ` ("${hit.label}")` : ""}. ` +
            `The floor is ${TARGET_FLOOR}x${TARGET_FLOOR}, applied to the hit area ` +
            "rather than to the visible box. That is OPSIN-0015, and it is above " +
            "the 24x24 of SC 2.5.8 on purpose: the reader of a consumer health app " +
            "is disproportionately likely to have a motor or a vision impairment. " +
            "If the hit area is expanded by a pseudo-element this measures the " +
            "visible box and is wrong - say so in the component's page.",
        )
      }
      reportOverflow(url, "1x", first.overflow)

      /* 1.3x: the bar the typography foundation actually states. */
      await page.evaluate((multiplier: number) => {
        document.documentElement.style.fontSize = `${multiplier * 100}%`
      }, SURVIVAL_MULTIPLIER)
      const scaled = await measurePage(page)
      reportOverflow(url, `${SURVIVAL_MULTIPLIER}x`, scaled.overflow)

      /* 200%: through the product's own ?text= mechanism, so what is measured is
         what a reader with that setting gets rather than what this script did
         to the document. */
      const doubled = `${base}${viewPath({
        name: target.name,
        kind: target.kind,
        base: target.base,
        style: target.style,
        text: 200,
      })}`
      try {
        await page.goto(doubled, { waitUntil: "networkidle", timeout: 20_000 })
        await page.waitForSelector('[data-opsin-view-state="ready"]', { timeout: 10_000 })
        reportOverflow(doubled, "200%", (await measurePage(page)).overflow)
      } catch {
        fail("A11Y100", doubled, "The 200% render never reached ready within 10s.")
      }

      measured += 1
    }
    await context.close()
  } finally {
    await browser.close()
  }

  console.log(
    `check-a11y: ${measured} target${measured === 1 ? "" : "s"} measured in a browser at ` +
      `${LAYOUT_VIEWPORT.width}x${LAYOUT_VIEWPORT.height}, at 1x, ${SURVIVAL_MULTIPLIER}x and 200%.`,
  )
}

/* ------------------------------------------------------------------ *
 * Main                                                                *
 * ------------------------------------------------------------------ */

function parseBase(): string {
  const index = process.argv.indexOf("--base")
  const fromArgv = index === -1 ? undefined : process.argv[index + 1]
  return (fromArgv ?? process.env.A11Y_BASE_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "")
}

async function main(): Promise<void> {
  const strict = process.argv.includes("--strict")
  const asJson = process.argv.includes("--json")
  const layout = process.argv.includes("--layout")

  let checked = 0
  if (layout) await layoutChecks(parseBase())
  else checked = await staticChecks()

  const errors = findings.filter((finding) => finding.level === "error")
  const warnings = findings.filter((finding) => finding.level === "warn")

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          $generatedBy: "scripts/check-a11y.mts",
          half: layout ? "layout" : "static",
          filesChecked: checked,
          totals: { errors: errors.length, warnings: warnings.length },
          findings,
        },
        null,
        2,
      ),
    )
    if (errors.length > 0 || (strict && warnings.length > 0)) process.exit(1)
    return
  }

  if (findings.length > 0) {
    console.log("")
    for (const finding of [...errors, ...warnings]) {
      const at = finding.line === undefined ? finding.where : `${finding.where}:${finding.line}`
      console.log(`${finding.level === "error" ? "ERROR" : "warn "}  ${finding.rule}  ${at}`)
      for (const line of wrap(finding.message, 76)) console.log(`       ${line}`)
    }
    console.log("")
  }

  if (!layout) {
    console.log(
      `check-a11y: ${checked} source file${checked === 1 ? "" : "s"} checked - ` +
        `${errors.length} error${errors.length === 1 ? "" : "s"}, ` +
        `${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`,
    )
  } else {
    console.log(
      `check-a11y: layout half - ${errors.length} error${errors.length === 1 ? "" : "s"}, ` +
        `${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`,
    )
  }

  if (errors.length > 0 || (strict && warnings.length > 0)) process.exit(1)
}

/** Soft-wrap a finding's paragraph so a long message stays readable in a log. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = []
  let current = ""
  for (const word of text.split(/\s+/)) {
    if (current === "") current = word
    else if (current.length + 1 + word.length <= width) current += ` ${word}`
    else {
      lines.push(current)
      current = word
    }
  }
  if (current !== "") lines.push(current)
  return lines
}

await main()
