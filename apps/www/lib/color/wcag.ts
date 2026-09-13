/**
 * WCAG 2.2 relative luminance and contrast ratio, hand-written.
 *
 * This is the model a procurement reviewer, a VPAT and every accessibility
 * audit tool still uses, and it is why opsinjs publishes it beside APCA rather
 * than instead of it. The two do disagree, particularly for light text on
 * mid-tone backgrounds. Where they do, opsinjs takes the stricter of the two.
 *
 * The 0.03928 threshold below is the value written in the WCAG 2.x normative
 * text. The sRGB specification itself uses 0.04045, and the two differ only in
 * the fourth decimal place of a channel value; using the WCAG number means the
 * published figures match what a reviewer's own tool will report.
 *
 * No import beyond types, no JSX, erasable syntax only.
 */

import type { Oklch } from "./oklch.ts"
import { oklchToRgb255 } from "./oklch.ts"
import type { ColorInput } from "./apca.ts"
import { toRgb255Input } from "./apca.ts"

const R_COEFFICIENT = 0.2126
const G_COEFFICIENT = 0.7152
const B_COEFFICIENT = 0.0722

function channelLuminance(channel255: number): number {
  const c = channel255 / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** WCAG 2.2 relative luminance, 0 for black and 1 for white. */
export function relativeLuminance(input: ColorInput): number {
  const rgb = toRgb255Input(input)
  return (
    R_COEFFICIENT * channelLuminance(rgb[0]) +
    G_COEFFICIENT * channelLuminance(rgb[1]) +
    B_COEFFICIENT * channelLuminance(rgb[2])
  )
}

/**
 * The contrast ratio, from 1 (identical) to 21 (black on white).
 *
 * Unlike APCA this is symmetric: the order of the arguments does not matter,
 * which is both its convenience and its central limitation. It cannot tell you
 * that light text on a dark background reads differently from the reverse.
 */
export function contrastRatio(a: ColorInput, b: ColorInput): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  if (Number.isNaN(la) || Number.isNaN(lb)) return Number.NaN
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** The short name, matching `apca()`. Identical to `contrastRatio`. */
export const wcag = contrastRatio

export function contrastRatioOklch(a: Oklch, b: Oklch): number {
  return contrastRatio(oklchToRgb255(a), oklchToRgb255(b))
}

/** The three WCAG 2.2 thresholds this system checks against. */
export const WCAG_FLOOR = {
  /**
   * SC 1.4.3 Contrast (Minimum), body text, which is anything not large-scale.
   */
  bodyAA: 4.5,
  /** SC 1.4.3, large text, which is 24px, or 18.66px bold. */
  largeAA: 3,
  /** SC 1.4.11 Non-text Contrast: UI components and meaningful graphics. */
  nonTextAA: 3,
  /** SC 1.4.6 Contrast (Enhanced), body text. Reported, not required. */
  bodyAAA: 7,
  /** SC 1.4.6, large text. Reported, not required. */
  largeAAA: 4.5,
}

export type WcagUse = "body" | "large" | "nonText"

export interface WcagVerdict {
  ratio: number
  use: WcagUse
  /** The AA threshold that applies to this use. */
  floor: number
  passesAA: boolean
  /** AAA is measured and reported for text; the system does not require it. */
  passesAAA: boolean
  /** The successive criterion this verdict is against, for a conformance report. */
  criterion: string
}

export function wcagVerdict(
  a: ColorInput,
  b: ColorInput,
  use: WcagUse = "body"
): WcagVerdict {
  const ratio = contrastRatio(a, b)
  const floor =
    use === "body"
      ? WCAG_FLOOR.bodyAA
      : use === "large"
        ? WCAG_FLOOR.largeAA
        : WCAG_FLOOR.nonTextAA
  const aaaFloor =
    use === "body"
      ? WCAG_FLOOR.bodyAAA
      : use === "large"
        ? WCAG_FLOOR.largeAAA
        : Infinity
  return {
    ratio,
    use,
    floor,
    passesAA: ratio >= floor,
    passesAAA: ratio >= aaaFloor,
    criterion:
      use === "nonText"
        ? "1.4.11 Non-text Contrast"
        : "1.4.3 Contrast (Minimum)",
  }
}

/** Ratios are conventionally quoted to one decimal place and rounded DOWN, so a published figure is never better than the measurement. */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 10) / 10).toFixed(1)}:1`
}
