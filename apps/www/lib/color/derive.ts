/**
 * THE COLOUR ENGINE: one brand colour in, a validated theme out.
 *
 * This is the code behind /playground/theme, behind the `opsinjs-*` preset
 * codes, and behind the claim on /docs/foundations/colour/how-the-engine-works.
 * It runs in four stages, in this order, and the order is the design:
 *
 *   1. NORMALISE.  Parse whatever the caller pasted into OKLCH. A brand colour
 *      is a hue and a chroma; its lightness is discarded, because a brand's
 *      lightness is a decision about a logo and the ramp's lightness is a
 *      decision about legibility.
 *   2. LADDER.     Lay the fixed lightness ladder from tokens/color.json. Every
 *      derived ramp in every theme has the same lightness at the same step, so
 *      swapping a brand can never change a component's contrast behaviour.
 *   3. CLAMP, THEN ESCALATE. Fit the chroma into sRGB. Where Display-P3 has
 *      headroom at that lightness, record the wider value too. It is
 *      emitted inside `@media (color-gamut: p3)` and it is an enhancement,
 *      never a requirement. sRGB is what the theme IS.
 *   4. VALIDATE.   Assign roles by MEASUREMENT. `primary` is not "step 600", it
 *      is the first step at or below the brand's lightness whose foreground
 *      clears the body floor in both contrast models. If no step does, the
 *      engine says so instead of shipping a theme that fails.
 *
 * Stage 4 is the part that makes this an engine rather than a palette
 * generator. A theme is returned with warnings, and a warning is a real
 * refusal: `deriveTheme` will tell you that your brand colour cannot carry
 * white text at any lightness rather than quietly picking a colour that is not
 * yours.
 *
 * No JSX, erasable syntax only: `scripts/build-tokens.mts` imports this under
 * plain `node`.
 */

import type { Gamut, Oklch } from "./oklch.ts"
import {
  clampToGamut,
  formatDisplayP3,
  formatOklch,
  inGamut,
  maxChroma,
  oklchToRgb255,
  parseColor,
} from "./oklch.ts"
import type { ContrastUse } from "./apca.ts"
import { APCA_FLOOR, apcaContrast } from "./apca.ts"
import { contrastRatio, WCAG_FLOOR } from "./wcag.ts"

/** The ramp steps, and the lightness of each. Mirrors `ladder` in tokens/color.json. */
export const RAMP_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const

export type RampStep = (typeof RAMP_STEPS)[number]

export const RAMP_LIGHTNESS: Record<RampStep, number> = {
  50: 0.972,
  100: 0.941,
  200: 0.884,
  300: 0.806,
  400: 0.714,
  500: 0.622,
  600: 0.541,
  700: 0.452,
  800: 0.362,
  900: 0.276,
  950: 0.208,
}

/** Chroma as a fraction of the seed's, per step. Mirrors `chromaEnvelope` in tokens/color.json. */
export const CHROMA_ENVELOPE: Record<RampStep, number> = {
  50: 0.14,
  100: 0.24,
  200: 0.42,
  300: 0.66,
  400: 0.88,
  500: 1.0,
  600: 0.97,
  700: 0.88,
  800: 0.74,
  900: 0.58,
  950: 0.44,
}

/** How much more chroma Display-P3 is allowed to spend than sRGB at the same step. */
export const P3_CHROMA_GAIN = 1.18

export interface RampStepValue {
  step: RampStep
  /** The shipped value: clamped into sRGB. */
  srgb: Oklch
  /** The wide-gamut enhancement, when P3 has headroom the same step in sRGB does not. */
  p3?: Oklch
  /** True when sRGB could not hold the chroma the envelope asked for. */
  clamped: boolean
  css: { srgb: string; p3?: string }
}

export type Ramp = Record<RampStep, RampStepValue>

export interface DeriveOptions {
  /** Chroma of the neutral ramp, which shares the brand's hue. 0 gives a dead grey; the default is a hint. */
  neutralChroma?: number
  /** The gamut the shipped values must fit. There is no reason to change this. */
  gamut?: Gamut
  /**
   * Ceiling on the seed's chroma. Brands frequently arrive at chroma 0.3 and
   * a whole system at that saturation is exhausting to read for anything
   * longer than a button.
   */
  maxSeedChroma?: number
}

export type WarningLevel = "error" | "warning" | "note"

export interface DeriveWarning {
  level: WarningLevel
  code: string
  message: string
}

export interface RoleValue {
  /** The token this role resolves to, as `<rampName>-<step>` or a literal. */
  source: string
  value: Oklch
  css: string
}

export interface RolePair {
  light: RoleValue
  dark: RoleValue
}

/** The roles a derived theme guarantees. Components consume these and never a step. */
export type RoleName =
  | "canvas"
  | "surface"
  | "ink"
  | "muted-ink"
  | "line"
  | "control-line"
  | "primary"
  | "on-primary"
  | "focus"

export interface ContrastCheck {
  pair: string
  use: ContrastUse
  apcaLc: number
  wcagRatio: number
  passes: boolean
  /**
   * Measured and published, but not required.
   *
   * The only advisory pair is `line` on `canvas`, which is a decorative
   * separator between two rows of the same thing. WCAG 2.2 SC 1.4.11 governs
   * boundaries that are REQUIRED to identify a component, and a rule between
   * list items is not one; forcing it to Lc 45 would produce a page of heavy
   * black lines and would teach a reader that a line means something when it
   * does not. The boundary that DOES identify a control is `control-line`, and
   * that one is required.
   */
  advisory?: boolean
}

export interface DerivedTheme {
  /** The brand colour as parsed, before the ladder discarded its lightness. */
  brand: Oklch
  /** The seed used for the chromatic ramp: the brand's hue and clamped chroma. */
  seed: Oklch
  brandRamp: Ramp
  neutralRamp: Ramp
  roles: Record<RoleName, RolePair>
  checks: ContrastCheck[]
  warnings: DeriveWarning[]
  /** False when any `error` warning is present. A theme that is not sound must not be shipped. */
  sound: boolean
}

/** Build one ramp from a seed, clamping to sRGB and recording the P3 enhancement. */
export function deriveRamp(seed: Oklch, gamut: Gamut = "srgb"): Ramp {
  const ramp = {} as Ramp
  for (const step of RAMP_STEPS) {
    const l = RAMP_LIGHTNESS[step]
    const wanted = seed.c * CHROMA_ENVELOPE[step]
    const ceilingSrgb = maxChroma(l, seed.h, gamut)
    const c = Math.min(wanted, ceilingSrgb)
    const srgb: Oklch = { l, c, h: seed.h }

    const ceilingP3 = maxChroma(l, seed.h, "display-p3")
    const p3Chroma = Math.min(wanted * P3_CHROMA_GAIN, ceilingP3)
    const hasP3 = p3Chroma > c + 1e-4
    const p3: Oklch | undefined = hasP3
      ? { l, c: p3Chroma, h: seed.h }
      : undefined

    ramp[step] = {
      step,
      srgb,
      p3,
      clamped: c < wanted - 1e-4,
      css: {
        srgb: formatOklch(srgb),
        p3: p3 ? formatDisplayP3(p3) : undefined,
      },
    }
  }
  return ramp
}

function check(
  pair: string,
  text: Oklch,
  background: Oklch,
  use: ContrastUse,
  advisory = false
): ContrastCheck {
  const apcaLc = apcaContrast(oklchToRgb255(text), oklchToRgb255(background))
  const wcagRatio = contrastRatio(
    oklchToRgb255(text),
    oklchToRgb255(background)
  )
  const wcagFloor =
    use === "body"
      ? WCAG_FLOOR.bodyAA
      : use === "large"
        ? WCAG_FLOOR.largeAA
        : WCAG_FLOOR.nonTextAA
  return {
    pair,
    use,
    apcaLc,
    wcagRatio,
    passes: Math.abs(apcaLc) >= APCA_FLOOR[use] && wcagRatio >= wcagFloor,
    advisory,
  }
}

/**
 * Choose the foreground a filled surface should carry, by measuring both
 * candidates rather than assuming white.
 *
 * "White text on the brand colour" is the assumption that produces most of the
 * failing buttons on the web. Here the two realistic candidates are near-white
 * and near-black. Both are measured, and the one with more headroom wins, so
 * a pale brand gets dark text instead of an unreadable button.
 */
function pickForeground(
  background: Oklch,
  light: Oklch,
  dark: Oklch
): { value: Oklch; source: "light" | "dark"; lc: number } {
  const backgroundRgb = oklchToRgb255(background)
  const lightLc = Math.abs(apcaContrast(oklchToRgb255(light), backgroundRgb))
  const darkLc = Math.abs(apcaContrast(oklchToRgb255(dark), backgroundRgb))
  return lightLc >= darkLc
    ? { value: light, source: "light", lc: lightLc }
    : { value: dark, source: "dark", lc: darkLc }
}

/**
 * Walk the ramp in the given order and return the first step whose best
 * available foreground clears the body floor in BOTH contrast models.
 *
 * This is the heart of stage 4. `primary` is not "step 600 because that usually
 * works". It is the first step that measurably works, searched from the step
 * closest to the brand's own lightness so the result still looks like the
 * brand. In light mode the search runs towards the dark end; in dark mode it
 * runs towards the light end, because a filled control on a dark page has to be
 * lighter than the page, not darker.
 *
 * Returns null when no step works, which is a real answer and not a failure to
 * find one.
 */
function firstUsableStep(
  ramp: Ramp,
  order: RampStep[],
  candidates: { light: Oklch; dark: Oklch }
): {
  step: RampStep
  foreground: Oklch
  foregroundSource: "light" | "dark"
} | null {
  for (const step of order) {
    const background = ramp[step].srgb
    const picked = pickForeground(background, candidates.light, candidates.dark)
    const ratio = contrastRatio(
      oklchToRgb255(picked.value),
      oklchToRgb255(background)
    )
    if (picked.lc >= APCA_FLOOR.body && ratio >= WCAG_FLOOR.bodyAA) {
      return { step, foreground: picked.value, foregroundSource: picked.source }
    }
  }
  return null
}

/** Steps from `from` towards the dark end, inclusive. */
function stepsDarkwards(from: RampStep): RampStep[] {
  return RAMP_STEPS.slice(RAMP_STEPS.indexOf(from)) as unknown as RampStep[]
}

/** Steps from `from` towards the light end, inclusive. */
function stepsLightwards(from: RampStep): RampStep[] {
  return (
    RAMP_STEPS.slice(0, RAMP_STEPS.indexOf(from) + 1) as unknown as RampStep[]
  )
    .slice()
    .reverse()
}

function nearestStepByLightness(l: number): RampStep {
  let best: RampStep = RAMP_STEPS[0]
  let bestDistance = Infinity
  for (const step of RAMP_STEPS) {
    const distance = Math.abs(RAMP_LIGHTNESS[step] - l)
    if (distance < bestDistance) {
      bestDistance = distance
      best = step
    }
  }
  return best
}

const WHITE: Oklch = { l: 1, c: 0, h: 0 }

/**
 * Derive a complete, contrast-validated theme from one brand colour.
 *
 * Returns null only when the input cannot be parsed at all; every other problem
 * comes back as a warning on a theme you can inspect, because "your brand
 * colour is too light to carry white text" is information a designer needs, not
 * an exception.
 */
export function deriveTheme(
  input: string | Oklch,
  options: DeriveOptions = {}
): DerivedTheme | null {
  const gamut = options.gamut ?? "srgb"
  const maxSeedChroma = options.maxSeedChroma ?? 0.22
  const neutralChroma = options.neutralChroma ?? 0.008

  const brand = typeof input === "string" ? parseColor(input) : input
  if (!brand) return null

  const warnings: DeriveWarning[] = []

  if (brand.c < 0.02) {
    warnings.push({
      level: "note",
      code: "DERIVE-NEUTRAL-BRAND",
      message:
        "This brand colour is nearly achromatic, so the derived brand ramp and the neutral ramp will look almost identical. Consider setting `primary` by hand.",
    })
  }

  let seedChroma = brand.c
  if (seedChroma > maxSeedChroma) {
    warnings.push({
      level: "note",
      code: "DERIVE-CHROMA-CAPPED",
      message: `Seed chroma reduced from ${brand.c.toFixed(3)} to ${maxSeedChroma}. A whole interface at this saturation is tiring to read, and the mid steps would be out of sRGB anyway.`,
    })
    seedChroma = maxSeedChroma
  }

  const seed: Oklch = { l: brand.l, c: seedChroma, h: brand.h }
  if (!inGamut(brand, gamut)) {
    warnings.push({
      level: "note",
      code: "DERIVE-BRAND-OUT-OF-GAMUT",
      message: `The brand colour is outside ${gamut}; the ramp is built from its hue and a chroma this gamut can hold.`,
    })
  }

  const brandRamp = deriveRamp(seed, gamut)
  const neutralRamp = deriveRamp(
    { l: seed.l, c: neutralChroma, h: seed.h },
    gamut
  )

  const clampedSteps = RAMP_STEPS.filter((step) => brandRamp[step].clamped)
  if (clampedSteps.length > 0) {
    warnings.push({
      level: "note",
      code: "DERIVE-STEPS-CLAMPED",
      message: `Steps ${clampedSteps.join(", ")} could not hold the chroma the envelope asked for and were clamped to the sRGB boundary. Where Display-P3 has headroom the wider value is emitted as an enhancement.`,
    })
  }

  // Stage 4. Both primaries are chosen by measurement, and so is the text that
  // sits on them. The starting step is the one closest to the brand's own
  // lightness, so a theme still reads as the brand it came from.
  const candidates = { light: WHITE, dark: neutralRamp[950].srgb }
  const startStep = nearestStepByLightness(brand.l)

  const lightPrimary = firstUsableStep(
    brandRamp,
    stepsDarkwards(startStep),
    candidates
  )
  const darkPrimary = firstUsableStep(
    brandRamp,
    stepsLightwards(400),
    candidates
  )

  if (lightPrimary === null) {
    warnings.push({
      level: "error",
      code: "DERIVE-NO-PRIMARY-LIGHT",
      message:
        "No step on this brand ramp can carry readable text at the body floor in light mode. The hue is too light to darken usefully without leaving the brand behind; set `primary` by hand, or pick a brand colour with more chroma.",
    })
  }
  if (darkPrimary === null) {
    warnings.push({
      level: "error",
      code: "DERIVE-NO-PRIMARY-DARK",
      message:
        "No step on this brand ramp can carry readable text at the body floor in dark mode.",
    })
  }

  const primaryStepLight: RampStep = lightPrimary?.step ?? 700
  const primaryStepDark: RampStep = darkPrimary?.step ?? 300
  const primaryLight = brandRamp[primaryStepLight].srgb
  const primaryDark = brandRamp[primaryStepDark].srgb

  const role = (source: string, value: Oklch): RoleValue => ({
    source,
    value,
    css: formatOklch(value),
  })

  const onPrimaryLight = pickForeground(
    primaryLight,
    candidates.light,
    candidates.dark
  )
  const onPrimaryDark = pickForeground(
    primaryDark,
    candidates.light,
    candidates.dark
  )

  const roles: Record<RoleName, RolePair> = {
    canvas: {
      light: role("neutral-50", neutralRamp[50].srgb),
      dark: role("neutral-950", neutralRamp[950].srgb),
    },
    surface: {
      light: role("white", WHITE),
      dark: role("neutral-900", neutralRamp[900].srgb),
    },
    ink: {
      light: role("neutral-900", neutralRamp[900].srgb),
      dark: role("neutral-50", neutralRamp[50].srgb),
    },
    "muted-ink": {
      light: role("neutral-700", neutralRamp[700].srgb),
      dark: role("neutral-200", neutralRamp[200].srgb),
    },
    line: {
      light: role("neutral-200", neutralRamp[200].srgb),
      dark: role("neutral-700", neutralRamp[700].srgb),
    },
    "control-line": {
      light: role("neutral-500", neutralRamp[500].srgb),
      dark: role("neutral-400", neutralRamp[400].srgb),
    },
    primary: {
      light: role(`brand-${primaryStepLight}`, primaryLight),
      dark: role(`brand-${primaryStepDark}`, primaryDark),
    },
    "on-primary": {
      light: role(
        onPrimaryLight.source === "light" ? "white" : "neutral-950",
        onPrimaryLight.value
      ),
      dark: role(
        onPrimaryDark.source === "light" ? "white" : "neutral-950",
        onPrimaryDark.value
      ),
    },
    focus: {
      light: role(`brand-${primaryStepLight}`, primaryLight),
      dark: role("brand-400", brandRamp[400].srgb),
    },
  }

  const checks: ContrastCheck[] = [
    check(
      "ink on canvas (light)",
      roles.ink.light.value,
      roles.canvas.light.value,
      "body"
    ),
    check(
      "ink on canvas (dark)",
      roles.ink.dark.value,
      roles.canvas.dark.value,
      "body"
    ),
    check(
      "ink on surface (light)",
      roles.ink.light.value,
      roles.surface.light.value,
      "body"
    ),
    check(
      "ink on surface (dark)",
      roles.ink.dark.value,
      roles.surface.dark.value,
      "body"
    ),
    check(
      "muted-ink on canvas (light)",
      roles["muted-ink"].light.value,
      roles.canvas.light.value,
      "body"
    ),
    check(
      "muted-ink on canvas (dark)",
      roles["muted-ink"].dark.value,
      roles.canvas.dark.value,
      "body"
    ),
    check(
      "on-primary on primary (light)",
      roles["on-primary"].light.value,
      roles.primary.light.value,
      "body"
    ),
    check(
      "on-primary on primary (dark)",
      roles["on-primary"].dark.value,
      roles.primary.dark.value,
      "body"
    ),
    check(
      "control-line on canvas (light)",
      roles["control-line"].light.value,
      roles.canvas.light.value,
      "nonText"
    ),
    check(
      "control-line on canvas (dark)",
      roles["control-line"].dark.value,
      roles.canvas.dark.value,
      "nonText"
    ),
    check(
      "focus on canvas (light)",
      roles.focus.light.value,
      roles.canvas.light.value,
      "nonText"
    ),
    check(
      "focus on canvas (dark)",
      roles.focus.dark.value,
      roles.canvas.dark.value,
      "nonText"
    ),
    check(
      "line on canvas (light)",
      roles.line.light.value,
      roles.canvas.light.value,
      "nonText",
      true
    ),
    check(
      "line on canvas (dark)",
      roles.line.dark.value,
      roles.canvas.dark.value,
      "nonText",
      true
    ),
  ]

  /* `shortfall`, not `failed`: "failed" is on the banned list
     (tokens/glossary.json) for copy and identifiers alike, and an identifier is
     the copy of tomorrow. This one is one rename away from a prop table. The
     name is also the more accurate of the two, because the warning it builds
     reports a distance below a floor rather than a pass/fail verdict. */
  for (const shortfall of checks.filter((c) => !c.passes && !c.advisory)) {
    warnings.push({
      level: shortfall.use === "body" ? "error" : "warning",
      code: "DERIVE-PAIR-BELOW-FLOOR",
      message: `${shortfall.pair} measures Lc ${shortfall.apcaLc.toFixed(1)} and ${shortfall.wcagRatio.toFixed(2)}:1, below the ${shortfall.use} floor of Lc ${APCA_FLOOR[shortfall.use]}.`,
    })
  }

  return {
    brand,
    seed,
    brandRamp,
    neutralRamp,
    roles,
    checks,
    warnings,
    sound: !warnings.some((w) => w.level === "error"),
  }
}

/** Every custom property a derived theme emits, ready for a stylesheet or a copy button. */
export function themeToCssVariables(
  theme: DerivedTheme,
  mode: "light" | "dark" = "light"
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [name, pair] of Object.entries(theme.roles)) {
    out[`--opsin-${name}`] = pair[mode].css
  }
  for (const step of RAMP_STEPS) {
    out[`--opsin-brand-${step}`] = theme.brandRamp[step].css.srgb
    out[`--opsin-neutral-${step}`] = theme.neutralRamp[step].css.srgb
  }
  return out
}

/** Fit an arbitrary colour into the shipped gamut without moving its hue or lightness. */
export function fit(color: Oklch, gamut: Gamut = "srgb"): Oklch {
  return clampToGamut(color, gamut)
}
