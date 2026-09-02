/**
 * The browser's client for `POST /api/contrast`.
 *
 * There is exactly one implementation of APCA and of the WCAG 2.2 ratio in this
 * repository, hand-written in `lib/color/`. The API route wraps it, CI calls the
 * same code through `scripts/check-contrast.mts`, and the playground calls it
 * over the network. A second implementation living in the browser would
 * eventually disagree with the one CI runs, and the disagreement would surface
 * on the page whose entire purpose is to be believed.
 *
 * Everything here fails LOUDLY and returns null rather than guessing. A contrast
 * tool that shows a plausible number when its backend is down is worse than one
 * that shows nothing, because the plausible number gets copied into a design
 * review and nobody checks it again.
 *
 * RESPONSE SHAPE. The route answers with a nested payload:
 *
 *   { input, apca: { lc, magnitude, polarity, floor, passes },
 *     wcag: { ratio, floor, passes, criterion, aa, aaa },
 *     verdict, notes, docsVersion }
 *
 * It is read defensively, and a flat `{ apcaLc, wcag }` form is accepted as a
 * fallback, because this client and the route are separate files: a rename
 * should cost one empty readout, not a broken page.
 */

export type ContrastVerdict = "pass" | "conditional" | "fail" | string

export type ContrastReading = {
  /** APCA lightness contrast, signed. Negative means light text on dark. */
  apcaLc: number | null
  /** Whether APCA clears the opsinjs floor for the stated size. */
  apcaPasses: boolean | null
  /** WCAG 2.2 contrast ratio, 1–21. */
  wcag: number | null
  /** Whether the ratio clears the WCAG 2.2 threshold for the stated size. */
  wcagPasses: boolean | null
  /** The service's own verdict: pass, conditional, or fail. */
  verdict: ContrastVerdict | null
  /**
   * The service's prose on WHY, when the two models disagree. Worth surfacing
   * verbatim: the disagreement between APCA and WCAG is the most useful thing
   * this endpoint knows and the least obvious from two numbers.
   */
  notes: string[]
}

/** Text size hint. APCA's answer depends on it; WCAG's threshold does too. */
export type ContrastSize = "body" | "large" | "non-text"

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function pickNumber(
  source: Record<string, unknown> | null,
  keys: string[]
): number | null {
  if (!source) return null
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

function pickBoolean(
  source: Record<string, unknown> | null,
  keys: string[]
): boolean | null {
  if (!source) return null
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "boolean") return value
  }
  return null
}

/**
 * Ask the oracle about one pair. Returns null when the service did not answer,
 * which every caller renders as "unavailable" rather than as a number.
 */
export async function checkContrast(
  foreground: string,
  background: string,
  size: ContrastSize = "body"
): Promise<ContrastReading | null> {
  try {
    const response = await fetch("/api/contrast", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ foreground, background, size }),
    })
    if (!response.ok) return null

    const record = asRecord(await response.json())
    if (!record) return null

    const apca = asRecord(record.apca)
    const wcag = asRecord(record.wcag)

    const verdict =
      typeof record.verdict === "string" && record.verdict.trim() !== ""
        ? record.verdict
        : null

    const notes = Array.isArray(record.notes)
      ? record.notes.filter((note): note is string => typeof note === "string")
      : []

    return {
      apcaLc: pickNumber(apca, ["lc"]) ?? pickNumber(record, ["apcaLc"]),
      apcaPasses: pickBoolean(apca, ["passes"]),
      wcag: pickNumber(wcag, ["ratio"]) ?? pickNumber(record, ["wcagRatio"]),
      wcagPasses: pickBoolean(wcag, ["passes"]),
      verdict,
      notes,
    }
  } catch {
    return null
  }
}

/** Human phrasing for an APCA Lc value, with the sign made explicit. */
export function describeLc(lc: number | null): string {
  if (lc === null) return "—"
  const magnitude = Math.abs(lc).toFixed(1)
  return `${lc < 0 ? "−" : ""}${magnitude} Lc`
}

/** Human phrasing for a WCAG ratio. */
export function describeRatio(ratio: number | null): string {
  if (ratio === null) return "—"
  return `${ratio.toFixed(2)}:1`
}
