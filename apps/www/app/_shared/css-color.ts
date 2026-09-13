/**
 * Browser-side colour helpers for the interactive routes.
 *
 * READ THIS BEFORE ADDING ANYTHING: this file contains NO colour mathematics.
 *
 * The measured numbers on this site are APCA Lc, WCAG 2.2 ratios, gamut
 * boundaries and the derived role assignments. Every one of them comes from the
 * hand-written implementations in `lib/color/**`, reached from the browser
 * through `POST /api/contrast` and from the build through
 * `scripts/check-contrast.mts`. That is deliberate: two implementations of APCA
 * would eventually disagree, and the one on the marketing page would be the one
 * nobody regression-tests.
 *
 * What lives here instead is delegation to the browser's own colour engine for
 * things the browser is authoritative about: resolving a custom property to the
 * value actually in effect, and converting a CSS colour to an sRGB hex the way
 * the user's display will.
 */

/** Read a custom property as it resolves on an element (default: <html>). */
export function readCustomProperty(
  name: string,
  element?: Element | null
): string {
  if (typeof window === "undefined") return ""
  const target = element ?? document.documentElement
  return window.getComputedStyle(target).getPropertyValue(name).trim()
}

/**
 * Convert any CSS colour the browser can parse into `#rrggbb`.
 *
 * This uses the 2D canvas colour parser, which clamps to sRGB. For a wide-gamut
 * OKLCH token that is a lossy answer and the UI says so rather than presenting
 * the hex as equivalent. The whole point of the colour engine is that P3 exists
 * and sRGB is the fallback, so a page that quietly hands you the clamp is
 * teaching the wrong lesson.
 *
 * Returns null when the browser cannot parse the value, which is the honest
 * outcome on an engine without CSS Color 4 support. Callers render the raw
 * authored value in that case; they never invent one.
 */
export function toSrgbHex(value: string): string | null {
  const input = value.trim()
  if (!input) return null

  // Fast path, and the reason server and client agree on the first render: a
  // literal hex needs no engine, so this returns the same answer during SSR as
  // it does after hydration. Without it every colour input would hydrate with a
  // different value than it rendered with.
  if (/^#[0-9a-f]{6}$/i.test(input)) return input.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(input)) {
    const [, r, g, b] = input.toLowerCase().split("") as [
      string,
      string,
      string,
      string,
    ]
    return `#${r}${r}${g}${g}${b}${b}`
  }

  if (typeof document === "undefined") return null

  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext("2d")
  if (!context) return null

  // A sentinel the input must actually displace. If the engine cannot parse the
  // colour, assignment is a no-op and fillStyle still reads as the sentinel.
  context.fillStyle = "#010203"
  context.fillStyle = input
  const parsed = context.fillStyle

  if (typeof parsed !== "string") return null
  if (parsed === "#010203" && input.toLowerCase() !== "#010203") return null

  if (/^#[0-9a-f]{6}$/i.test(parsed)) return parsed.toLowerCase()

  // Some engines hand back rgb()/rgba() instead of hex.
  const rgb = parsed.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  if (!rgb) return null
  const channel = (raw: string | undefined) =>
    Math.max(0, Math.min(255, Math.round(Number(raw ?? 0))))
      .toString(16)
      .padStart(2, "0")
  return `#${channel(rgb[1])}${channel(rgb[2])}${channel(rgb[3])}`.toLowerCase()
}

/**
 * Resolve a colour-typed custom property to an absolute value.
 *
 * Unregistered custom properties compute to their token text, so a value built
 * with relative colour syntax reads back unresolved and is useless for anything
 * but display. Painting it onto a registered `<color>` property first forces the
 * engine to resolve it. `registerColorProbe()` installs that registration once.
 */
export function resolveColorValue(value: string): string {
  if (typeof document === "undefined") return value
  const probe = document.createElement("span")
  probe.style.cssText = "position:absolute;opacity:0;pointer-events:none"
  probe.style.color = value
  document.body.appendChild(probe)
  const computed = window.getComputedStyle(probe).color
  probe.remove()
  return computed || value
}

/** Formats offered by the colour and token browsers. */
export type ColorFormat = "var" | "authored" | "hex"

export const colorFormatLabels: Record<ColorFormat, string> = {
  var: "var()",
  authored: "authored",
  hex: "hex (sRGB)",
}

/**
 * The copyable string for one token in one format.
 *
 * `authored` is whatever the token layer actually declares. Today that is an
 * `oklch()` triple, and tomorrow it is whatever `build-tokens.mts` emits. It is
 * read live rather than mirrored here so this file can never be the thing that
 * goes stale.
 */
export function formatColor(
  format: ColorFormat,
  customProperty: string,
  authored: string
): string {
  switch (format) {
    case "var":
      return `var(${customProperty})`
    case "hex":
      return toSrgbHex(authored) ?? authored
    case "authored":
    default:
      return authored
  }
}
