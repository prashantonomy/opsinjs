/**
 * Colour-vision-deficiency simulation, hand-written.
 *
 * This exists to prove one rule rather than to be a general-purpose tool: in
 * opsinjs, colour never carries meaning on its own, and the way that claim is
 * checked is by rendering every status specimen under each dichromacy and under
 * grayscale and confirming the meaning survives. `<CvdSimulator>` runs this in
 * the browser and `scripts/check-contrast.mts` runs the same functions in CI, so
 * the audit on the page and the audit in the build are the same code.
 *
 * METHOD. Linear-light sRGB is projected into an LMS cone space, the missing
 * cone response is replaced with the value predicted from the other two, and
 * the result is projected back. This is the approach described by Viénot,
 * Brettel and Mollon (1999) for checking the legibility of displays for
 * dichromats; the LMS matrices below are the ones that paper's method is
 * usually implemented with.
 *
 * WHAT IT IS NOT. It is a model of dichromacy, which is the complete absence
 * of one cone type. Anomalous trichromacy (the far more common condition) is
 * approximated by interpolating towards the dichromatic result. That
 * interpolation is a convenience, not a model of anyone's vision. Nothing here
 * tells you what a particular person sees, and a design that only passes at
 * severity 0.6 has not passed.
 *
 * No JSX, erasable syntax only.
 */

import type { Oklch, Rgb } from "./oklch.ts"
import {
  linearToSrgb,
  oklchToSrgb,
  srgbToLinear,
  srgbToOklch,
  toRgb255,
} from "./oklch.ts"
import type { Rgb255 } from "./apca.ts"
import { apcaContrast } from "./apca.ts"

/** The three dichromacies, plus the achromatic check every specimen must also survive. */
export type CvdType = "protanopia" | "deuteranopia" | "tritanopia" | "grayscale"

export const CVD_TYPES: CvdType[] = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "grayscale",
]

export const CVD_LABELS: Record<CvdType, string> = {
  protanopia: "Protanopia has no long-wavelength (red) cone",
  deuteranopia: "Deuteranopia has no medium-wavelength (green) cone",
  tritanopia: "Tritanopia has no short-wavelength (blue) cone",
  grayscale: "Grayscale is the printed, photocopied and screenshotted case",
}

const RGB_TO_LMS = [
  [17.8824, 43.5161, 4.11935],
  [3.45565, 27.1554, 3.86714],
  [0.0299566, 0.184309, 1.46709],
]

const LMS_TO_RGB = [
  [0.080944448, -0.130504409, 0.116721066],
  [-0.010248534, 0.054019326, -0.113614708],
  [-0.000365297, -0.004121615, 0.693511405],
]

function matmul(
  matrix: number[][],
  v: [number, number, number]
): [number, number, number] {
  return [
    matrix[0][0] * v[0] + matrix[0][1] * v[1] + matrix[0][2] * v[2],
    matrix[1][0] * v[0] + matrix[1][1] * v[1] + matrix[1][2] * v[2],
    matrix[2][0] * v[0] + matrix[2][1] * v[1] + matrix[2][2] * v[2],
  ]
}

/**
 * Grayscale by relative luminance rather than by an average of the channels.
 *
 * The naive average is what makes a red and a green of equal lightness collapse
 * into the same grey while a correct conversion keeps them apart. That
 * collapse would make this audit report a pass it has not earned.
 */
export function toGrayscale(rgb: Rgb): Rgb {
  const linear = srgbToLinear(rgb)
  const y = 0.2126 * linear.r + 0.7152 * linear.g + 0.0722 * linear.b
  return linearToSrgb({ r: y, g: y, b: y, alpha: rgb.alpha })
}

/**
 * Simulate a dichromacy. `severity` 0 returns the input unchanged and 1 returns
 * full dichromacy; values between interpolate in linear light.
 */
export function simulate(rgb: Rgb, type: CvdType, severity = 1): Rgb {
  const amount = severity < 0 ? 0 : severity > 1 ? 1 : severity
  if (amount === 0) return rgb
  if (type === "grayscale") {
    const grey = toGrayscale(rgb)
    return {
      r: rgb.r + (grey.r - rgb.r) * amount,
      g: rgb.g + (grey.g - rgb.g) * amount,
      b: rgb.b + (grey.b - rgb.b) * amount,
      alpha: rgb.alpha,
    }
  }

  const linear = srgbToLinear(rgb)
  const [l, m, s] = matmul(RGB_TO_LMS, [linear.r, linear.g, linear.b])

  let projected: [number, number, number]
  if (type === "protanopia") projected = [2.02344 * m - 2.52581 * s, m, s]
  else if (type === "deuteranopia")
    projected = [l, 0.494207 * l + 1.24827 * s, s]
  else projected = [l, m, -0.395913 * l + 0.801109 * m]

  const [r, g, b] = matmul(LMS_TO_RGB, projected)
  const simulated = linearToSrgb({ r, g, b, alpha: rgb.alpha })

  return {
    r: rgb.r + (simulated.r - rgb.r) * amount,
    g: rgb.g + (simulated.g - rgb.g) * amount,
    b: rgb.b + (simulated.b - rgb.b) * amount,
    alpha: rgb.alpha,
  }
}

export function simulateOklch(
  color: Oklch,
  type: CvdType,
  severity = 1
): Oklch {
  return srgbToOklch(simulate(oklchToSrgb(color), type, severity))
}

export function simulateRgb255(
  rgb: Rgb255,
  type: CvdType,
  severity = 1
): Rgb255 {
  const simulated = simulate(
    { r: rgb[0] / 255, g: rgb[1] / 255, b: rgb[2] / 255 },
    type,
    severity
  )
  return toRgb255(simulated)
}

/* ── the audit ──────────────────────────────────────────────────────────── */

export interface CvdCollision {
  type: CvdType
  a: string
  b: string
  /** Lc between the two simulated colours. Near zero means they have collapsed. */
  lc: number
}

/**
 * The minimum Lc at which two swatches shown side by side are still telling
 * two different colours apart.
 *
 * 15 rather than the non-text floor of 45: this is not a text-legibility test,
 * it is a "did these two collapse into the same colour" test, and two adjacent
 * fills at Lc 15 are visibly different while two at Lc 4 are not. A pair that
 * collapses here is a genuine defect; a pair at Lc 20 is a warning to a
 * designer, and both are reported.
 */
export const COLLAPSE_THRESHOLD = 15

/**
 * Check that a set of named colours stays mutually distinguishable under every
 * simulation. This is the function that turns "status must survive grayscale"
 * from doctrine into a build step.
 *
 * A collision is NOT automatically a failure of the system: the four status
 * levels are also carried by an icon and a word, which is the whole point. It
 * is a failure of the COLOUR to do the job alone, which is what this audit
 * reports so that the page can say so honestly.
 */
export function findCollisions(
  swatches: Record<string, Oklch>,
  types: CvdType[] = CVD_TYPES,
  threshold: number = COLLAPSE_THRESHOLD
): CvdCollision[] {
  const names = Object.keys(swatches)
  const collisions: CvdCollision[] = []

  for (const type of types) {
    const simulated = new Map<string, Rgb255>()
    for (const name of names)
      simulated.set(name, toRgb255(simulate(oklchToSrgb(swatches[name]), type)))

    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = simulated.get(names[i]) as Rgb255
        const b = simulated.get(names[j]) as Rgb255
        const lc = Math.abs(apcaContrast(a, b))
        if (lc < threshold)
          collisions.push({ type, a: names[i], b: names[j], lc })
      }
    }
  }

  return collisions
}
