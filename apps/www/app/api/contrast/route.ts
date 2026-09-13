/**
 * /api/contrast returns one contrast answer, used by the playground and by CI.
 *
 * GET  returns the policy: the thresholds, what each is for, and the request
 *      shape. A self-describing endpoint costs a few lines and removes the
 *      need for an agent to guess at the payload.
 * POST { foreground, background, size } returns the measured numbers.
 *
 * WHY BOTH NUMBERS. APCA is the better predictor of readability across the
 * mid-tone and light-on-dark pairs a health interface actually uses. Those
 * pairs are exactly where WCAG 2.2's ratio is known to be optimistic for light
 * text and pessimistic for dark. WCAG 2.2 is what a procurement checklist, an
 * accessibility statement and most audit tools measure against. Publishing one
 * and hiding the other would be choosing which conversation to lose. So both
 * are returned, side by side, and a pair that passes one and fails the other
 * is reported as `conditional`. That word marks a decision for a human, and it
 * is not a verdict this endpoint is entitled to make.
 *
 * The thresholds below are POLICY, not measurements: the APCA readability
 * levels published with APCA-W3 and the WCAG 2.2 ratios from SC 1.4.3 and
 * SC 1.4.11. The numbers this route returns are computed per request from
 * `lib/color/*`; nothing here is hand-written or cached from a table.
 */

import {
  DOCS_VERSION,
  absoluteUrl,
  json,
  resolveApca,
  resolveWcag,
} from "@/app/_machine/contracts"

export const dynamic = "force-dynamic"

/** Text sizes the floors are defined for. */
const SIZES = {
  body: {
    label: "Body text",
    note: "Text below roughly 18px, or any weight lighter than semibold.",
    apca: 60,
    wcag: 4.5,
    wcagCriterion: "WCAG 2.2 SC 1.4.3 (AA, normal text)",
  },
  large: {
    label: "Large text",
    note: "Text at roughly 24px, or 18.66px and bold, and above.",
    apca: 45,
    wcag: 3,
    wcagCriterion: "WCAG 2.2 SC 1.4.3 (AA, large text)",
  },
  "non-text": {
    label: "Non-text",
    note: "Icons, focus rings, chart strokes, component boundaries.",
    apca: 30,
    wcag: 3,
    wcagCriterion: "WCAG 2.2 SC 1.4.11 (non-text contrast)",
  },
} as const

type SizeKey = keyof typeof SIZES

function isSizeKey(value: unknown): value is SizeKey {
  return typeof value === "string" && value in SIZES
}

const POLICY = {
  standard: {
    apca: "APCA-W3 lightness contrast (Lc). Signed: a negative Lc is light text on a dark background. Thresholds are compared against the magnitude.",
    wcag: "WCAG 2.2 relative-luminance contrast ratio, 1 to 21.",
  },
  floors: SIZES,
  verdicts: {
    pass: "Meets the opsinjs floor on both scales.",
    conditional:
      "Meets one scale and not the other. Record which, and why the pair is acceptable, on the page that uses it.",
    fail: "Meets neither. Do not ship this pair as the stated size.",
  },
  request: {
    method: "POST",
    contentType: "application/json",
    body: {
      foreground: 'any CSS colour string, e.g. "#1a1a1a" or "oklch(0.2 0 0)"',
      background: "any CSS colour string",
      size: "body | large | non-text (default: body)",
    },
    aliases: { foreground: "fg", background: "bg" },
  },
} as const

export function GET(): Response {
  return json({
    endpoint: absoluteUrl("/api/contrast"),
    docsVersion: DOCS_VERSION,
    ...POLICY,
    note: "Thresholds are policy. The numbers returned by POST are computed per request from the hand-written OKLCH and APCA implementations in lib/color; none of them is stored or estimated.",
  })
}

function readColour(
  body: Record<string, unknown>,
  primary: string,
  alias: string
): string | null {
  const value = body[primary] ?? body[alias]
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= 128 ? trimmed : null
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    const raw = await request.text()
    if (raw.length > 4096) {
      return json({ error: "payload-too-large", limit: 4096 }, { status: 413 })
    }
    body = JSON.parse(raw)
  } catch {
    return json(
      {
        error: "invalid-json",
        message: "Send a JSON object.",
        request: POLICY.request,
      },
      { status: 400 }
    )
  }

  if (typeof body !== "object" || body === null) {
    return json(
      { error: "invalid-body", request: POLICY.request },
      { status: 400 }
    )
  }

  const record = body as Record<string, unknown>
  const foreground = readColour(record, "foreground", "fg")
  const background = readColour(record, "background", "bg")

  if (!foreground || !background) {
    return json(
      {
        error: "missing-colours",
        message:
          "Both `foreground` (or `fg`) and `background` (or `bg`) are required.",
        request: POLICY.request,
      },
      { status: 400 }
    )
  }

  const size: SizeKey = isSizeKey(record.size) ? record.size : "body"
  const floors = SIZES[size]

  const apca = resolveApca()
  const wcag = resolveWcag()
  if (!apca || !wcag) {
    return json(
      {
        error: "colour-engine-unavailable",
        message:
          "lib/color did not expose an APCA or WCAG contrast function. This endpoint computes, it does not estimate, so it declines rather than answering approximately.",
      },
      { status: 503 }
    )
  }

  let apcaLc: number
  let wcagRatio: number
  try {
    apcaLc = apca(foreground, background)
    wcagRatio = wcag(foreground, background)
  } catch (error) {
    return json(
      {
        error: "unparseable-colour",
        message: `One of the colours could not be parsed: ${String(error)}`,
        foreground,
        background,
      },
      { status: 422 }
    )
  }

  if (!Number.isFinite(apcaLc) || !Number.isFinite(wcagRatio)) {
    return json(
      {
        error: "unparseable-colour",
        message:
          "One of the colours parsed to a non-finite value. Check the syntax of both.",
        foreground,
        background,
      },
      { status: 422 }
    )
  }

  const apcaMagnitude = Math.abs(apcaLc)
  const apcaPasses = apcaMagnitude >= floors.apca
  const wcagPasses = wcagRatio >= floors.wcag

  const verdict =
    apcaPasses && wcagPasses
      ? "pass"
      : apcaPasses || wcagPasses
        ? "conditional"
        : "fail"

  const notes: string[] = []
  if (apcaPasses && !wcagPasses) {
    notes.push(
      "APCA clears the floor and WCAG 2.2 does not. This is common for light text on a mid-tone surface. It is defensible, but an audit tool will flag it, so record the decision."
    )
  }
  if (!apcaPasses && wcagPasses) {
    notes.push(
      "WCAG 2.2 clears the floor and APCA does not. Treat this as a fail for body copy: APCA is the better predictor of whether this pair is actually readable."
    )
  }
  if (verdict === "fail") {
    notes.push(
      "Change the pair rather than the size. Enlarging text to clear a lower floor moves the problem into layout and leaves the same pair failing wherever it is used small."
    )
  }
  if (apcaLc < 0) {
    notes.push("Negative Lc: this is light text on a dark background.")
  }

  return json({
    input: { foreground, background, size },
    apca: {
      lc: Number(apcaLc.toFixed(2)),
      magnitude: Number(apcaMagnitude.toFixed(2)),
      polarity: apcaLc < 0 ? "light-on-dark" : "dark-on-light",
      floor: floors.apca,
      passes: apcaPasses,
    },
    wcag: {
      ratio: Number(wcagRatio.toFixed(2)),
      floor: floors.wcag,
      passes: wcagPasses,
      criterion: floors.wcagCriterion,
      aa: wcagRatio >= (size === "body" ? 4.5 : 3),
      aaa: wcagRatio >= (size === "body" ? 7 : 4.5),
    },
    verdict,
    notes,
    docsVersion: DOCS_VERSION,
  })
}
