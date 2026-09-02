/**
 * check-contrast.mts - measures every opsinjs token pair with the hand-written
 * colour maths in lib/color/ and writes lib/generated/contrast.json.
 *
 *   node scripts/check-contrast.mts             # measure and write
 *   node scripts/check-contrast.mts --verify    # measure, write nothing, fail on a regression
 *   node scripts/check-contrast.mts --strict    # also fail when a required pair is below the floor
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
    let previous: { pairs?: MeasuredPair[] } | undefined
    try {
      previous = JSON.parse(readFileSync(OUT_FILE, "utf8")) as { pairs?: MeasuredPair[] }
    } catch {
      previous = undefined
    }
    if (!previous || !Array.isArray(previous.pairs) || previous.pairs.length === 0) {
      console.warn(
        "check-contrast --verify: there are no committed measurements to compare against.\n" +
          "  Run `pnpm run contrast` and commit lib/generated/contrast.json first.",
      )
      return
    }

    const before = new Map(previous.pairs.map((pair) => [`${pair.id}:${pair.theme}`, pair]))
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
    summary: {
      total: measured.length,
      passing: measured.filter((pair) => pair.passes).length,
      failing: failures.length,
      advisory: measured.filter((pair) => pair.advisory).length,
    },
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
        `${measured.filter((pair) => pair.passes).length} pass, ${failures.length} fail, ` +
        `${measured.filter((pair) => pair.advisory).length} advisory.`,
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
