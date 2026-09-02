/**
 * APCA-W3 lightness contrast, hand-written.
 *
 * APCA (the Accessible Perceptual Contrast Algorithm) is the contrast model
 * being developed for WCAG 3. It is not a WCAG 2 replacement and this system
 * does not treat it as one: every pair in opsinjs is published with BOTH an
 * APCA Lc and a WCAG 2.2 ratio, and must clear both floors. See
 * `./wcag.ts` for the other half and /docs/foundations/colour/contrast-and-apca
 * for why a system aimed at readers with presbyopia and low vision cares about
 * the difference.
 *
 * The constants below are the published APCA-W3 0.1.9 exponents and clamps.
 * They are magic numbers in the literal sense — they are fitted, not derived —
 * so they are named and grouped rather than inlined, and the implementation is
 * a direct transcription rather than an optimisation of one.
 *
 * IMPORTANT PROPERTIES OF Lc, because they trip everyone up:
 *   - It is SIGNED and it is DIRECTIONAL. Lc is positive for dark text on a
 *     light background and negative for light text on a dark one, and
 *     `apcaContrast(a, b)` is not `-apcaContrast(b, a)`. Text and background
 *     are different arguments doing different jobs; swapping them is a bug.
 *   - It is not a ratio and does not compare to 4.5:1. Lc 60 is roughly the
 *     floor for large text and Lc 75 for body text.
 *   - Below about Lc 15 the result is clamped to 0, because at that distance
 *     the number is meaningless.
 *
 * No import, no JSX, erasable syntax only: the scripts run this under plain
 * `node`.
 */

import type { Oklch } from "./oklch.ts"
import { oklchToRgb255, parseColor } from "./oklch.ts"

/** A colour as 0–255 sRGB integers, which is what APCA is defined over. */
export type Rgb255 = [number, number, number]

/**
 * Anything the contrast functions accept: an sRGB triple, an OKLCH object, or
 * a CSS colour string (`#0b6bcb`, `oklch(0.62 0.17 15)`, `rgb(11 107 203)`).
 *
 * The string form is here because the two callers that matter most are a route
 * handler receiving JSON and a playground receiving a paste, and neither has a
 * triple to hand. A string that cannot be parsed yields NaN rather than an
 * exception or a silent black: NaN propagates visibly into the response and
 * into any comparison, which is the behaviour you want from a number nobody
 * managed to measure.
 */
export type ColorInput = Rgb255 | Oklch | string

const NOT_A_COLOR: Rgb255 = [Number.NaN, Number.NaN, Number.NaN]

/** Coerce any accepted colour form to an sRGB triple. */
export function toRgb255Input(input: ColorInput): Rgb255 {
  if (Array.isArray(input)) return input
  if (typeof input === "string") {
    const parsed = parseColor(input)
    return parsed ? oklchToRgb255(parsed) : NOT_A_COLOR
  }
  return oklchToRgb255(input)
}

/* ── published APCA-W3 0.1.9 constants ──────────────────────────────────── */

const MAIN_TRC = 2.4
const S_RED = 0.2126729
const S_GREEN = 0.7151522
const S_BLUE = 0.072175

const BLACK_THRESHOLD = 0.022
const BLACK_CLAMP = 1.414

const DELTA_Y_MIN = 0.0005
const LOW_CLIP = 0.1

const SCALE_BOW = 1.14
const NORM_BG = 0.56
const NORM_TEXT = 0.57
const LOW_BOW_OFFSET = 0.027

const SCALE_WOB = 1.14
const REV_BG = 0.65
const REV_TEXT = 0.62
const LOW_WOB_OFFSET = 0.027

/**
 * Screen luminance Y for an sRGB triple, using APCA's own simple-exponent
 * transfer rather than the piecewise sRGB curve. This is deliberate and is one
 * of the places APCA and WCAG genuinely differ: APCA models the display, not
 * the encoding.
 */
export function screenLuminance(input: ColorInput): number {
  const rgb = toRgb255Input(input)
  const r = Math.pow(rgb[0] / 255, MAIN_TRC)
  const g = Math.pow(rgb[1] / 255, MAIN_TRC)
  const b = Math.pow(rgb[2] / 255, MAIN_TRC)
  return S_RED * r + S_GREEN * g + S_BLUE * b
}

function softClampBlack(y: number): number {
  return y > BLACK_THRESHOLD
    ? y
    : y + Math.pow(BLACK_THRESHOLD - y, BLACK_CLAMP)
}

/**
 * Lc for text on a background. Positive means dark-on-light, negative means
 * light-on-dark, and the two arguments are not interchangeable.
 */
export function apcaContrast(text: ColorInput, background: ColorInput): number {
  const textY = softClampBlack(screenLuminance(text))
  const backgroundY = softClampBlack(screenLuminance(background))

  if (Number.isNaN(textY) || Number.isNaN(backgroundY)) return Number.NaN
  if (Math.abs(backgroundY - textY) < DELTA_Y_MIN) return 0

  let contrast: number
  if (backgroundY > textY) {
    const raw =
      (Math.pow(backgroundY, NORM_BG) - Math.pow(textY, NORM_TEXT)) * SCALE_BOW
    contrast = raw < LOW_CLIP ? 0 : raw - LOW_BOW_OFFSET
  } else {
    const raw =
      (Math.pow(backgroundY, REV_BG) - Math.pow(textY, REV_TEXT)) * SCALE_WOB
    contrast = raw > -LOW_CLIP ? 0 : raw + LOW_WOB_OFFSET
  }

  return contrast * 100
}

/** The same, taking OKLCH. Both colours are clamped into sRGB first, because that is what a screen shows. */
export function apcaContrastOklch(text: Oklch, background: Oklch): number {
  return apcaContrast(oklchToRgb255(text), oklchToRgb255(background))
}

/**
 * The short name, for callers that just want the number: `apca("#333",
 * "#fff")`. Identical to `apcaContrast`.
 */
export const apca = apcaContrast

/* ── the opsinjs floor ──────────────────────────────────────────────────── */

/** What a pair is being used for. Determines which floor applies. */
export type ContrastUse = "body" | "large" | "nonText"

/**
 * The published opsinjs APCA floor. These are the system's own commitments,
 * chosen a little above the bare minimum because the audience is reading a
 * number that matters to them on a phone, outdoors, often over 60.
 *
 * They are floors, not targets: a pair that clears them is permitted, not
 * praised. `scripts/check-contrast.mts` measures every pair against them and a
 * regression fails the build.
 */
export const APCA_FLOOR: Record<ContrastUse, number> = {
  body: 75,
  large: 60,
  nonText: 45,
}

export const CONTRAST_USE_LABELS: Record<ContrastUse, string> = {
  body: "Body text, and any text below 24px or below 18.66px bold",
  large: "Text at 24px and above, or 18.66px bold and above",
  nonText:
    "Boundaries, icons, chart strokes, focus rings and any graphic that carries meaning",
}

export function passesApca(lc: number, use: ContrastUse = "body"): boolean {
  return Math.abs(lc) >= APCA_FLOOR[use]
}

export interface ApcaVerdict {
  lc: number
  /** Absolute Lc, which is what a floor is compared against. */
  magnitude: number
  /** Positive Lc is dark text on light; negative is light text on dark. */
  polarity: "dark-on-light" | "light-on-dark" | "indistinguishable"
  use: ContrastUse
  floor: number
  passes: boolean
  /** How far above or below the floor, signed. Negative is a shortfall. */
  headroom: number
}

export function apcaVerdict(
  text: ColorInput,
  background: ColorInput,
  use: ContrastUse = "body"
): ApcaVerdict {
  const lc = apcaContrast(text, background)
  const magnitude = Math.abs(lc)
  const floor = APCA_FLOOR[use]
  return {
    lc,
    magnitude,
    polarity:
      lc === 0
        ? "indistinguishable"
        : lc > 0
          ? "dark-on-light"
          : "light-on-dark",
    use,
    floor,
    passes: magnitude >= floor,
    headroom: magnitude - floor,
  }
}

/**
 * The smallest font size, in px, at which this Lc is usable at the given
 * weight — a coarse reading of the APCA font-size guidance, not the full
 * lookup table.
 *
 * It is coarse ON PURPOSE. The full table has entries the guidance itself marks
 * as placeholders and interpolating it would publish a precision this system
 * cannot stand behind, which is exactly the failure mode the whole "generated,
 * never asserted" rule exists to prevent. Returns null when no size in the
 * system's type scale is usable at this contrast.
 */
export function minimumFontSize(
  lc: number,
  weight: 400 | 500 | 600 | 700 = 400
): number | null {
  const magnitude = Math.abs(lc)
  const bold = weight >= 600
  if (magnitude >= 90) return bold ? 12 : 14
  if (magnitude >= 75) return bold ? 14 : 16
  if (magnitude >= 60) return bold ? 16 : 20
  if (magnitude >= 45) return bold ? 24 : 30
  return null
}
