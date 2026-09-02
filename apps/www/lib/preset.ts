/**
 * `opsinjs-*` PRESET CODES — a whole theme in eleven characters.
 *
 * A preset code is a short, copy-pasteable string that carries every choice the
 * colour engine needs to rebuild a theme: `opsinjs-1a3KpQz7`. It exists so that
 * the theme playground can hand someone a URL, so that `/r/themes/<code>.json`
 * can materialise a registry item on demand, and so that a bug report can carry
 * the exact theme it was seen on.
 *
 * NAMESPACED ON PURPOSE. shadcn has its own preset codes and its own `lyra`
 * preset; an unprefixed code from one system pasted into the other would decode
 * to something plausible and wrong. Every opsinjs code carries the literal
 * prefix and nothing accepts a bare code.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THE APPEND-ONLY RULE — read before touching anything below.
 *
 * The enumerated arrays (RADIUS_VALUES, DENSITY_VALUES, …) are stored as
 * INDICES. A code emitted today says "radius index 3", so:
 *
 *   APPENDING a value at the end of an array is safe.
 *   REORDERING, INSERTING or REMOVING a value silently re-points every code
 *   ever emitted at a different theme. There is no error and no warning; the
 *   old code decodes to a valid theme that is not the one it named.
 *
 * If a field genuinely has to change shape, bump FORMAT_VERSION and add a
 * branch to `decodePreset`. That is what the version character is for, and it
 * is why it is the first character rather than part of the packed payload:
 * decoding must be able to branch before it unpacks anything.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Erasable syntax only and no imports: `scripts/build-tokens.mts` uses this to
 * materialise the shipped presets under plain `node`.
 */

export const PRESET_PREFIX = "opsinjs-"

/** Bump this, and add a decode branch, whenever a field changes shape. */
export const FORMAT_VERSION = 1

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

/* ── append-only enumerations ───────────────────────────────────────────── */

/** Chroma of the neutral ramp. Index 0 is a dead grey; the default is index 2. */
export const NEUTRAL_CHROMA_VALUES = [
  0, 0.004, 0.008, 0.012, 0.016, 0.024,
] as const

/** `--opsin-radius-base` in px. Index 3 (14px) is the product default. */
export const RADIUS_VALUES = [0, 4, 8, 14, 20, 28] as const

export const DENSITY_VALUES = ["comfortable", "compact"] as const

export const GAMUT_VALUES = ["srgb", "display-p3"] as const

/** Which APCA floor the theme is validated against. `standard` is the published one. */
export const FLOOR_VALUES = ["standard", "strict"] as const

export const CORNER_SHAPE_VALUES = ["round", "superellipse"] as const

/** The colour mode a theme opens in. `system` follows the reader's own setting. */
export const MODE_VALUES = ["light", "dark", "system"] as const

/* ── the packed field layout ────────────────────────────────────────────── */

interface FieldSpec {
  key: keyof PresetFields
  bits: number
  max: number
}

/**
 * Fields in packing order, least-significant first. APPEND ONLY: adding a field
 * at the end lengthens the code and old codes still decode, because the missing
 * high bits read as zero. Inserting one anywhere else does not.
 */
const FIELDS: FieldSpec[] = [
  { key: "hue", bits: 9, max: 359 },
  { key: "chromaStep", bits: 6, max: 63 },
  { key: "lightnessStep", bits: 7, max: 100 },
  { key: "neutralChroma", bits: 3, max: NEUTRAL_CHROMA_VALUES.length - 1 },
  { key: "radius", bits: 3, max: RADIUS_VALUES.length - 1 },
  { key: "density", bits: 2, max: DENSITY_VALUES.length - 1 },
  { key: "gamut", bits: 2, max: GAMUT_VALUES.length - 1 },
  { key: "floor", bits: 2, max: FLOOR_VALUES.length - 1 },
  { key: "cornerShape", bits: 2, max: CORNER_SHAPE_VALUES.length - 1 },
  { key: "mode", bits: 2, max: MODE_VALUES.length - 1 },
]

const PAYLOAD_BITS = FIELDS.reduce((total, field) => total + field.bits, 0)

/** Base62 characters needed to hold PAYLOAD_BITS. */
const PAYLOAD_LENGTH = Math.ceil(PAYLOAD_BITS / Math.log2(62))

/** The quantisation of chroma: 0.005 per step, so 63 steps reach 0.315. */
export const CHROMA_STEP = 0.005

/** The quantisation of lightness: 1% per step. */
export const LIGHTNESS_STEP = 0.01

/** The raw, quantised fields a code carries. */
interface PresetFields {
  hue: number
  chromaStep: number
  lightnessStep: number
  neutralChroma: number
  radius: number
  density: number
  gamut: number
  floor: number
  cornerShape: number
  mode: number
}

/** A theme as a person describes it. What `encodePreset` takes and `decodePreset` returns. */
export interface Preset {
  /** Brand hue in degrees, 0–359. */
  hue: number
  /** Brand chroma. Quantised to 0.005 on the way in. */
  chroma: number
  /** Brand lightness, 0–1. Quantised to 0.01 on the way in. */
  lightness: number
  neutralChroma: number
  /** `--opsin-radius-base` in px. */
  radius: number
  density: (typeof DENSITY_VALUES)[number]
  gamut: (typeof GAMUT_VALUES)[number]
  floor: (typeof FLOOR_VALUES)[number]
  cornerShape: (typeof CORNER_SHAPE_VALUES)[number]
  mode: (typeof MODE_VALUES)[number]
}

export const DEFAULT_PRESET: Preset = {
  hue: 250,
  chroma: 0.15,
  lightness: 0.55,
  neutralChroma: 0.008,
  radius: 14,
  density: "comfortable",
  gamut: "srgb",
  floor: "standard",
  cornerShape: "superellipse",
  mode: "light",
}

/* ── base62 ─────────────────────────────────────────────────────────────── */

function toBase62(value: bigint, length: number): string {
  let remaining = value
  let out = ""
  for (let i = 0; i < length; i++) {
    out = BASE62[Number(remaining % 62n)] + out
    remaining = remaining / 62n
  }
  return out
}

function fromBase62(text: string): bigint | null {
  let value = 0n
  for (const char of text) {
    const digit = BASE62.indexOf(char)
    if (digit < 0) return null
    value = value * 62n + BigInt(digit)
  }
  return value
}

/**
 * A single check character over the payload.
 *
 * Not cryptographic and not trying to be. Its whole job is to catch the one
 * realistic corruption: a code copied out of a chat message with a character
 * dropped or transposed. A theme applied from a mistyped code would otherwise
 * be a valid theme that is not the one the reporter saw, which is worse than an
 * error message.
 */
function checksum(payload: bigint): string {
  return BASE62[Number(payload % 61n)]
}

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value

function quantise(preset: Preset): PresetFields {
  return {
    hue: clamp(Math.round(((preset.hue % 360) + 360) % 360), 0, 359),
    chromaStep: clamp(Math.round(preset.chroma / CHROMA_STEP), 0, 63),
    lightnessStep: clamp(Math.round(preset.lightness / LIGHTNESS_STEP), 0, 100),
    neutralChroma: nearestIndex(NEUTRAL_CHROMA_VALUES, preset.neutralChroma),
    radius: nearestIndex(RADIUS_VALUES, preset.radius),
    density: indexOfValue(DENSITY_VALUES, preset.density),
    gamut: indexOfValue(GAMUT_VALUES, preset.gamut),
    floor: indexOfValue(FLOOR_VALUES, preset.floor),
    cornerShape: indexOfValue(CORNER_SHAPE_VALUES, preset.cornerShape),
    mode: indexOfValue(MODE_VALUES, preset.mode),
  }
}

function nearestIndex(values: readonly number[], value: number): number {
  let best = 0
  let bestDistance = Infinity
  for (let i = 0; i < values.length; i++) {
    const distance = Math.abs(values[i] - value)
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  }
  return best
}

function indexOfValue<T extends string>(
  values: readonly T[],
  value: T
): number {
  const index = values.indexOf(value)
  return index < 0 ? 0 : index
}

/**
 * Encode a theme as a preset code.
 *
 * Values outside a field's range are clamped rather than rejected: this is
 * called from a playground where someone is dragging a slider, and a hue of 400
 * means 40, not an exception.
 */
export function encodePreset(
  preset: Preset,
  version: number = FORMAT_VERSION
): string {
  const fields = quantise(preset)
  let packed = 0n
  let shift = 0n
  for (const field of FIELDS) {
    const value = BigInt(clamp(fields[field.key], 0, field.max))
    packed |= value << shift
    shift += BigInt(field.bits)
  }
  return (
    PRESET_PREFIX +
    BASE62[version] +
    toBase62(packed, PAYLOAD_LENGTH) +
    checksum(packed)
  )
}

export type DecodeError =
  | "missing-prefix"
  | "wrong-length"
  | "unknown-version"
  | "bad-characters"
  | "bad-checksum"

export interface DecodeResult {
  preset: Preset | null
  version: number | null
  error: DecodeError | null
  /** A sentence for a person, not a stack trace. Shown by the playground and by /r/themes. */
  message: string | null
}

/**
 * Decode a preset code.
 *
 * Never throws and never guesses. Every failure comes back with a named reason
 * and a sentence, because the two places this is called from — a paste field
 * and a route handler — both have to say something useful rather than fall over.
 */
export function decodePreset(code: string): DecodeResult {
  const trimmed = code.trim()
  if (!trimmed.startsWith(PRESET_PREFIX)) {
    return {
      preset: null,
      version: null,
      error: "missing-prefix",
      message: `An opsinjs preset code starts with "${PRESET_PREFIX}". A bare code is probably a shadcn preset, which is a different format and would decode to a different theme.`,
    }
  }

  const body = trimmed.slice(PRESET_PREFIX.length)
  if (body.length !== PAYLOAD_LENGTH + 2) {
    return {
      preset: null,
      version: null,
      error: "wrong-length",
      message: `This code is ${body.length} characters after the prefix; version ${FORMAT_VERSION} codes are ${PAYLOAD_LENGTH + 2}. It has probably been truncated.`,
    }
  }

  const version = BASE62.indexOf(body[0])
  if (version !== FORMAT_VERSION) {
    return {
      preset: null,
      version: version < 0 ? null : version,
      error: "unknown-version",
      message: `This code declares format version ${version < 0 ? "?" : version}; this build understands version ${FORMAT_VERSION}.`,
    }
  }

  const payload = fromBase62(body.slice(1, 1 + PAYLOAD_LENGTH))
  if (payload === null) {
    return {
      preset: null,
      version,
      error: "bad-characters",
      message:
        "This code contains characters that are not part of the alphabet. Check for a stray space or a line break.",
    }
  }

  if (checksum(payload) !== body[body.length - 1]) {
    return {
      preset: null,
      version,
      error: "bad-checksum",
      message:
        "This code did not survive being copied — a character is wrong or missing. Ask for it again rather than applying a theme that is nearly right.",
    }
  }

  let remaining = payload
  const fields = {} as PresetFields
  for (const field of FIELDS) {
    const mask = (1n << BigInt(field.bits)) - 1n
    fields[field.key] = Number(remaining & mask)
    remaining >>= BigInt(field.bits)
  }

  return {
    preset: {
      hue: clamp(fields.hue, 0, 359),
      chroma: fields.chromaStep * CHROMA_STEP,
      lightness: fields.lightnessStep * LIGHTNESS_STEP,
      neutralChroma:
        NEUTRAL_CHROMA_VALUES[
          clamp(fields.neutralChroma, 0, NEUTRAL_CHROMA_VALUES.length - 1)
        ],
      radius: RADIUS_VALUES[clamp(fields.radius, 0, RADIUS_VALUES.length - 1)],
      density:
        DENSITY_VALUES[clamp(fields.density, 0, DENSITY_VALUES.length - 1)],
      gamut: GAMUT_VALUES[clamp(fields.gamut, 0, GAMUT_VALUES.length - 1)],
      floor: FLOOR_VALUES[clamp(fields.floor, 0, FLOOR_VALUES.length - 1)],
      cornerShape:
        CORNER_SHAPE_VALUES[
          clamp(fields.cornerShape, 0, CORNER_SHAPE_VALUES.length - 1)
        ],
      mode: MODE_VALUES[clamp(fields.mode, 0, MODE_VALUES.length - 1)],
    },
    version,
    error: null,
    message: null,
  }
}

/** The brand colour a preset describes, as an `oklch()` string the colour engine can parse. */
export function presetBrandColor(preset: Preset): string {
  return `oklch(${preset.lightness} ${preset.chroma} ${preset.hue})`
}

/**
 * The shipped presets. Names, not codes, are what the documentation refers to;
 * the code is what a reader copies. `build-tokens.mts` materialises each into
 * `/r/themes/<code>.json`.
 */
export const SHIPPED_PRESETS: {
  id: string
  name: string
  description: string
  preset: Preset
}[] = [
  {
    id: "opsinjs-calm",
    name: "Calm",
    description:
      "The default. A cool blue at a lightness that carries white text, and the least saturated neutral that still looks deliberate.",
    preset: DEFAULT_PRESET,
  },
  {
    id: "opsinjs-clinic",
    name: "Clinic",
    description:
      "A desaturated teal for products that sit beside a clinical service and should not compete with it.",
    preset: {
      ...DEFAULT_PRESET,
      hue: 195,
      chroma: 0.09,
      lightness: 0.52,
      neutralChroma: 0.004,
      radius: 8,
    },
  },
  {
    id: "opsinjs-warm",
    name: "Warm",
    description:
      "A warmer, softer theme for wellbeing and self-tracking products, with the largest radius on the ladder.",
    preset: {
      ...DEFAULT_PRESET,
      hue: 40,
      chroma: 0.12,
      lightness: 0.58,
      neutralChroma: 0.012,
      radius: 20,
    },
  },
  {
    id: "opsinjs-contrast",
    name: "High contrast",
    description:
      "The strict floor, square corners and a near-black neutral. Built for the reader who has turned increased contrast on, and used as the reference when checking that nothing depends on subtlety.",
    preset: {
      ...DEFAULT_PRESET,
      hue: 250,
      chroma: 0.18,
      lightness: 0.42,
      neutralChroma: 0,
      radius: 4,
      floor: "strict",
      cornerShape: "round",
    },
  },
]
