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
 * page is what it has to be distinguishable from. These are the two ends of the
 * neutral ramp, named rather than hardcoded so that re-tuning the ramp re-tunes
 * the measurement with it.
 */
const PAGE = { light: "--opsin-neutral-0", dark: "--opsin-neutral-950" }

/**
 * The neutral text and boundary values, which swap ends of the ramp between
 * themes. A dark grey ink is body text on a white page and is invisible on a
 * near-black one, so measuring a fixed step against a theme-aware page would
 * manufacture a failure that no reader will ever see.
 */
const NEUTRAL_ROLES: Array<{
  id: string
  label: string
  use: Use
  light: string
  dark: string
  advisory?: boolean
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
     * Advisory. SC 1.4.11 covers graphics that carry meaning, and a hairline
     * between two list rows does not: it is a grouping cue, and removing it
     * loses tidiness rather than information. A boundary that DOES carry
     * meaning - the border of a surface at `attention` or `urgent` - is the
     * `line` role, and that one is measured and gated.
     */
    id: "hairline",
    label: "a hairline boundary on the page",
    use: "nonText",
    light: "--opsin-neutral-300",
    dark: "--opsin-neutral-700",
    advisory: true,
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
 * material.json's `contrastFloor.measuredAgainst` is `opaqueFallback`, and this
 * is the other half of that pair: body text on a material is the page's own
 * text colour, not a tinted ink. Measuring against the opaque fallback rather
 * than the translucent tint is deliberate - it is the value a reader actually
 * gets under prefers-reduced-transparency and on every browser without
 * backdrop-filter, so it is the honest floor rather than the flattering one.
 */
const MATERIAL_INK = { light: "--opsin-neutral-900", dark: "--opsin-neutral-100" }

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
  /** `status` | `category` | `neutral` | `materials`. What <ContrastReport scope> filters on. */
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
    })
  }

  /* Materials, measured against the opaque fallback rather than the tint. */
  for (const token of tokens) {
    if (!token.cssVar.endsWith("-opaque") || token.group !== "material") continue
    const rung = token.cssVar.replace("--opsin-material-", "").replace("-opaque", "")
    if (NON_TEXT_RUNGS.includes(rung)) continue
    pairs.push({
      id: `materials.${rung}.ink`,
      pair: `body text on the ${rung} material`,
      scope: "materials",
      use: "body",
      foreground: "@ink",
      background: token.cssVar,
    })
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
    if (cssVar === "@ink") return valueOf(MATERIAL_INK[theme], theme)
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
    if (cssVar === "@ink") return MATERIAL_INK[theme]
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
        failing,
      })
    }
  }

  /* The colour-independence audit. Doctrine says a status must survive
     grayscale; this is what turns that into a measurement. A collision is not
     automatically a defect - every status also carries an icon and a word, which
     is the entire point of the rule - but it is a defect of the COLOUR to do the
     job alone, and the accessibility pages say so with these numbers. */
  const findCollisions = pick<
    (swatches: Record<string, unknown>, types?: unknown, threshold?: number) => unknown[]
  >(cvdMod, ["findCollisions"])
  const parseColor = pick<(input: string) => unknown>(oklchMod, ["parseColor", "parseCssColor"])
  const collapseThreshold = pick<number>(cvdMod, ["COLLAPSE_THRESHOLD"]) ?? 15

  /* Run per axis, not across both. The two axes never appear on one element, so
     a "collision" between a category accent and a status accent is not a finding
     about anything a reader will ever see side by side. */
  let collisions: unknown[] = []
  if (findCollisions && parseColor) {
    for (const axis of ["status", "category"]) {
      const swatches: Record<string, unknown> = {}
      for (const token of tokens) {
        const match = ROLE_PATTERN.exec(token.cssVar)
        if (!match || match[1] !== axis || match[3] !== "accent") continue
        const parsed = parseColor(token.resolvedValue ?? token.value)
        if (parsed) swatches[match[2] as string] = parsed
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

  const required = measured.filter((pair) => !pair.advisory)
  const failures = required.filter((pair) => !pair.passes)
  const advisoryFailures = measured.filter((pair) => pair.advisory && !pair.passes)
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
      "GENERATED FILE - DO NOT EDIT. Source: tokens/color.json and tokens/material.json via lib/generated/tokens.ts, measured with lib/color/{apca,wcag,cvd}.ts. Generator: scripts/check-contrast.mts (`pnpm run contrast`). Gate: `pnpm run contrast:verify` fails the build on a regression. Every published APCA Lc and WCAG ratio on this site comes from this file, and none of them was typed by a person. The figures describe the shipped opsinjs presets only: a theme derived from your own brand colour has its own numbers and must be measured with your own values.",
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
    cvd: { collapseThresholdLc: collapseThreshold, collisions },
    // A TRUE PARTITION of `measured`, asserted below. The earlier version counted
    // `passing` over every pair that cleared its floor - advisory pairs included -
    // while also counting those same pairs under `advisory`, so the published
    // summary read "126 pairs: 115 pass, 0 fail, 46 advisory" and did not add up.
    // A contrast report that cannot do arithmetic is worse than no report.
    //
    // `advisoryFailing` is a SUBSET of `advisory` and deliberately outside the
    // partition, which is why the assertion below still reads only the four
    // keys above it. It exists because the partition alone cannot say the one
    // thing a reader most wants to know: an advisory pair is not gated, but it
    // is still measured, and some of them sit below the floor. Publishing
    // "46 advisory" over a table containing measured floor misses is arithmetic
    // that adds up and a report that misleads.
    summary: {
      total: measured.length,
      passing: required.filter((pair) => pair.passes).length,
      failing: failures.length,
      advisory: measured.filter((pair) => pair.advisory).length,
      advisoryFailing: advisoryFailures.length,
    },
  }

  const { total, passing, failing, advisory } = payload.summary
  if (passing + failing + advisory !== total) {
    throw new Error(
      `check-contrast: summary is not a partition - ${passing} pass + ${failing} fail + ` +
        `${advisory} advisory = ${passing + failing + advisory}, but ${total} pairs were measured. ` +
        `Refusing to publish a contrast report that does not add up.`,
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
        ? `  CVD: ${collisions.length} accent pair(s) collapse below Lc ${collapseThreshold} under a simulation. ` +
          `Colour alone does not separate them - the word and the icon do.`
        : "",
    ]
      .filter((line) => line !== "")
      .join("\n"),
  )

  if (strict && failures.length > 0) {
    console.error(
      "\ncheck-contrast --strict: a required token pair is below the published floor.\n" +
        "  Change the token, not the floor - the floor is what the accessibility pages\n" +
        "  promise, and it is published as a commitment rather than as an aspiration.",
    )
    process.exit(1)
  }
}

await main()
