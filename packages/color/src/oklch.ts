/**
 * OKLCH ↔ OKLab ↔ linear sRGB ↔ sRGB ↔ Display-P3, hand-written.
 *
 * There is no colour dependency in this repo. `culori` would be four hundred
 * kilobytes and a supply-chain surface for about a hundred and fifty lines of
 * published matrix arithmetic, and the whole point of the colour pillar is that
 * a reader can check the maths against the specification rather than trust a
 * package. Every constant below is traceable:
 *
 *   - The OKLab matrices are Björn Ottosson's published values (2020).
 *   - The sRGB transfer function and the sRGB↔XYZ (D65) matrices are the ones
 *     in the CSS Color Module Level 4 sample conversion code.
 *   - The XYZ↔linear-Display-P3 matrices are the same, for the P3 primaries.
 *
 * No import, no JSX, erasable syntax only: `scripts/build-tokens.mts` and
 * `scripts/check-contrast.mts` import this file directly under plain `node`.
 *
 * CONVENTIONS. `L` and every RGB channel is 0 to 1. `C` is unbounded but in
 * practice below about 0.4. `h` is degrees, 0 to 360. A "linear" RGB triple is
 * light-linear; an "sRGB" triple is gamma-encoded and is what a CSS colour
 * value means. Nothing here clamps unless the function name says so, because
 * an out-of-gamut result is information. It is how `maxChroma` finds the
 * boundary and how `build-tokens.mts` knows a step needs a P3 variant.
 */

/** A colour in OKLCH. `l` 0 to 1, `c` unbounded, `h` in degrees. */
export interface Oklch {
  l: number
  c: number
  h: number
  /** Alpha 0 to 1. Absent means fully opaque. */
  alpha?: number
}

/** A colour in OKLab. */
export interface Oklab {
  l: number
  a: number
  b: number
  alpha?: number
}

/** Red, green and blue, each 0 to 1, in whichever space the function says. */
export interface Rgb {
  r: number
  g: number
  b: number
  alpha?: number
}

/** The colour spaces this module can express a colour in. */
export type Gamut = "srgb" | "display-p3"

/* ── transfer functions ─────────────────────────────────────────────────── */

/** sRGB gamma-encoded channel → light-linear. Also used for Display-P3, which shares sRGB's transfer curve. */
export function decodeTransfer(channel: number): number {
  const sign = channel < 0 ? -1 : 1
  const abs = Math.abs(channel)
  return abs <= 0.04045
    ? channel / 12.92
    : sign * Math.pow((abs + 0.055) / 1.055, 2.4)
}

/** Light-linear channel → gamma-encoded. */
export function encodeTransfer(channel: number): number {
  const sign = channel < 0 ? -1 : 1
  const abs = Math.abs(channel)
  return abs <= 0.0031308
    ? channel * 12.92
    : sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055)
}

export function srgbToLinear(rgb: Rgb): Rgb {
  return {
    r: decodeTransfer(rgb.r),
    g: decodeTransfer(rgb.g),
    b: decodeTransfer(rgb.b),
    alpha: rgb.alpha,
  }
}

export function linearToSrgb(rgb: Rgb): Rgb {
  return {
    r: encodeTransfer(rgb.r),
    g: encodeTransfer(rgb.g),
    b: encodeTransfer(rgb.b),
    alpha: rgb.alpha,
  }
}

/* ── OKLab ──────────────────────────────────────────────────────────────── */

export function oklchToOklab(color: Oklch): Oklab {
  const radians = (color.h * Math.PI) / 180
  return {
    l: color.l,
    a: color.c * Math.cos(radians),
    b: color.c * Math.sin(radians),
    alpha: color.alpha,
  }
}

export function oklabToOklch(color: Oklab): Oklch {
  const c = Math.sqrt(color.a * color.a + color.b * color.b)
  // Below this chroma the hue angle is numerical noise; report 0 rather than an
  // arbitrary direction, so that round-tripping a grey does not invent a hue.
  const h =
    c < 1e-7 ? 0 : ((Math.atan2(color.b, color.a) * 180) / Math.PI + 360) % 360
  return { l: color.l, c, h, alpha: color.alpha }
}

/** OKLab → light-linear sRGB. Ottosson's inverse matrices. */
export function oklabToLinearSrgb(color: Oklab): Rgb {
  const lRoot = color.l + 0.3963377774 * color.a + 0.2158037573 * color.b
  const mRoot = color.l - 0.1055613458 * color.a - 0.0638541728 * color.b
  const sRoot = color.l - 0.0894841775 * color.a - 1.291485548 * color.b
  const l = lRoot * lRoot * lRoot
  const m = mRoot * mRoot * mRoot
  const s = sRoot * sRoot * sRoot
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    alpha: color.alpha,
  }
}

/** Light-linear sRGB → OKLab. Ottosson's forward matrices. */
export function linearSrgbToOklab(rgb: Rgb): Oklab {
  const l = 0.4122214708 * rgb.r + 0.5363325363 * rgb.g + 0.0514459929 * rgb.b
  const m = 0.2119034982 * rgb.r + 0.6806995451 * rgb.g + 0.1073969566 * rgb.b
  const s = 0.0883024619 * rgb.r + 0.2817188376 * rgb.g + 0.6299787005 * rgb.b
  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)
  return {
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
    alpha: rgb.alpha,
  }
}

/* ── Display-P3 ─────────────────────────────────────────────────────────── */

const LINEAR_SRGB_TO_XYZ = [
  [0.4123907992659595, 0.35758433938387796, 0.1804807884018343],
  [0.21263900587151036, 0.7151686787677559, 0.07219231536073371],
  [0.019330818715591851, 0.11919477979462599, 0.9505321522496606],
]

const XYZ_TO_LINEAR_P3 = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
]

const LINEAR_P3_TO_XYZ = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0.0, 0.04511338185890264, 1.043944368900976],
]

const XYZ_TO_LINEAR_SRGB = [
  [3.2409699419045213, -1.5373831775700935, -0.4986107602930033],
  [-0.9692436362808798, 1.8759675015077206, 0.04155505740717561],
  [0.05563007969699361, -0.20397695888897657, 1.0569715142428786],
]

function apply(matrix: number[][], rgb: Rgb): Rgb {
  const v = [rgb.r, rgb.g, rgb.b]
  return {
    r: matrix[0][0] * v[0] + matrix[0][1] * v[1] + matrix[0][2] * v[2],
    g: matrix[1][0] * v[0] + matrix[1][1] * v[1] + matrix[1][2] * v[2],
    b: matrix[2][0] * v[0] + matrix[2][1] * v[1] + matrix[2][2] * v[2],
    alpha: rgb.alpha,
  }
}

/** Light-linear sRGB → light-linear Display-P3, through XYZ (D65). */
export function linearSrgbToLinearP3(rgb: Rgb): Rgb {
  return apply(XYZ_TO_LINEAR_P3, apply(LINEAR_SRGB_TO_XYZ, rgb))
}

/** Light-linear Display-P3 → light-linear sRGB, through XYZ (D65). */
export function linearP3ToLinearSrgb(rgb: Rgb): Rgb {
  return apply(XYZ_TO_LINEAR_SRGB, apply(LINEAR_P3_TO_XYZ, rgb))
}

/* ── the conversions callers actually use ───────────────────────────────── */

/** OKLCH → gamma-encoded sRGB, 0 to 1 per channel. Not clamped. */
export function oklchToSrgb(color: Oklch): Rgb {
  return linearToSrgb(oklabToLinearSrgb(oklchToOklab(color)))
}

/** Gamma-encoded sRGB, 0 to 1 per channel → OKLCH. */
export function srgbToOklch(rgb: Rgb): Oklch {
  return oklabToOklch(linearSrgbToOklab(srgbToLinear(rgb)))
}

/** OKLCH → gamma-encoded Display-P3, 0 to 1 per channel. Not clamped. */
export function oklchToDisplayP3(color: Oklch): Rgb {
  return linearToSrgb(
    linearSrgbToLinearP3(oklabToLinearSrgb(oklchToOklab(color)))
  )
}

/** Gamma-encoded Display-P3, 0 to 1 per channel → OKLCH. */
export function displayP3ToOklch(rgb: Rgb): Oklch {
  return oklabToOklch(
    linearSrgbToOklab(linearP3ToLinearSrgb(srgbToLinear(rgb)))
  )
}

/* ── gamut ──────────────────────────────────────────────────────────────── */

/**
 * The tolerance a channel may exceed 0 or 1 by and still count as in gamut.
 * Half a unit at 8-bit precision: a value that rounds to a representable
 * channel is in gamut for every purpose this system has.
 */
export const GAMUT_EPSILON = 1 / 512

function within(rgb: Rgb, epsilon: number): boolean {
  return (
    rgb.r >= -epsilon &&
    rgb.r <= 1 + epsilon &&
    rgb.g >= -epsilon &&
    rgb.g <= 1 + epsilon &&
    rgb.b >= -epsilon &&
    rgb.b <= 1 + epsilon
  )
}

export function inGamut(
  color: Oklch,
  gamut: Gamut = "srgb",
  epsilon: number = GAMUT_EPSILON
): boolean {
  const linear = oklabToLinearSrgb(oklchToOklab(color))
  return within(
    gamut === "srgb" ? linear : linearSrgbToLinearP3(linear),
    epsilon
  )
}

/**
 * The largest chroma that is still inside `gamut` at this lightness and hue.
 *
 * Binary search rather than an analytic solution: the sRGB gamut boundary in
 * OKLCH is a piecewise surface with cusps, and forty bisections resolve it to
 * about 4e-13. That is far finer than anything downstream can express. This is
 * the function that makes the token ramps honest, because it is what turns "the
 * envelope asked for 0.14 chroma here" into "sRGB can hold 0.128, so that is
 * what ships and the file records that it was clamped".
 */
export function maxChroma(
  l: number,
  h: number,
  gamut: Gamut = "srgb",
  iterations = 40
): number {
  let low = 0
  let high = 0.5
  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2
    if (inGamut({ l, c: mid, h }, gamut)) low = mid
    else high = mid
  }
  return low
}

/**
 * Bring a colour into gamut by reducing chroma only.
 *
 * Lightness and hue are preserved because both carry meaning here: lightness is
 * what the contrast floor is measured against, and hue is what identifies the
 * category. Clipping RGB channels instead is the usual browser behaviour. It
 * changes both, and can turn two adjacent ramp steps into the same colour.
 */
export function clampToGamut(color: Oklch, gamut: Gamut = "srgb"): Oklch {
  if (inGamut(color, gamut)) return color
  return { ...color, c: maxChroma(color.l, color.h, gamut) }
}

/* ── formatting and parsing ─────────────────────────────────────────────── */

function round(value: number, places: number): number {
  const factor = Math.pow(10, places)
  return Math.round(value * factor) / factor
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)

/** `oklch(0.622 0.17 15)`, or with an alpha, `oklch(0.622 0.17 15 / 0.5)`. */
export function formatOklch(color: Oklch, places = 3): string {
  const base = `${round(color.l, places)} ${round(color.c, places)} ${round(color.h, 2)}`
  return color.alpha === undefined || color.alpha === 1
    ? `oklch(${base})`
    : `oklch(${base} / ${round(color.alpha, 3)})`
}

/** `color(display-p3 0.9 0.2 0.3)`. Channels are clamped, because this is an output format. */
export function formatDisplayP3(color: Oklch, places = 4): string {
  const rgb = oklchToDisplayP3(color)
  const base = [rgb.r, rgb.g, rgb.b]
    .map((c) => round(clamp01(c), places))
    .join(" ")
  return color.alpha === undefined || color.alpha === 1
    ? `color(display-p3 ${base})`
    : `color(display-p3 ${base} / ${round(color.alpha, 3)})`
}

/** 0 to 1 sRGB → 0 to 255 integers, clamped. */
export function toRgb255(rgb: Rgb): [number, number, number] {
  return [
    Math.round(clamp01(rgb.r) * 255),
    Math.round(clamp01(rgb.g) * 255),
    Math.round(clamp01(rgb.b) * 255),
  ]
}

/**
 * OKLCH → 0 to 255 sRGB integers, clamped. The input for both contrast models.
 */
export function oklchToRgb255(color: Oklch): [number, number, number] {
  return toRgb255(oklchToSrgb(color))
}

/** `#rrggbb`, clamped into sRGB. */
export function formatHex(color: Oklch): string {
  return (
    "#" +
    oklchToRgb255(color)
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")
  )
}

/**
 * `#rgb`, `#rrggbb` or `#rrggbbaa` → sRGB 0 to 1. Returns null on anything
 * else.
 */
export function parseHex(input: string): Rgb | null {
  const hex = input.trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null
  const expand = (pair: string) => parseInt(pair, 16) / 255
  if (hex.length === 3 || hex.length === 4) {
    const parts = hex.split("").map((c) => expand(c + c))
    return { r: parts[0], g: parts[1], b: parts[2], alpha: parts[3] }
  }
  if (hex.length === 6 || hex.length === 8) {
    const parts = (hex.match(/.{2}/g) as string[]).map(expand)
    return { r: parts[0], g: parts[1], b: parts[2], alpha: parts[3] }
  }
  return null
}

/**
 * Parse the colour syntaxes a person is likely to paste into the theme
 * playground: `oklch(...)` with or without percentages, `#rrggbb`, and
 * `rgb(r g b)` or `rgb(r, g, b)`. Anything else returns null rather than
 * guessing. A theme derived from a misparsed brand colour is worse than a
 * refusal to derive one.
 */
export function parseColor(input: string): Oklch | null {
  const value = input.trim()

  const oklchMatch = value.match(/^oklch\(\s*([^)]+)\)$/i)
  if (oklchMatch) {
    const [coords, alphaPart] = oklchMatch[1].split("/")
    const parts = coords
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
    if (parts.length < 3) return null
    const l = parts[0].endsWith("%")
      ? parseFloat(parts[0]) / 100
      : parseFloat(parts[0])
    const c = parts[1].endsWith("%")
      ? (parseFloat(parts[1]) / 100) * 0.4
      : parseFloat(parts[1])
    const h = parseFloat(parts[2].replace(/deg$/i, ""))
    if (![l, c, h].every(Number.isFinite)) return null
    const alpha = alphaPart === undefined ? undefined : parseAlpha(alphaPart)
    return { l, c, h: ((h % 360) + 360) % 360, alpha }
  }

  if (value.startsWith("#")) {
    const rgb = parseHex(value)
    return rgb ? srgbToOklch(rgb) : null
  }

  const rgbMatch = value.match(/^rgba?\(\s*([^)]+)\)$/i)
  if (rgbMatch) {
    const [coords, alphaPart] = rgbMatch[1].split("/")
    const parts = coords
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
    if (parts.length < 3) return null
    const channels = parts
      .slice(0, 3)
      .map((p) => (p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p) / 255))
    if (!channels.every(Number.isFinite)) return null
    const alphaSource = alphaPart !== undefined ? alphaPart : parts[3]
    const alpha =
      alphaSource === undefined ? undefined : parseAlpha(alphaSource)
    return srgbToOklch({
      r: channels[0],
      g: channels[1],
      b: channels[2],
      alpha,
    })
  }

  return null
}

function parseAlpha(raw: string): number | undefined {
  const text = raw.trim()
  const value = text.endsWith("%") ? parseFloat(text) / 100 : parseFloat(text)
  return Number.isFinite(value) ? clamp01(value) : undefined
}

/**
 * Mix two OKLCH colours. Hue takes the shorter way round the circle, which is
 * what CSS `color-mix` does and what anyone reading the result expects.
 */
export function mixOklch(from: Oklch, to: Oklch, amount: number): Oklch {
  const t = clamp01(amount)
  let delta = to.h - from.h
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return {
    l: from.l + (to.l - from.l) * t,
    c: from.c + (to.c - from.c) * t,
    h: (((from.h + delta * t) % 360) + 360) % 360,
  }
}

/**
 * Composite a translucent `foreground` at `alpha` over an opaque `backdrop`,
 * source-over, and return the opaque colour a reader actually sees.
 *
 * The blend is done in light-linear sRGB, never in gamma-encoded sRGB. Mixing
 * two gamma-encoded channels directly is the common mistake, and it produces a
 * figure a browser will not reproduce, because a browser composites in a linear
 * space. So each channel is decoded to linear, mixed as `fg * alpha + bg * (1 -
 * alpha)`, and the result is read back to OKLCH. `alpha` is clamped to 0 to 1,
 * and `backdrop` is treated as opaque, which is what every backdrop this system
 * composites against is: the darkest and the lightest ground the product can
 * produce.
 *
 * Blur and backdrop-saturation are deliberately NOT modelled here, and that is
 * not an omission. A blur averages the backdrop rather than lightening or
 * darkening it, so the extreme backdrop is still the extreme after a blur, and
 * the contrast floor is about the extreme. A saturation boost changes the hue a
 * reader sees but not the lightness contrast the floor measures. Modelling
 * either one would trade a figure a browser reproduces for one it does not.
 */
export function compositeOver(
  foreground: Oklch,
  backdrop: Oklch,
  alpha: number
): Oklch {
  const a = clamp01(alpha)
  const fg = oklabToLinearSrgb(oklchToOklab(foreground))
  const bg = oklabToLinearSrgb(oklchToOklab(backdrop))
  return oklabToOklch(
    linearSrgbToOklab({
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
    })
  )
}
