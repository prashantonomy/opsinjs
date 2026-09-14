/**
 * check-contrast.mts - measures every opsinjs token pair with the hand-written
 * colour maths in lib/color/ and writes lib/generated/contrast.json.
 *
 *   node scripts/check-contrast.mts             # measure and write
 *   node scripts/check-contrast.mts --verify    # measure, write nothing, fail on a regression
 *   node scripts/check-contrast.mts --strict    # also fail when a required pair is below the floor
 *   node scripts/check-contrast.mts --selftest  # only check the maths against known answers
 *
 * THE SELF-TEST RUNS FIRST, ALWAYS. `--verify` compares fresh measurements
 * against a baseline this same code wrote, which proves reproducibility and
 * nothing else; a wrong formula would agree with itself forever. So every
 * invocation starts by checking the two models against answers that do not
 * come from this repository - see the self-test section for what is allowed to
 * be asserted there, and what emphatically is not.
 *
 * WHY BOTH NUMBERS. WCAG 2.2's ratio is what a procurement questionnaire and a
 * VPAT ask for. APCA's Lc models perceived lightness contrast far better at the
 * extremes, which is exactly where a clinical status colour lives - a bright
 * amber that passes 4.5:1 on paper can still be unreadable, and Lc is what says
 * so. They disagree, the disagreement is informative, and opsinjs publishes and
 * holds itself to both.
 *
 * NO NUMBER ON THIS SITE IS TYPED BY A HUMAN. Every contrast figure in the
 * documentation comes from this file and is rendered by <ContrastReport>. That
 * is the whole reason it exists: a contrast claim somebody typed is a claim
 * nobody ever rechecks.
 *
 * DEPENDENCIES: none. The OKLCH conversion, the APCA-W3 implementation, the WCAG
 * 2.2 ratio and the colour-vision simulation are all hand-written in lib/color/
 * (decision 10). This script consumes them and never reimplements them, because
 * two implementations of the same maths in one repository is how the published
 * numbers and the runtime numbers drift apart.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/check-contrast.mts needs Node 24 or newer.",
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
import { fileURLToPath, pathToFileURL } from "node:url"

const APP_DIR = fileURLToPath(new URL("../", import.meta.url))
const OUT_FILE = join(APP_DIR, "lib", "generated", "contrast.json")

/** How far a number may move between runs before `--verify` calls it a change. */
const TOLERANCE = 0.05

/**
 * The page a mark is measured against when it is not on a tinted surface.
 *
 * A category accent is a chart line or a legend dot on the page itself, so the
 * page is what it has to be distinguishable from. This is the chrome background
 * role, which is what app/product.css renders as the page, so the measured page
 * is the rendered page. The token carries its own light and dark values, so one
 * name resolves per theme, and re-tuning the chrome role re-tunes the
 * measurement with it.
 */
const PAGE = { light: "--opsin-chrome-background", dark: "--opsin-chrome-background" }

/*
 * The two other grounds a neutral role actually lands on. A card is the surface
 * a health card and its footnotes render on, and the muted ground is the Callout
 * fill and the RangeBar track. Secondary text sits on all three, so the pair set
 * has to measure it on all three or a role that clears the body floor on the page
 * and misses it on a card ships an unreadable footnote that the gate never sees.
 * These are the chrome card and chrome muted roles, the same tokens product.css
 * renders, each carrying its own light and dark value.
 */
const CARD_GROUND = { light: "--opsin-chrome-card", dark: "--opsin-chrome-card" }
const MUTED_GROUND = { light: "--opsin-chrome-muted", dark: "--opsin-chrome-muted" }

/**
 * The neutral text and boundary values, which swap ends of the ramp between
 * themes. A dark grey ink is body text on a white page and is invisible on a
 * near-black one, so measuring a fixed step against a theme-aware page would
 * manufacture a failure that no reader will ever see. Each role is measured
 * against the page, the card and the muted ground, because secondary text lands
 * on all three and a body pair must clear the floor on every ground it renders on.
 */
const NEUTRAL_ROLES: Array<{
  id: string
  label: string
  use: Use
  light: string
  dark: string
  advisory?: boolean
  exempt?: boolean
}> = [
  {
    id: "ink",
    label: "body text on the page",
    use: "body",
    light: "--opsin-neutral-900",
    dark: "--opsin-neutral-100",
  },
  {
    id: "ink-secondary",
    label: "secondary text on the page",
    use: "body",
    light: "--opsin-neutral-600",
    dark: "--opsin-neutral-300",
  },
  {
    /*
     * Advisory, and it is the one hairline that stays advisory. SC 1.4.11 covers
     * graphics that carry meaning, and a hairline between two list rows does not:
     * it is a grouping cue at neutral-300, and removing it loses tidiness rather
     * than information. Two other boundaries DO carry meaning and are gated, not
     * advisory. The border of a surface at `attention` or `urgent` is the `line`
     * role, measured and gated. The card hairline is the other: material.json
     * makes the card rung deliberately shadowless and bounded by a line, so that
     * line is the only elevation cue a card has, which is why border-on-page and
     * border-on-card below are gated rather than left advisory like this row.
     */
    id: "hairline",
    label: "a hairline boundary on the page",
    use: "nonText",
    light: "--opsin-neutral-300",
    dark: "--opsin-neutral-700",
    advisory: true,
  },
  {
    id: "placeholder-line",
    label: "a placeholder boundary on the page",
    use: "nonText",
    light: "--opsin-neutral-500",
    dark: "--opsin-neutral-400",
  },
  {
    /*
     * Advisory, and it must stay advisory, for the same kind of reason the
     * hairline above does but pointing the other way. The placeholder fill is
     * the body of a loading block, and a fill that cleared the 3:1 non-text
     * floor against the page would be a dark solid rectangle sitting exactly
     * where a reading is about to arrive. That is the very reading the whole
     * Skeleton component exists to refuse to assert before the data lands, so
     * the boundary is what is gated and the fill is published as a measured
     * number rather than held to a floor it is designed not to reach. It is
     * therefore exempt from the sub-floor gate, not merely advisory: --strict
     * must not read this fill as a token to darken, which is the same footing
     * `surfaces.band-fill-on-page` is given for the same reason.
     */
    id: "placeholder-fill",
    label: "a placeholder fill on the page",
    use: "nonText",
    light: "--opsin-neutral-200",
    dark: "--opsin-neutral-700",
    advisory: true,
    exempt: true,
  },
]

/**
 * Material rungs that never carry text. A scrim is a dimmer: its whole job is
 * to sit between a reader and what is behind it, and measuring body text on it
 * would report a failure for a surface nothing is written on.
 */
const NON_TEXT_RUNGS = ["scrim"]

/**
 * The ink measured against each material rung.
 *
 * material.json's `contrastFloor.measuredAgainst` is `worstCaseComposite`, and
 * this is the other half of that pair: body text on a material is the page's own
 * text colour, not a tinted ink. How the surface behind that ink is produced
 * depends on the rung. For an opaque rung (tintAlpha 1) the surface is the tint
 * itself, so the ink is measured against the opaque fallback, one row per rung.
 * For a translucent rung the surface a reader sees is the tint composited at its
 * own alpha over whatever scrolls behind it, so measuring against the opaque
 * fallback would publish the flattering figure rather than the honest one: a
 * light tint over dark content is at its lightest, and so at its kindest to dark
 * ink, exactly when the fallback is the fill. buildPairs composites each
 * translucent rung's tint over the darkest and the lightest backdrop the product
 * can produce and measures the ink against both, so overlay and sheet publish
 * two real worst-case figures rather than one copy of the fallback.
 */
const MATERIAL_INK = { light: "--opsin-neutral-900", dark: "--opsin-neutral-100" }

/**
 * The two backdrops a translucent rung is composited over before its ink is
 * measured, the darkest and the lightest ground the product can produce. These
 * are material.json's `contrastFloor.backdrops`, held here as the two neutral
 * steps they name so a re-tune of the ladder ends moves the measured worst case
 * with it. They are absolute grounds rather than theme-aware roles: an overlay
 * floats over content that may be dark or light in either theme.
 */
const COMPOSITE_BACKDROP = { dark: "--opsin-neutral-950", light: "--opsin-neutral-0" }

/** Returns the body of the first block whose selector matches `opener`, brace-matched. */
function extractCssBlock(css: string, opener: RegExp): string | undefined {
  const match = opener.exec(css)
  if (!match) return undefined
  const open = css.indexOf("{", match.index)
  if (open === -1) return undefined
  let depth = 0
  for (let index = open; index < css.length; index += 1) {
    const char = css[index]
    if (char === "{") depth += 1
    else if (char === "}") {
      depth -= 1
      if (depth === 0) return css.slice(open + 1, index)
    }
  }
  return undefined
}

/**
 * The chrome roles a chart is drawn on, read straight from app/product.css.
 *
 * Everything else this script measures comes from lib/generated/tokens.ts, but
 * `--background`, `--muted`, `--muted-foreground` and `--ring` live only in the
 * theme stylesheet, and a chart band drawn in `fill-muted` over the page, or a
 * focus ring drawn on a status surface, is a real pairing a reader meets that no
 * token pair covers. Only opaque roles are taken: `--muted-foreground` is
 * authored as `var(--opsin-neutral-*)`, which valueOf resolves through the token
 * map, `--ring` is a raw oklch in both themes, and `--border` is deliberately
 * left out because its dark value carries an alpha channel and compositing it
 * here would be a second copy of the colour maths this file is forbidden to hold.
 *
 * Reading these roles makes app/product.css an input to a published number.
 * lib/generated/contrast.json is written by `pnpm run contrast`, which
 * `pnpm check` does not run, so a theme edit that moves one of these roles can
 * leave the published figures stale without `check:generated` noticing. After a
 * theme edit, run `pnpm run contrast` and commit the result.
 */
function readProductCssRoles(): Record<Theme, Record<string, string>> {
  const result: Record<Theme, Record<string, string>> = { light: {}, dark: {} }
  let css: string
  try {
    css = readFileSync(join(APP_DIR, "app", "product.css"), "utf8")
  } catch {
    return result
  }
  const blocks: Record<Theme, string | undefined> = {
    light: extractCssBlock(css, /\.opsin-product\s*\{/),
    dark: extractCssBlock(css, /\.dark\s*\{/),
  }
  const roles = ["background", "muted", "muted-foreground", "ring"]
  for (const theme of ["light", "dark"] as Theme[]) {
    const block = blocks[theme]
    if (!block) continue
    for (const role of roles) {
      const declaration = new RegExp(`(?:^|[;{\\s])--${role}\\s*:\\s*([^;]+);`).exec(block)
      if (declaration) result[theme][role] = (declaration[1] as string).trim()
    }
  }
  return result
}

const PRODUCT_CSS_ROLES: Record<Theme, Record<string, string>> = readProductCssRoles()

/* ------------------------------------------------------------------ *
 * Types                                                               *
 * ------------------------------------------------------------------ */

type Use = "body" | "large" | "nonText"
type Theme = "light" | "dark"

interface GeneratedToken {
  name: string
  cssVar: string
  namespace: string
  tier: string
  group: string
  value: string
  darkValue?: string
  resolvedValue?: string
  darkResolvedValue?: string
  description: string
}

interface PairDefinition {
  /** Stable id: `status.urgent.ink-on-surface`. */
  id: string
  /** Human name: "urgent ink on urgent surface". */
  pair: string
  /** `status` | `category` | `neutral` | `materials` | `surfaces`. What <ContrastReport scope> filters on. */
  scope: string
  use: Use
  foreground: string
  background: string
  /**
   * Advisory pairs are measured and reported but are not gated. `accent` is the
   * identity fill: color.json says outright that it is chosen for recognition
   * rather than for contrast, and that it must be bounded by `line` or labelled
   * in `ink`. Gating it would force a choice between an honest identity colour
   * and a green build, and the honest answer is to publish the number and say
   * what carries the meaning instead.
   */
  advisory?: boolean
  /**
   * Exempt pairs are genuinely OUTSIDE the non-text floor's scope, which is a
   * different claim from advisory. Advisory means measured and reported but not
   * part of the regression baseline; a below-floor accent is still a fact the
   * gate should surface. Exempt means the floor does not apply at all, because
   * the colour is not the sole carrier of the mark: a fill identified by its
   * edge, a scrim, or a ring bounded by the control's own outline. Only these
   * are kept out of the sub-floor gate, so an accent stays advisory but not
   * exempt and a sub-floor accent still fails --strict.
   */
  exempt?: boolean
}

interface MeasuredPair {
  id: string
  pair: string
  scope: string
  theme: Theme
  use: Use
  foreground: string
  foregroundValue: string
  background: string
  backgroundValue: string
  /** Signed APCA Lc: positive is dark ink on a light surface. */
  apcaLc: number
  /** WCAG 2.2 relative-luminance contrast ratio. */
  wcag: number
  apcaFloor: number
  wcagFloor: number
  passes: boolean
  advisory: boolean
  /** Genuinely outside the non-text floor's scope, not merely advisory. */
  exempt: boolean
  /** Which method, if either, the pair falls short of. */
  failing: string[]
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

function round(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

async function importModule(relativePath: string): Promise<Record<string, unknown> | undefined> {
  const file = join(APP_DIR, relativePath)
  if (!exists(file)) return undefined
  try {
    return (await import(pathToFileURL(file).href)) as Record<string, unknown>
  } catch (error) {
    console.warn(`check-contrast: ${relativePath} could not be imported - ${(error as Error).message}`)
    return undefined
  }
}

function pick<T>(
  mod: Record<string, unknown> | undefined,
  names: string[],
): T | undefined {
  if (!mod) return undefined
  for (const name of names) {
    const candidate = mod[name]
    if (candidate !== undefined) return candidate as T
  }
  return undefined
}

/* ------------------------------------------------------------------ *
 * Self-test: known-answer and structural assertions                   *
 *                                                                     *
 * WHY THIS EXISTS. `--verify` proves the published numbers are        *
 * REPRODUCIBLE, which is not the same as proving they are right. It   *
 * recomputes every pair with lib/color/ and diffs the result against  *
 * a baseline the same code wrote, so a wrong formula is wrong         *
 * identically on both sides of that diff and the gate stays green     *
 * while every Lc and ratio on the site carries the error. This runs   *
 * first, and closes the loop with answers that do not come from this  *
 * repository's own output.                                            *
 *                                                                     *
 * WHAT MAY BE ASSERTED HERE. Only two kinds of claim. DEFINITIONAL:   *
 * it falls straight out of the published formula, like               *
 * (1 + 0.05) / (0 + 0.05) = 21 for black on white, or a pure primary  *
 * at full intensity having exactly its own WCAG channel coefficient   *
 * as its relative luminance. STRUCTURAL: a property lib/color/apca.ts *
 * states about itself in its own header - Lc is signed, it is         *
 * directional, and it clamps to zero near zero.                       *
 *                                                                     *
 * Nothing here may be a fitted APCA constant or a figure recalled     *
 * from memory. Lc 106.04 for black on white is a real published       *
 * number, but typing it in from recall would make this file assert an *
 * unchecked human figure, which is the exact failure the rest of the  *
 * script exists to abolish. If someone wants the decimals pinned,     *
 * they belong in a vector file quoting APCA-W3 0.1.9 by version and   *
 * constant set, not in a fixer's memory.                              *
 * ------------------------------------------------------------------ */

/** Either colour form the assertions below use. */
type SelfTestColor = string | [number, number, number]

interface SelfTestFailure {
  /** What was claimed, in the terms the reader of a failing build needs. */
  readonly claim: string
  /** The measurement that contradicted it. */
  readonly detail: string
}

/** Floating-point slack. Every assertion here is exact maths, so this is tight. */
const SELF_TEST_EPSILON = 1e-9

async function runSelfTest(): Promise<{
  ran: boolean
  checks: number
  failures: SelfTestFailure[]
}> {
  const apcaMod = await importModule(join("lib", "color", "apca.ts"))
  const wcagMod = await importModule(join("lib", "color", "wcag.ts"))

  const apcaContrast = pick<(text: SelfTestColor, background: SelfTestColor) => number>(
    apcaMod,
    ["apcaContrast", "apca", "apcaLc"],
  )
  const contrastRatio = pick<(a: SelfTestColor, b: SelfTestColor) => number>(wcagMod, [
    "contrastRatio",
    "wcag",
    "wcagContrast",
  ])
  const relativeLuminance = pick<(color: SelfTestColor) => number>(wcagMod, [
    "relativeLuminance",
  ])

  /* The main path already explains a missing lib/color/ and exits 0 rather
     than replacing measurements with silence. Do not turn that into a hard
     failure here: absent maths is a different state from wrong maths. */
  if (!apcaContrast || !contrastRatio || !relativeLuminance) {
    return { ran: false, checks: 0, failures: [] }
  }

  const failures: SelfTestFailure[] = []
  let checks = 0

  const equals = (claim: string, actual: number, expected: number): void => {
    checks += 1
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > SELF_TEST_EPSILON) {
      failures.push({ claim, detail: `expected ${expected}, measured ${actual}` })
    }
  }
  const holds = (claim: string, condition: boolean, detail: string): void => {
    checks += 1
    if (!condition) failures.push({ claim, detail })
  }

  /* ---- WCAG 2.2, definitional ---- */

  equals("relative luminance of black is 0", relativeLuminance("#000000"), 0)
  equals("relative luminance of white is 1", relativeLuminance("#ffffff"), 1)

  /* A pure primary at full intensity has a linearised channel of exactly 1, so
     its relative luminance is its own WCAG coefficient. This is the assertion
     that catches a red/blue channel swap, which no amount of self-consistent
     re-measurement ever would. */
  equals("full-intensity red carries the WCAG red coefficient", relativeLuminance("#ff0000"), 0.2126)
  equals("full-intensity green carries the WCAG green coefficient", relativeLuminance("#00ff00"), 0.7152)
  equals("full-intensity blue carries the WCAG blue coefficient", relativeLuminance("#0000ff"), 0.0722)

  equals("black on white is 21:1", contrastRatio("#000000", "#ffffff"), 21)
  equals("white on black is also 21:1 - the ratio is symmetric", contrastRatio("#ffffff", "#000000"), 21)
  equals("a colour against itself is 1:1", contrastRatio("#0b6bcb", "#0b6bcb"), 1)
  equals("white against itself is 1:1", contrastRatio("#ffffff", "#ffffff"), 1)
  equals(
    "argument order does not change a WCAG ratio",
    contrastRatio("#123456", "#abcdef") - contrastRatio("#abcdef", "#123456"),
    0,
  )

  /* Notation, not formula: the same colour written three ways must measure the
     same. lib/color/oklch.ts's parser sits under every published figure and a
     silent mis-parse would land as a plausible wrong number. */
  equals("shorthand hex parses to the same colour", contrastRatio("#000", "#fff"), 21)
  equals("an sRGB triple parses to the same colour", contrastRatio([0, 0, 0], [255, 255, 255]), 21)
  equals("rgb() notation parses to the same colour", contrastRatio("rgb(0 0 0)", "#ffffff"), 21)

  holds(
    "a mid grey on white sits between the two extremes",
    contrastRatio("#777777", "#ffffff") > 1 && contrastRatio("#777777", "#ffffff") < 21,
    `measured ${contrastRatio("#777777", "#ffffff")}`,
  )
  holds(
    "an unparseable colour yields NaN rather than a plausible number",
    Number.isNaN(contrastRatio("not-a-colour", "#ffffff")),
    `measured ${contrastRatio("not-a-colour", "#ffffff")}`,
  )

  /* ---- APCA-W3, structural ---- */

  const darkOnLight = apcaContrast("#000000", "#ffffff")
  const lightOnDark = apcaContrast("#ffffff", "#000000")

  holds("Lc is positive for dark text on a light background", darkOnLight > 0, `measured ${darkOnLight}`)
  holds("Lc is negative for light text on a dark background", lightOnDark < 0, `measured ${lightOnDark}`)
  holds(
    "Lc is directional: swapping text and background is not a sign flip",
    Math.abs(darkOnLight + lightOnDark) > SELF_TEST_EPSILON,
    `black-on-white ${darkOnLight}, white-on-black ${lightOnDark}`,
  )
  equals("a colour against itself is Lc 0", apcaContrast("#777777", "#777777"), 0)
  equals(
    "a difference below the clamp reports Lc 0 rather than a small number",
    apcaContrast("#fefefe", "#ffffff"),
    0,
  )
  holds(
    "a mid grey on white has less lightness contrast than black on white",
    Math.abs(apcaContrast("#777777", "#ffffff")) < Math.abs(darkOnLight),
    `grey ${apcaContrast("#777777", "#ffffff")}, black ${darkOnLight}`,
  )
  holds(
    "an unparseable colour yields NaN rather than a plausible Lc",
    Number.isNaN(apcaContrast("not-a-colour", "#ffffff")),
    `measured ${apcaContrast("not-a-colour", "#ffffff")}`,
  )

  return { ran: true, checks, failures }
}

/* ------------------------------------------------------------------ *
 * Pair construction                                                   *
 *                                                                     *
 * Every chromatic ramp has four roles and color.json defines what each *
 * is for, so the pairs follow from the definitions rather than from a  *
 * list somebody maintains by hand:                                     *
 *                                                                      *
 *   ink    on surface   body text        gated                         *
 *   line   on surface   a boundary       gated at the non-text floor    *
 *   accent on surface   identity fill    advisory                       *
 *   accent on the page  a chart mark     advisory                       *
 *   ink    on the page  text off-surface gated                          *
 * ------------------------------------------------------------------ */

const ROLE_PATTERN = /^--opsin-(category|status)-([a-z0-9-]+)-(surface|line|ink|accent)$/

function buildPairs(tokens: GeneratedToken[]): PairDefinition[] {
  const byVar = new Map(tokens.map((token) => [token.cssVar, token]))
  const ramps = new Map<string, { axis: string; name: string; roles: Map<string, string> }>()

  for (const token of tokens) {
    const match = ROLE_PATTERN.exec(token.cssVar)
    if (!match) continue
    const [, axis, name, role] = match as unknown as [string, string, string, string]
    const key = `${axis}.${name}`
    const ramp = ramps.get(key) ?? { axis, name, roles: new Map<string, string>() }
    ramp.roles.set(role, token.cssVar)
    ramps.set(key, ramp)
  }

  const pairs: PairDefinition[] = []

  for (const [key, ramp] of [...ramps.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const surface = ramp.roles.get("surface")
    const scope = ramp.axis === "status" ? "status" : "category"

    if (surface) {
      const ink = ramp.roles.get("ink")
      if (ink) {
        pairs.push({
          id: `${key}.ink-on-surface`,
          pair: `${ramp.name} ink on ${ramp.name} surface`,
          scope,
          use: "body",
          foreground: ink,
          background: surface,
        })
      }
      const line = ramp.roles.get("line")
      if (line) {
        pairs.push({
          id: `${key}.line-on-surface`,
          pair: `${ramp.name} line on ${ramp.name} surface`,
          scope,
          use: "nonText",
          foreground: line,
          background: surface,
        })
      }
      const accent = ramp.roles.get("accent")
      if (accent) {
        pairs.push({
          id: `${key}.accent-on-surface`,
          pair: `${ramp.name} accent on ${ramp.name} surface`,
          scope,
          use: "nonText",
          foreground: accent,
          background: surface,
          advisory: true,
        })
      }
      /*
       * The level's ink on the level's accent, for status ramps only, and gated
       * rather than advisory. This is a component-composed pairing rather than a
       * ramp pairing: ScoreDial draws the indicator in `text-status-<level>-ink`
       * and, when the score falls in a tinted band, that indicator crosses the
       * `text-status-<level>-accent` band it sits on, which is the pairing
       * score-dial.mdx lists as unmeasured. The indicator is the only mark that
       * shows position, so the non-text floor applies to it: it is not advisory
       * and it is not exempt. A level below Lc 45 here is a real finding to
       * report, not a flag to tune away. `unknown` is left out, the same
       * exclusion the card and neutral-on-surface blocks make below: it is an
       * absence rather than a level, ScoreDial's DialStatus and BAND_TONE never
       * reach it, and no component paints a `--opsin-status-unknown-accent` band
       * for an indicator to cross.
       */
      if (ramp.axis === "status" && ramp.name !== "unknown" && ink && accent) {
        pairs.push({
          id: `${key}.ink-on-accent`,
          pair: `${ramp.name} ink on the ${ramp.name} band`,
          scope: "status",
          use: "nonText",
          foreground: ink,
          background: accent,
        })
      }
    }

    const accentOnPage = ramp.roles.get("accent")
    if (accentOnPage) {
      pairs.push({
        id: `${key}.accent-on-page`,
        pair: `${ramp.name} accent on the page`,
        scope,
        use: "nonText",
        foreground: accentOnPage,
        background: "@page",
        advisory: true,
      })
    }

    const inkOnPage = ramp.roles.get("ink")
    if (inkOnPage) {
      pairs.push({
        id: `${key}.ink-on-page`,
        pair: `${ramp.name} ink on the page`,
        scope,
        use: "body",
        foreground: inkOnPage,
        background: "@page",
      })
    }

    /* A category chart line drawn over the muted band a TrendSparkline shades.
       The band's fill is a tint that does not carry the line, so the line has to
       clear the non-text floor against the band, not only against the page. */
    const lineOnBand = ramp.axis === "category" ? ramp.roles.get("line") : undefined
    if (lineOnBand) {
      pairs.push({
        id: `${key}.line-on-band`,
        pair: `${ramp.name} line on the band`,
        scope,
        use: "nonText",
        foreground: lineOnBand,
        background: "@surface:muted",
      })
    }
  }

  /*
   * The chart band on the neutral surface, read from app/product.css. A
   * TrendSparkline shades a reference band in `fill-muted`, and its edge is
   * SPECIFIED to move to a dashed `--muted-foreground` in trendsparkline-03.b.
   * These two edge rows are the floor that change is held to, not a measurement
   * of what ships today: trend-sparkline.tsx still draws the edge with
   * `stroke-border`, whose `--border` measures the 1.29:1 the finding reported,
   * so read these numbers as the target for 03.b rather than as the shipped
   * edge. The edge is what carries the band, so both edge rows are gated at the
   * non-text floor; the fill stays advisory, the same reasoning the hairline
   * role carries, because the band is identified by its edge and by the caption
   * naming its two numbers and its source, not by a fill that sits near the page.
   */
  if (PRODUCT_CSS_ROLES.light.muted && PRODUCT_CSS_ROLES.dark.muted) {
    pairs.push({
      id: "surfaces.band-fill-on-page",
      pair: "the band fill on the page",
      scope: "surfaces",
      use: "nonText",
      foreground: "@surface:muted",
      background: "@surface:background",
      advisory: true,
      /* Exempt, not merely advisory: the band is identified by its edge and its
         caption, never by a fill that sits a fraction above the page, so the
         non-text floor does not apply to the fill and it stays out of the
         sub-floor gate. The edge rows below are gated. */
      exempt: true,
    })
    pairs.push({
      id: "surfaces.band-edge-on-page",
      pair: "the band edge on the page",
      scope: "surfaces",
      use: "nonText",
      foreground: "@surface:muted-foreground",
      background: "@surface:background",
    })
    pairs.push({
      id: "surfaces.band-edge-on-band",
      pair: "the band edge on the band",
      scope: "surfaces",
      use: "nonText",
      foreground: "@surface:muted-foreground",
      background: "@surface:muted",
    })
  }

  /* The neutral ramp: text and boundaries on the page, per theme. */
  for (const role of NEUTRAL_ROLES) {
    if (!byVar.has(role.light) || !byVar.has(role.dark)) continue
    pairs.push({
      id: `neutral.${role.id}-on-page`,
      pair: role.label,
      scope: "neutral",
      use: role.use,
      foreground: `@${role.id}`,
      background: "@page",
      advisory: role.advisory,
      exempt: role.exempt,
    })
    pairs.push({
      id: `neutral.${role.id}-on-card`,
      pair: role.label.replace("on the page", "on a card"),
      scope: "neutral",
      use: role.use,
      foreground: `@${role.id}`,
      background: "@card",
      advisory: role.advisory,
      exempt: role.exempt,
    })
    pairs.push({
      id: `neutral.${role.id}-on-muted`,
      pair: role.label.replace("on the page", "on the muted ground"),
      scope: "neutral",
      use: role.use,
      foreground: `@${role.id}`,
      background: "@muted",
      advisory: role.advisory,
      exempt: role.exempt,
    })
  }

  /*
   * The placeholder boundary against the placeholder fill, which is the edge a
   * reader actually sees on a loading block: the line role sitting on the fill
   * role, rather than either one against the page. It is gated at the non-text
   * floor because this boundary is what a Skeleton relies on to read as a
   * bounded shape rather than a solid rectangle, and product.css already states
   * the two ratios (3.84:1 light, 4.01:1 dark) by hand. This push makes the rig
   * produce them so the page cites a measured number rather than a calculator's.
   */
  if (
    byVar.has("--opsin-neutral-500") &&
    byVar.has("--opsin-neutral-400") &&
    byVar.has("--opsin-neutral-200") &&
    byVar.has("--opsin-neutral-700")
  ) {
    pairs.push({
      id: "neutral.placeholder-line-on-fill",
      pair: "a placeholder boundary on its own fill",
      scope: "neutral",
      use: "nonText",
      foreground: "@placeholder-line",
      background: "@placeholder-fill",
    })
  }

  /*
   * The card hairline and the focus ring, gated at last. Both are now chrome
   * tokens the generator emits (D5), so the audited boundary is the rendered
   * boundary. The hairline is gated, not advisory, because material.json makes
   * the card rung deliberately shadowless and bounded by a line, so on a card
   * that line is the only elevation cue a reader has and it has to clear the
   * non-text floor. The light border clears both floors; the dark border on a
   * near-black page sits below the APCA non-text floor while clearing WCAG 3:1,
   * and that shortfall is stated in app/product.css rather than tuned away,
   * because no opaque neutral step reaches the floor there without reading as a
   * heavy stripe. Gating it still earns its place: it catches any drift in the
   * light theme, and it stops the border silently lightening again.
   */
  const CHROME_BORDER = "--opsin-chrome-border"
  const CHROME_RING = "--opsin-chrome-ring"
  if (byVar.has(CHROME_BORDER)) {
    pairs.push({
      id: "neutral.border-on-page",
      pair: "the card hairline on the page",
      scope: "neutral",
      use: "nonText",
      foreground: CHROME_BORDER,
      background: "@page",
    })
    pairs.push({
      id: "neutral.border-on-card",
      pair: "the card hairline on a card",
      scope: "neutral",
      use: "nonText",
      foreground: CHROME_BORDER,
      background: "@card",
    })
  }
  /*
   * The focus ring on the two neutral grounds it lands on. shape.json says the
   * ring is always measured against both the surface and the page, and until now
   * nothing measured it at all. These two are gated: both clear the non-text
   * floor in both themes, the dark pairs only one to two Lc above it, so a drift
   * that drops the ring below the floor becomes a real failure rather than a
   * silent one. The ring measured on each status tint is the ring-on-surface row
   * built below, which stays advisory for the reason D5 records: the ring is
   * bounded by the control's own edge and drawn at an outline offset, so the
   * tint is not its only carrier, and the dark ring chroma is a question for the
   * human rather than a value this file tunes.
   */
  if (byVar.has(CHROME_RING)) {
    pairs.push({
      id: "chrome.ring-on-background",
      pair: "the focus ring on the page",
      scope: "chrome",
      use: "nonText",
      foreground: CHROME_RING,
      background: "@page",
    })
    pairs.push({
      id: "chrome.ring-on-card",
      pair: "the focus ring on a card",
      scope: "chrome",
      use: "nonText",
      foreground: CHROME_RING,
      background: "@card",
    })
  }

  /*
   * Materials. An opaque rung is measured against its opaque fallback, the one
   * surface it ever shows. A translucent rung is measured twice, against its tint
   * composited over the darkest backdrop and against its tint composited over the
   * lightest, because the fallback is not the surface it renders and is not its
   * worst case. Translucency is read from the rung's tint-alpha token per theme:
   * a rung whose alpha is below 1 in either theme is translucent. The `@composite`
   * background is resolved per theme in valueOf, where the colour maths lives.
   */
  for (const token of tokens) {
    if (!token.cssVar.endsWith("-opaque") || token.group !== "material") continue
    const rung = token.cssVar.replace("--opsin-material-", "").replace("-opaque", "")
    if (NON_TEXT_RUNGS.includes(rung)) continue
    const alphaToken = byVar.get(`--opsin-material-${rung}-tint-alpha`)
    const lightAlpha = alphaToken ? Number.parseFloat(alphaToken.value) : 1
    const darkAlpha =
      alphaToken && alphaToken.darkValue !== undefined
        ? Number.parseFloat(alphaToken.darkValue)
        : lightAlpha
    const translucent = lightAlpha < 1 || darkAlpha < 1
    if (!translucent) {
      pairs.push({
        id: `materials.${rung}.ink`,
        pair: `body text on the ${rung} material`,
        scope: "materials",
        use: "body",
        foreground: "@ink",
        background: token.cssVar,
      })
      continue
    }
    pairs.push({
      id: `materials.${rung}.ink-over-dark`,
      pair: `body text on the ${rung} material over the darkest backdrop`,
      scope: "materials",
      use: "body",
      foreground: "@ink",
      background: `@composite:${rung}:dark`,
    })
    pairs.push({
      id: `materials.${rung}.ink-over-light`,
      pair: `body text on the ${rung} material over the lightest backdrop`,
      scope: "materials",
      use: "body",
      foreground: "@ink",
      background: `@composite:${rung}:light`,
    })
  }

  /*
   * The card pairings a MetricTile actually renders, measured against the card
   * material rather than against each ramp's own surface, because a tile draws
   * both on the card. Two shapes:
   *
   *   category ink on card   the tinted label, which is text and must clear the
   *                          body floor, so it is gated. This is the pairing the
   *                          MetricTile finding is about: in dark theme the -ink
   *                          tokens lose their chroma, so the number this row
   *                          publishes is what the token fix is held to.
   *
   *   status surface on card the tint behind a StatusPill on the tile. It is
   *                          advisory, not gated, and the reason is the one the
   *                          accent role already carries above and the band fill
   *                          carries in the surfaces scope: a tint is an identity
   *                          fill, not the carrier of the level. The pill is a
   *                          distinct object by its line role and its word, so a
   *                          tint that sits near the card is a published number
   *                          rather than a failed gate. Gating a by-design tint
   *                          would also make it a NEW AND FAILING pair that fails
   *                          `--verify`, which is why the band fill next door is
   *                          advisory too. `unknown` is not a clinical level and
   *                          is left out.
   */
  const CARD = "--opsin-material-card-opaque"
  if (byVar.has(CARD)) {
    for (const [key, ramp] of [...ramps.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (ramp.axis === "category") {
        const ink = ramp.roles.get("ink")
        if (ink) {
          pairs.push({
            id: `${key}.ink-on-card`,
            pair: `${ramp.name} ink on the card material`,
            scope: "category",
            use: "body",
            foreground: ink,
            background: CARD,
          })
        }
      } else if (ramp.axis === "status" && ramp.name !== "unknown") {
        const surface = ramp.roles.get("surface")
        if (surface) {
          pairs.push({
            id: `${key}.surface-on-card`,
            pair: `${ramp.name} surface on the card material`,
            scope: "status",
            use: "nonText",
            foreground: surface,
            background: CARD,
            advisory: true,
            /* Exempt: a status tint on a card is an identity fill, not the
               carrier of the level. The StatusPill on it is a distinct object by
               its line role and its word, so the non-text floor does not apply to
               the tint and it stays out of the sub-floor gate. */
            exempt: true,
          })
        }
      }
    }
  }

  /*
   * Neutral chrome on a status surface, the pairs alert-banner.mdx has been
   * listing as "not yet checked at all". A banner draws two neutral roles that
   * sit on the level's own tint and that no ramp-internal pair covers:
   *
   *   ring on surface   the focus ring a keyboard user lands on the banner's
   *                     controls with. It is measured and published but left
   *                     advisory, the same footing the accent fill and the band
   *                     fill carry: the ring is bounded by the control's own
   *                     edge and drawn at the browser's outline offset away from
   *                     the surface, so the tint is not its only carrier. The
   *                     dark `--ring` is what falls short of the non-text floor
   *                     against the tint, at APCA Lc around -43 while clearing
   *                     WCAG 3:1, and D5 records the dark `--ring` chroma as a
   *                     question for the human rather than a value this file may
   *                     tune. So this row reports the number instead of gating on
   *                     it, which is the honest floor rather than a manufactured
   *                     pass or a red build.
   *
   *   ink on muted      the level's own ink read while a pointer sits on a
   *                     control and paints the neutral hover fill under it. It is
   *                     text, so it is gated at the body floor.
   *
   * `unknown` is not a clinical level and is left out, the same exclusion the
   * card pairings make above. The neutral hover fill and the control fill
   * themselves are deliberately NOT gated here: a fill is not a boundary, it
   * measures near 1:1 against the tint, and gating it would manufacture a
   * failure rather than report one.
   */
  const ringAvailable = Boolean(PRODUCT_CSS_ROLES.light.ring && PRODUCT_CSS_ROLES.dark.ring)
  const mutedAvailable = Boolean(PRODUCT_CSS_ROLES.light.muted && PRODUCT_CSS_ROLES.dark.muted)
  for (const [key, ramp] of [...ramps.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (ramp.axis !== "status" || ramp.name === "unknown") continue
    const surface = ramp.roles.get("surface")
    const ink = ramp.roles.get("ink")
    if (surface && ringAvailable) {
      pairs.push({
        id: `${key}.ring-on-surface`,
        pair: `the focus ring on the ${ramp.name} surface`,
        scope: "status",
        use: "nonText",
        foreground: "@surface:ring",
        background: surface,
        advisory: true,
        /* Exempt: the ring is bounded by the control's own edge and drawn at an
           outline offset, so the tint is not its only carrier and the non-text
           floor does not apply to the ring against the tint. The dark ring
           chroma is a question for the human (D5), not a value this gate forces.
           ring-on-background and ring-on-card stay gated. */
        exempt: true,
      })
    }
    if (ink && mutedAvailable) {
      pairs.push({
        id: `${key}.ink-on-muted`,
        pair: `${ramp.name} ink on the neutral hover fill`,
        scope: "status",
        use: "body",
        foreground: ink,
        background: "@surface:muted",
      })
    }
  }

  return pairs
}

/* ------------------------------------------------------------------ *
 * Main                                                                *
 * ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const verify = process.argv.includes("--verify")
  const strict = process.argv.includes("--strict")
  const selftestOnly = process.argv.includes("--selftest")

  /* Before anything is measured, before any baseline is read. A formula that
     fails here has already published wrong numbers, and continuing on to diff
     them against themselves would report success. */
  const selfTest = await runSelfTest()
  if (selfTest.failures.length > 0) {
    console.error(
      [
        "",
        `check-contrast: the colour maths failed ${selfTest.failures.length} of ${selfTest.checks} known-answer checks.`,
        "",
        ...selfTest.failures.flatMap((failure) => [
          `  ${failure.claim}`,
          `    ${failure.detail}`,
        ]),
        "",
        "  Fix lib/color/, not this check. Every contrast figure on the site comes",
        "  from those two modules, so a failure here means the published numbers are",
        "  wrong and lib/generated/contrast.json agrees with them.",
        "",
      ].join("\n"),
    )
    process.exit(1)
  }
  if (selftestOnly) {
    console.log(
      selfTest.ran
        ? `check-contrast --selftest: ${selfTest.checks} known-answer checks passed.`
        : "check-contrast --selftest: lib/color/ is not available, so nothing was checked.",
    )
    return
  }

  const generated = await importModule(join("lib", "generated", "tokens.ts"))
  const tokens = (pick<GeneratedToken[]>(generated, ["TOKENS", "tokens"]) ?? []).filter(
    (token) => token.namespace === "color" || token.group === "material",
  )
  const meta = pick<{ sourceHash?: string }>(generated, ["TOKEN_META"]) ?? {}

  if (tokens.length === 0) {
    console.warn(
      [
        "check-contrast: lib/generated/tokens.ts has no colour tokens yet, so nothing",
        "  was measured and lib/generated/contrast.json was left untouched. Run",
        "  `pnpm run generate` first.",
        "",
        "  Exiting 0: an unmeasured system is not a failing one, and this script never",
        "  writes a number it did not compute.",
      ].join("\n"),
    )
    return
  }

  const apcaMod = await importModule(join("lib", "color", "apca.ts"))
  const wcagMod = await importModule(join("lib", "color", "wcag.ts"))
  const oklchMod = await importModule(join("lib", "color", "oklch.ts"))
  const cvdMod = await importModule(join("lib", "color", "cvd.ts"))

  /* The composite helpers, used only to resolve a `@composite` background. The
     maths lives in lib/color/oklch.ts and is never reimplemented here. */
  type Colour = { l: number; c: number; h: number; alpha?: number }
  const compositeOver = pick<(foreground: Colour, backdrop: Colour, alpha: number) => Colour>(
    oklchMod,
    ["compositeOver"],
  )
  const parseOklch = pick<(input: string) => Colour | null>(oklchMod, [
    "parseColor",
    "parseCssColor",
  ])
  const formatOklch = pick<(color: Colour, places?: number) => string>(oklchMod, ["formatOklch"])

  const apcaContrast = pick<(a: string, b: string) => number>(apcaMod, [
    "apcaContrast",
    "apca",
    "apcaLc",
  ])
  const contrastRatio = pick<(a: string, b: string) => number>(wcagMod, [
    "contrastRatio",
    "wcag",
    "wcagContrast",
  ])
  const apcaFloor = pick<Record<Use, number>>(apcaMod, ["APCA_FLOOR"]) ?? {
    body: 75,
    large: 60,
    nonText: 45,
  }
  const wcagFloorRaw = pick<Record<string, number>>(wcagMod, ["WCAG_FLOOR"]) ?? {}
  const wcagFloor: Record<Use, number> = {
    body: wcagFloorRaw.bodyAA ?? 4.5,
    large: wcagFloorRaw.largeAA ?? 3,
    nonText: wcagFloorRaw.nonTextAA ?? 3,
  }

  if (!apcaContrast || !contrastRatio) {
    console.warn(
      [
        "check-contrast: the colour maths in lib/color/ is not available, so no contrast",
        "  was measured and lib/generated/contrast.json was left untouched.",
        "  Needed: lib/color/apca.ts -> apcaContrast(text, background)",
        "          lib/color/wcag.ts -> contrastRatio(a, b)",
        "",
        "  Exiting 0. Writing an empty result here would replace real measurements with",
        "  silence, which is worse than reporting nothing.",
      ].join("\n"),
    )
    return
  }

  const byVar = new Map(tokens.map((token) => [token.cssVar, token]))
  const valueOf = (cssVar: string, theme: Theme): string | undefined => {
    if (cssVar === "@page") return valueOf(PAGE[theme], theme)
    if (cssVar === "@card") return valueOf(CARD_GROUND[theme], theme)
    if (cssVar === "@muted") return valueOf(MUTED_GROUND[theme], theme)
    if (cssVar === "@ink") return valueOf(MATERIAL_INK[theme], theme)
    if (cssVar.startsWith("@surface:")) {
      const role = cssVar.slice("@surface:".length)
      const raw = PRODUCT_CSS_ROLES[theme][role]
      if (!raw) return undefined
      /* A chrome role authored as var(--opsin-neutral-*) is resolved through the
         token map, the same route every other cssVar takes. */
      if (raw.startsWith("var(")) {
        const inner = /var\(\s*(--[a-z0-9-]+)/i.exec(raw)
        return inner ? valueOf(inner[1] as string, theme) : undefined
      }
      return raw.startsWith("var(") ? undefined : raw
    }
    if (cssVar.startsWith("@composite:")) {
      /* @composite:<rung>:<backdrop>. The tint composited at its own per-theme
         alpha over the named absolute ground, source-over in linear sRGB. */
      const parts = cssVar.split(":")
      const rung = parts[1] as string
      const backdrop = parts[2] as "dark" | "light"
      if (!compositeOver || !parseOklch || !formatOklch) return undefined
      const groundVar = COMPOSITE_BACKDROP[backdrop]
      const tint = valueOf(`--opsin-material-${rung}-tint`, theme)
      const alphaRaw = valueOf(`--opsin-material-${rung}-tint-alpha`, theme)
      const ground = groundVar ? valueOf(groundVar, theme) : undefined
      if (!tint || !alphaRaw || !ground) return undefined
      const alpha = Number.parseFloat(alphaRaw)
      const fg = parseOklch(tint)
      const bg = parseOklch(ground)
      if (!fg || !bg || !Number.isFinite(alpha)) return undefined
      return formatOklch(compositeOver(fg, bg, alpha))
    }
    if (cssVar.startsWith("@")) {
      const role = NEUTRAL_ROLES.find((candidate) => `@${candidate.id}` === cssVar)
      if (role) return valueOf(role[theme], theme)
      return undefined
    }
    const token = byVar.get(cssVar)
    if (!token) return undefined
    const value =
      theme === "dark"
        ? (token.darkResolvedValue ?? token.darkValue ?? token.resolvedValue ?? token.value)
        : (token.resolvedValue ?? token.value)
    return value.startsWith("var(") ? undefined : value
  }
  const labelOf = (cssVar: string, theme: Theme): string => {
    if (cssVar === "@page") return PAGE[theme]
    if (cssVar === "@card") return CARD_GROUND[theme]
    if (cssVar === "@muted") return MUTED_GROUND[theme]
    if (cssVar === "@ink") return MATERIAL_INK[theme]
    if (cssVar.startsWith("@composite:")) {
      const parts = cssVar.split(":")
      const ground = COMPOSITE_BACKDROP[parts[2] as "dark" | "light"] ?? parts[2]
      return `--opsin-material-${parts[1]}-tint over ${ground}`
    }
    if (cssVar.startsWith("@surface:")) return `--${cssVar.slice("@surface:".length)}`
    const role = NEUTRAL_ROLES.find((candidate) => `@${candidate.id}` === cssVar)
    return role ? role[theme] : cssVar
  }

  const definitions = buildPairs(tokens)
  const measured: MeasuredPair[] = []
  const unmeasurable: string[] = []

  for (const definition of definitions) {
    for (const theme of ["light", "dark"] as Theme[]) {
      const foregroundValue = valueOf(definition.foreground, theme)
      const backgroundValue = valueOf(definition.background, theme)
      if (!foregroundValue || !backgroundValue) {
        unmeasurable.push(`${definition.id} (${theme})`)
        continue
      }
      let apcaLc: number
      let wcag: number
      try {
        apcaLc = apcaContrast(foregroundValue, backgroundValue)
        wcag = contrastRatio(foregroundValue, backgroundValue)
      } catch (error) {
        unmeasurable.push(`${definition.id} (${theme}): ${(error as Error).message}`)
        continue
      }
      if (!Number.isFinite(apcaLc) || !Number.isFinite(wcag)) {
        unmeasurable.push(`${definition.id} (${theme}): non-finite result`)
        continue
      }

      const failing: string[] = []
      if (Math.abs(apcaLc) < apcaFloor[definition.use]) {
        failing.push(`APCA Lc ${apcaFloor[definition.use]}`)
      }
      if (wcag < wcagFloor[definition.use]) failing.push(`WCAG ${wcagFloor[definition.use]}:1`)

      measured.push({
        id: definition.id,
        pair: definition.pair,
        scope: definition.scope,
        theme,
        use: definition.use,
        foreground: labelOf(definition.foreground, theme),
        foregroundValue,
        background: labelOf(definition.background, theme),
        backgroundValue,
        apcaLc: round(apcaLc, 2),
        wcag: round(wcag, 2),
        apcaFloor: apcaFloor[definition.use],
        wcagFloor: wcagFloor[definition.use],
        passes: failing.length === 0,
        advisory: definition.advisory === true,
        exempt: definition.exempt === true,
        failing,
      })
    }
  }

  /*
   * The colour-independence audit. Doctrine says two things, and this section
   * turns both into measurements. First, a status must survive grayscale, so a
   * reader who has lost hue can still rank the four levels. Second, the two axes
   * never mix on one ELEMENT, but they do meet on one SCREEN: a reader sees a
   * single tinted card on its own, not beside a reference swatch, so a category
   * surface that collapses onto a status surface under a simulation is precisely
   * the confusion the never-mix rule exists to forbid. The earlier version of
   * this code argued the opposite and projected only the accent swatch, so a
   * whole tinted card being unreadable as one axis or the other was never tested.
   * A collision is not automatically a defect: every status also carries an icon
   * and a word, which is the point of the rule. It is a defect of the COLOUR to
   * do the job alone, and the accessibility pages say so with these numbers.
   */
  const findCollisions = pick<
    (swatches: Record<string, unknown>, types?: unknown, threshold?: number) => unknown[]
  >(cvdMod, ["findCollisions"])
  const parseColor = pick<(input: string) => unknown>(oklchMod, ["parseColor", "parseCssColor"])
  const collapseThreshold = pick<number>(cvdMod, ["COLLAPSE_THRESHOLD"]) ?? 15

  /*
   * Passes one and two, one per axis. These stay the right test for "can a
   * reader rank the four status levels once hue is gone", and the same for the
   * six category ramps. Every role is now projected, not the accent alone: a
   * whole card is tinted with the surface role and a chart mark is drawn in the
   * accent role, so a surface-onto-surface collapse is the one a reader actually
   * meets. Each swatch is keyed by name and role, so a nutrition surface is told
   * apart from a nutrition accent. The same swatches, keyed with their axis, feed
   * the cross-axis pass below.
   */
  let collisions: unknown[] = []
  const crossSwatches: Record<string, unknown> = {}
  if (findCollisions && parseColor) {
    for (const axis of ["status", "category"]) {
      const swatches: Record<string, unknown> = {}
      for (const token of tokens) {
        const match = ROLE_PATTERN.exec(token.cssVar)
        if (!match || match[1] !== axis) continue
        const parsed = parseColor(token.resolvedValue ?? token.value)
        if (!parsed) continue
        swatches[`${match[2]}-${match[3]}`] = parsed
        crossSwatches[`${axis}:${match[2]}-${match[3]}`] = parsed
      }
      if (Object.keys(swatches).length < 2) continue
      try {
        const found = findCollisions(swatches) as Array<Record<string, unknown>>
        collisions = collisions.concat(found.map((entry) => ({ axis, ...entry })))
      } catch (error) {
        console.warn(
          `check-contrast: the CVD audit for the ${axis} axis failed - ${(error as Error).message}`,
        )
      }
    }
  }

  /*
   * Pass three, across the two axes, and the palette-level statement of the
   * never-mix rule. One swatch set holds every category role and every status
   * role; any pair drawn from opposite axes that collapses below the threshold
   * is a hard finding, because it is a category identity a reader can misread as
   * a clinical level or the reverse. Same-axis pairs are dropped here, since
   * passes one and two already own them, and the threshold is the one cvd.ts
   * publishes rather than a second copy of the number.
   */
  let crossAxisCollisions: unknown[] = []
  if (findCollisions && Object.keys(crossSwatches).length >= 2) {
    try {
      const found = findCollisions(crossSwatches) as Array<Record<string, unknown>>
      crossAxisCollisions = found.filter((entry) => {
        const axisA = String(entry.a).split(":")[0]
        const axisB = String(entry.b).split(":")[0]
        return axisA !== axisB
      })
    } catch (error) {
      console.warn(
        `check-contrast: the cross-axis CVD audit failed - ${(error as Error).message}`,
      )
    }
  }

  const required = measured.filter((pair) => !pair.advisory)
  const failures = required.filter((pair) => !pair.passes)
  const advisoryFailures = measured.filter((pair) => pair.advisory && !pair.passes)
  /*
   * The advisory pairs that are non-text marks a reader has to see and that are
   * NOT exempt from the floor: an accent dot, a hairline that groups meaning. An
   * accent below Lc 45 is advisory for the regression baseline but it is still a
   * mark a reader must tell from its ground, so it belongs in this set and it
   * fails --strict. Exempt pairs (a fill carried by its edge, a scrim, a ring
   * bounded by its own outline) are outside the floor's scope and are dropped
   * here. This is the set finding product-theme-and-tokens-15 exists to gate: a
   * published "failing: 0" beside a dozen sub-floor accents is not a lie a reader
   * can detect, so the fix is a counted field and a gate, not a footnote.
   */
  const subFloorNonText = advisoryFailures.filter(
    (pair) => pair.use === "nonText" && !pair.exempt,
  )
  const scopes = [...new Set(measured.map((pair) => pair.scope))].sort()

  if (unmeasurable.length > 0) {
    console.warn(
      [
        `check-contrast: ${unmeasurable.length} pair(s) could not be measured:`,
        ...unmeasurable.slice(0, 10).map((line) => `    ${line}`),
      ].join("\n"),
    )
  }

  /* ---------------- verify ---------------- */
  if (verify) {
    /* TWO STATES THAT LOOK ALIKE AND ARE NOT. A tree that has never been
       measured has no baseline and nothing to compare against, which is a real
       zero state; a baseline that exists but cannot be read is a broken gate,
       and it must not exit 0. lib/generated/contrast.json is written by
       `pnpm run contrast` and NOT by `pnpm run generate`, so `check:generated`
       never regenerates it and a corrupt committed baseline is invisible to
       every other check - this exit is the only thing that reports it. */
    const baselineExists = exists(OUT_FILE)
    let previous: { pairs?: MeasuredPair[] } | undefined
    let unreadable: string | undefined
    if (baselineExists) {
      try {
        previous = JSON.parse(readFileSync(OUT_FILE, "utf8")) as { pairs?: MeasuredPair[] }
      } catch (error) {
        unreadable = (error as Error).message
      }
    }

    if (!baselineExists) {
      console.warn(
        "check-contrast --verify: there are no committed measurements to compare against.\n" +
          "  Run `pnpm run contrast` and commit lib/generated/contrast.json first.",
      )
      return
    }

    if (
      unreadable !== undefined ||
      !previous ||
      !Array.isArray(previous.pairs) ||
      previous.pairs.length === 0
    ) {
      console.error(
        [
          "check-contrast --verify: the committed baseline is unusable.",
          `  lib/generated/contrast.json ${
            unreadable !== undefined ? `is not valid JSON - ${unreadable}` : "parses but carries no pairs"
          }.`,
          "",
          "  This is not the same as never having measured. A baseline that exists and",
          "  cannot be read means this run compared nothing against nothing, and passing",
          "  would make every night after it green regardless of what contrast does.",
          "",
          "  Restore the file from git, or run `pnpm run contrast` and commit the result",
          "  deliberately - it is written by that command, not by `pnpm run generate`,",
          "  so `check:generated` will not rebuild it for you.",
        ].join("\n"),
      )
      process.exit(1)
    }

    const committed = previous?.pairs ?? []
    const before = new Map(committed.map((pair) => [`${pair.id}:${pair.theme}`, pair]))
    const regressions: string[] = []

    for (const pair of measured) {
      const key = `${pair.id}:${pair.theme}`
      const old = before.get(key)
      if (!old) {
        if (!pair.passes && !pair.advisory) {
          regressions.push(
            `  NEW AND FAILING  ${key} - APCA Lc ${pair.apcaLc}, WCAG ${pair.wcag}:1, below ${pair.failing.join(" and ")}`,
          )
        }
        continue
      }
      before.delete(key)
      if (old.passes && !pair.passes && !pair.advisory) {
        regressions.push(
          `  REGRESSED        ${key} - was passing, now below ${pair.failing.join(" and ")} ` +
            `(APCA Lc ${old.apcaLc} to ${pair.apcaLc}, WCAG ${old.wcag}:1 to ${pair.wcag}:1)`,
        )
        continue
      }
      if (
        Math.abs(old.apcaLc - pair.apcaLc) > TOLERANCE ||
        Math.abs(old.wcag - pair.wcag) > TOLERANCE
      ) {
        regressions.push(
          `  MOVED            ${key} - APCA Lc ${old.apcaLc} to ${pair.apcaLc}, ` +
            `WCAG ${old.wcag}:1 to ${pair.wcag}:1, and lib/generated/contrast.json was not regenerated`,
        )
      }
    }
    for (const [key] of before) {
      regressions.push(`  DISAPPEARED      ${key} - measured before, not measured now`)
    }

    if (regressions.length > 0) {
      console.error(
        [
          `check-contrast --verify: ${regressions.length} problem(s).`,
          ...regressions,
          "",
          "  A contrast regression is a published number becoming untrue. Fix the token,",
          "  or - if the change is intended - run `pnpm run contrast` and commit the new",
          "  measurements so the documentation says what the system actually does.",
        ].join("\n"),
      )
      process.exit(1)
    }
    console.log(
      `check-contrast --verify: ${measured.length} pairs, no regressions ` +
        `(${failures.length} known failure${failures.length === 1 ? "" : "s"}).`,
    )
    return
  }

  /* ---------------- write ---------------- */
  const payload = {
    $comment:
      "GENERATED FILE - DO NOT EDIT. Source: tokens/color.json and tokens/material.json via lib/generated/tokens.ts, plus the chrome roles --background, --muted, --muted-foreground and --ring read from app/product.css, measured with lib/color/{apca,wcag,cvd}.ts. Generator: scripts/check-contrast.mts (`pnpm run contrast`). Gate: `pnpm run contrast:verify` fails the build on a regression. Every published APCA Lc and WCAG ratio on this site comes from this file, and none of them was typed by a person. The figures describe the shipped opsinjs presets only: a theme derived from your own brand colour has its own numbers and must be measured with your own values.",
    generatedAt: new Date().toISOString().slice(0, 10),
    sourceHash: meta.sourceHash ?? "unknown",
    toolVersion: {
      apca: "APCA-W3 constants, implemented in lib/color/apca.ts",
      wcag: "WCAG 2.2 relative luminance, implemented in lib/color/wcag.ts",
      cvd: "Dichromacy projection, implemented in lib/color/cvd.ts",
    },
    floor: {
      body: { apcaLc: apcaFloor.body, wcag: wcagFloor.body },
      large: { apcaLc: apcaFloor.large, wcag: wcagFloor.large },
      nonText: { apcaLc: apcaFloor.nonText, wcag: wcagFloor.nonText },
    },
    scopes,
    pairs: measured,
    cvd: { collapseThresholdLc: collapseThreshold, collisions, crossAxisCollisions },
    // A TRUE PARTITION of `measured`, asserted below. `passing`, `failing` and
    // `advisory` cover every measured pair exactly once, so the three add to
    // `total`. Counting `passing` over advisory pairs too, as an earlier version
    // did, made the summary read "115 pass, 0 fail, 46 advisory" over 126 pairs
    // and not add up, and a contrast report that cannot do arithmetic is worse
    // than no report.
    //
    // `advisoryFailing` and `subFloor` are SUBSETS layered on top of the
    // partition, not partition members, which is why the guard below reads only
    // the first three keys for the sum and then checks the subsets against it.
    // The partition alone cannot say the one thing a reader most needs to know.
    // `advisoryFailing` is every advisory pair below its floor. `subFloor` is the
    // part of that which is a non-text mark still in the floor's scope, the
    // accents and hairlines a reader has to tell from their ground, with the
    // genuinely exempt fills and rings removed. That distinction is the whole of
    // finding product-theme-and-tokens-15: a published "failing: 0" beside a
    // dozen sub-floor accents is not a lie a reader can detect from the summary,
    // and the honest fix is a counted field that --strict gates on, not a
    // footnote under a green badge. `subFloor` is a field, so a future token
    // change that drives any accent further down is a number that moves in the
    // published summary rather than a silent step below the floor.
    summary: {
      total: measured.length,
      passing: required.filter((pair) => pair.passes).length,
      failing: failures.length,
      advisory: measured.filter((pair) => pair.advisory).length,
      advisoryFailing: advisoryFailures.length,
      subFloor: subFloorNonText.length,
    },
  }

  const { total, passing, failing, advisory, advisoryFailing, subFloor } = payload.summary
  if (passing + failing + advisory !== total) {
    throw new Error(
      `check-contrast: summary is not a partition - ${passing} pass + ${failing} fail + ` +
        `${advisory} advisory = ${passing + failing + advisory}, but ${total} pairs were measured. ` +
        `Refusing to publish a contrast report that does not add up.`,
    )
  }
  /* The two subsets have to sit inside the sets they are drawn from, or the
     summary is incoherent even though the partition adds up: every advisory
     failure is an advisory pair, and every sub-floor pair is an advisory
     failure. A count that breaks either containment is a bug in this file, not a
     fact about the palette, so it throws rather than publishes. */
  if (advisoryFailing > advisory || subFloor > advisoryFailing) {
    throw new Error(
      `check-contrast: summary subsets do not nest - ${subFloor} sub-floor within ` +
        `${advisoryFailing} advisory-failing within ${advisory} advisory. ` +
        `Refusing to publish a contrast report whose parts do not add up.`,
    )
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  const contents = `${JSON.stringify(payload, null, 2)}\n`
  let changed = true
  try {
    changed = readFileSync(OUT_FILE, "utf8") !== contents
  } catch {
    changed = true
  }
  if (changed) writeFileSync(OUT_FILE, contents, "utf8")

  console.log(
    [
      `check-contrast: ${measured.length} pairs across both themes in ${scopes.length} scopes - ` +
        `${payload.summary.passing} pass, ${payload.summary.failing} fail, ` +
        `${payload.summary.advisory} advisory` +
        (advisoryFailures.length > 0
          ? ` (${advisoryFailures.length} of the advisory pairs measure below the floor).`
          : "."),
      `  ${changed ? "wrote    " : "unchanged"} lib/generated/contrast.json`,
      ...failures
        .slice(0, 20)
        .map(
          (pair) =>
            `  FAIL      ${pair.id} (${pair.theme}) - APCA Lc ${pair.apcaLc}, ` +
            `WCAG ${pair.wcag}:1, below ${pair.failing.join(" and ")}`,
        ),
      failures.length > 20 ? `  ... and ${failures.length - 20} more` : "",
      ...advisoryFailures
        .slice(0, 6)
        .map(
          (pair) =>
            `  advisory  ${pair.id} (${pair.theme}) - APCA Lc ${pair.apcaLc}. ` +
            `An accent is an identity fill, not a contrast carrier; it must be bounded or labelled.`,
        ),
      collisions.length > 0
        ? `  CVD: ${collisions.length} within-axis pair(s) collapse below Lc ${collapseThreshold} under a simulation. ` +
          `Colour alone does not separate them - the word and the icon do.`
        : "",
      crossAxisCollisions.length > 0
        ? `  CVD CROSS-AXIS: ${crossAxisCollisions.length} category/status pair(s) collapse below Lc ${collapseThreshold}. ` +
          `A category identity and a clinical level share a colour once hue is gone; this fails --strict.`
        : "",
    ]
      .filter((line) => line !== "")
      .join("\n"),
  )

  if (
    strict &&
    (failures.length > 0 || subFloorNonText.length > 0 || crossAxisCollisions.length > 0)
  ) {
    const strictLines: string[] = [""]
    if (failures.length > 0) {
      strictLines.push(
        "check-contrast --strict: a required token pair is below the published floor.",
        "  Change the token, not the floor - the floor is what the accessibility pages",
        "  promise, and it is published as a commitment rather than as an aspiration.",
      )
    }
    if (subFloorNonText.length > 0) {
      strictLines.push(
        `check-contrast --strict: ${subFloorNonText.length} advisory non-text pair(s) are below the non-text floor of APCA Lc 45 and WCAG 3:1.`,
        "  These are accents and hairlines a reader has to tell from their ground, not the",
        "  fills and rings exempt from the floor. Advisory keeps them out of the regression",
        "  baseline; it does not put them outside the floor. Raise the token so the mark",
        "  clears Lc 45 and 3:1, and if a role genuinely cannot carry meaning by colour,",
        "  mark the pair exempt and say on the page what carries it instead.",
        ...subFloorNonText
          .slice(0, 12)
          .map(
            (pair) =>
              `    sub-floor  ${pair.id} (${pair.theme}) - APCA Lc ${pair.apcaLc}, WCAG ${pair.wcag}:1`,
          ),
      )
    }
    if (crossAxisCollisions.length > 0) {
      strictLines.push(
        `check-contrast --strict: ${crossAxisCollisions.length} category/status pair(s) collapse under a colour-vision simulation.`,
        "  The two axes must not be tellable apart by colour alone. Re-tune the ramps so a",
        "  category surface never lands on a status surface once hue is removed, then re-run.",
      )
    }
    console.error(strictLines.join("\n"))
    process.exit(1)
  }
}

await main()
