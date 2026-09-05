"use client"

import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/app/_shared/copy-button"
import { readCustomProperty } from "@/app/_shared/css-color"
import { useMediaQuery } from "@/app/_shared/use-client-value"

/**
 * The token browser.
 *
 * IT ENUMERATES THE STYLESHEET. It does not import a generated token map and it
 * does not carry a hand-kept list of token names. On mount it walks
 * `document.styleSheets`, collects every declaration whose property starts with
 * `--opsin-`, and reports the value each one resolves to on this document.
 *
 * Why that is worth the awkwardness of a client component. The token layer is
 * generated: `scripts/build-tokens.mts` rewrites `app/tokens.generated.css` from
 * `tokens/*.json`, and namespaces keep being added to it. The type and space
 * scales are the worked example — they were authored long before they were
 * emitted as custom properties, they are emitted now, and this page picked them
 * up on the run that emitted them without a line changing here. A browser built
 * from a hand-kept list would have omitted them silently and nobody would have
 * noticed for a month.
 *
 * The same is true one level down, in NAMESPACE_LABELS below: a namespace with
 * no entry there is still listed, under its raw name, with a paragraph saying so.
 * Missing prose is a smaller failure than a missing token.
 *
 * It also means this page reports the value in EFFECT rather than the value
 * authored: after the Display-P3 escalation, after dark mode, after
 * `prefers-reduced-transparency` and `prefers-reduced-motion` have rewritten
 * half the ladder and every duration.
 */

type TokenKind = "color" | "duration" | "easing" | "length" | "other"

type Token = {
  property: string
  value: string
  namespace: string
  kind: TokenKind
}

/**
 * Human labels for the namespaces that exist today. An unknown namespace is not
 * an error — it means the token layer grew — so it is rendered with its raw name
 * and a neutral description rather than being dropped.
 */
const NAMESPACE_LABELS: Record<string, { title: string; description: string }> =
  {
    status: {
      title: "Status",
      description:
        "The verdict axis: four ordinal clinical levels, each with a surface, a line and an ink role.",
    },
    category: {
      title: "Category",
      description:
        "The identity axis: what kind of measurement this is. Low chroma, never a verdict.",
    },
    material: {
      title: "Material",
      description:
        "The six-rung ladder. Each rung is a background, a blur radius, a border and a shadow — collapsing to an opaque fallback under reduced transparency.",
    },
    ease: {
      title: "Easing",
      description:
        "Springs authored as physical parameters and compiled to CSS linear(), so the curve runs in a plain transition with no animation library in the bundle.",
    },
    duration: {
      title: "Duration",
      description:
        "Named durations rather than numbers at call sites. Every one collapses to 1ms under reduced motion — the state change still happens, it just arrives immediately.",
    },
    radius: {
      title: "Radius",
      description:
        "The shape ladder, derived from a single radius value, plus the corner-shape used where the browser supports squircles.",
    },
    corner: {
      title: "Corner",
      description: "Corner geometry applied where the browser supports it.",
    },
    target: {
      title: "Target size",
      description:
        "Minimum tappable dimensions. Deliberately above the WCAG 2.2 SC 2.5.8 floor, because these screens are used one-handed and in a hurry.",
    },
    text: {
      title: "Type scale",
      description:
        "Eleven named steps from large title down to caption, each carrying a size, a line height, a tracking and a weight. Anchored on a 17px body rather than the 16px web convention, and expressed in rem so the reader's own browser setting still scales it.",
    },
    font: {
      title: "Font families",
      description:
        "Three stacks — sans, mono and the numeric face — each starting at the platform's own UI or monospace font rather than at a webfont. A health value should look like it belongs to the device the reader is holding.",
    },
    numerals: {
      title: "Numerals",
      description:
        "Tabular figures, set by every component that renders a number. Proportional digits make a value that updates in place appear to twitch and make a column of readings impossible to scan, so this is a correctness requirement rather than a preference.",
    },
    space: {
      title: "Space",
      description:
        "The spacing scale, in multiples of 4px plus a hairline step. Density switches which rungs a layout uses; it never changes the scale itself.",
    },
    gutter: {
      title: "Gutters",
      description:
        "The page margin at each of the three breakpoints — 16px on a phone, 24px from 640px, 32px from 1024px.",
    },
    measure: {
      title: "Measure",
      description:
        "Maximum line lengths, in characters: 45 for a caption or a legend, 66 for prose anywhere in the product including a disclaimer nobody wants to read, and 80 for code and machine output only.",
    },
    border: {
      title: "Borders",
      description:
        "Hairline by default, 2px where a boundary is carrying `attention` or `urgent` as one of the non-colour signals, and the focus ring — always 2px with a 2px offset, and never removed.",
    },
    safe: {
      title: "Safe area",
      description:
        "The four device safe-area insets, so a sheet, a bar or a consent footer clears the notch and the home indicator rather than sitting under them.",
    },
    neutral: {
      title: "Neutral ramp",
      description:
        "A very slightly cool grey ramp — chroma 0.002 to 0.009 at hue 250 — because a perfectly achromatic grey beside any of the chromatic ramps reads as a rendering fault rather than as a colour choice. 0 and 1000 are exact white and black.",
    },
  }

const NAMESPACE_ORDER = [
  "status",
  "category",
  "material",
  "neutral",
  "ease",
  "duration",
  "radius",
  "corner",
  "border",
  "target",
  "space",
  "gutter",
  "safe",
  "text",
  "font",
  "numerals",
  "measure",
]

function classify(value: string): TokenKind {
  const v = value.trim().toLowerCase()
  if (!v) return "other"
  if (/^(oklch|oklab|rgb|rgba|hsl|hsla|color|color-mix)\(/.test(v))
    return "color"
  if (v.startsWith("#")) return "color"
  if (/^-?[\d.]+m?s$/.test(v)) return "duration"
  if (/^(linear|cubic-bezier|steps)\(/.test(v)) return "easing"
  if (/^-?[\d.]+(px|rem|em|%|pt|vw|vh|dvh)$/.test(v)) return "length"
  return "other"
}

/** `--opsin-status-urgent-ink` → `status`. */
function namespaceOf(property: string): string {
  const rest = property.replace(/^--opsin-/, "")
  const [head = "other"] = rest.split("-")
  return head
}

/**
 * Collect every `--opsin-*` declaration the document knows about.
 *
 * Same-origin stylesheets only — reading `cssRules` across origins throws, and a
 * third-party sheet would not be declaring our tokens anyway. Nested rules
 * (media queries, `@supports`) are walked too, which is how the Display-P3 and
 * reduced-motion overrides get picked up; the VALUE, though, always comes from
 * `getComputedStyle`, so a token declared four times is reported once with the
 * value that actually won.
 */
function collectTokenNames(): string[] {
  const names = new Set<string>()

  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const style = rule.style
        for (let index = 0; index < style.length; index += 1) {
          const property = style.item(index)
          if (property.startsWith("--opsin-")) names.add(property)
        }
      }
      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested)
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.cssRules) walk(sheet.cssRules)
    } catch {
      // Cross-origin stylesheet. Not ours; skip it rather than failing the page.
    }
  }

  return Array.from(names).sort()
}

export function TokenBrowser() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [query, setQuery] = useState("")
  const [generatedStamp, setGeneratedStamp] = useState("")

  // Subscribed rather than read once: a reader who toggles reduced motion in
  // their operating system and comes back to this tab should see the readout
  // change, because the values in the table below will have changed too.
  const wideGamut = useMediaQuery("(color-gamut: p3)")
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  useEffect(() => {
    const read = () => {
      const names = collectTokenNames().filter(
        (name) => name !== "--opsin-tokens-generated"
      )
      setTokens(
        names.map((property) => {
          const value = readCustomProperty(property)
          return {
            property,
            value,
            namespace: namespaceOf(property),
            kind: classify(value),
          }
        })
      )
      setGeneratedStamp(readCustomProperty("--opsin-tokens-generated"))
    }

    read()

    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    })
    return () => observer.disconnect()
  }, [])

  const needle = query.trim().toLowerCase()

  const groups = useMemo(() => {
    const filtered = needle
      ? tokens.filter(
          (token) =>
            token.property.includes(normalisedQuery) ||
            token.value.toLowerCase().includes(normalisedQuery)
        )
      : tokens

    const byNamespace = new Map<string, Token[]>()
    for (const token of filtered) {
      const bucket = byNamespace.get(token.namespace) ?? []
      bucket.push(token)
      byNamespace.set(token.namespace, bucket)
    }

    return Array.from(byNamespace.entries()).sort(([a], [b]) => {
      const rankA = NAMESPACE_ORDER.indexOf(a)
      const rankB = NAMESPACE_ORDER.indexOf(b)
      if (rankA === -1 && rankB === -1) return a.localeCompare(b)
      if (rankA === -1) return 1
      if (rankB === -1) return -1
      return rankA - rankB
    })
  }, [tokens, normalisedQuery])

  return (
    <div>
      <TokenLayerStatus
        stamp={generatedStamp}
        total={tokens.length}
        wideGamut={wideGamut}
        reducedMotion={reducedMotion}
      />

      <div className="sticky top-14 z-10 mt-6 flex flex-wrap items-center gap-3 border-b border-border bg-card py-3">
        <label className="sr-only" htmlFor="token-search">
          Filter tokens
        </label>
        <input
          id="token-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter — spring, urgent, blur, radius…"
          className="h-9 min-w-56 flex-1 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
        <p className="font-mono text-xs text-muted-foreground">
          {tokens.length === 0
            ? "reading stylesheet…"
            : `${groups.reduce((total, [, rows]) => total + rows.length, 0)} of ${tokens.length}`}
        </p>
      </div>

      {tokens.length > 0 && groups.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No token matches “{query}”.
        </p>
      ) : null}

      {groups.map(([namespace, rows]) => {
        const label = NAMESPACE_LABELS[namespace]
        return (
          <section key={namespace} className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">
              {label?.title ?? namespace}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {label?.description ??
                "This namespace is not described here yet — it was added to the token layer after this page was written, which is exactly why the page reads the stylesheet instead of a list."}
            </p>

            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
              {rows.map((token) => (
                <li
                  key={token.property}
                  className="flex items-center gap-3 bg-card p-3"
                >
                  <TokenPreview token={token} />
                  <span className="min-w-0 flex-1">
                    <code className="block truncate font-mono text-xs font-medium">
                      {token.property}
                    </code>
                    <code className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                      {token.value || "—"}
                    </code>
                  </span>
                  <CopyButton
                    value={`var(${token.property})`}
                    label={token.property}
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/**
 * Whether the generated layer is actually loaded.
 *
 * `--opsin-tokens-generated` is written by `build-tokens.mts` and carries the
 * hash of the token sources. A clean clone that has never run `pnpm generate`
 * still renders — the authored fallbacks in `globals.css` see to that — but the
 * values it shows are defaults rather than the compiled system, and a page that
 * did not say so would be quietly wrong.
 */
function TokenLayerStatus({
  stamp,
  total,
  wideGamut,
  reducedMotion,
}: {
  stamp: string
  total: number
  wideGamut: boolean | null
  reducedMotion: boolean | null
}) {
  const isPlaceholder = stamp === "placeholder" || stamp === ""

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-4">
        <dt className="text-xs tracking-wide text-muted-foreground uppercase">
          Token layer
        </dt>
        <dd className="mt-1 text-sm">
          {total === 0
            ? "reading…"
            : isPlaceholder
              ? "Authored defaults — pnpm generate has not run"
              : `Generated · ${stamp}`}
        </dd>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <dt className="text-xs tracking-wide text-muted-foreground uppercase">
          Display gamut
        </dt>
        <dd className="mt-1 text-sm">
          {wideGamut === null
            ? "reading…"
            : wideGamut
              ? "Display-P3 — the escalated chroma is in effect"
              : "sRGB — the fallback ramp is in effect"}
        </dd>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <dt className="text-xs tracking-wide text-muted-foreground uppercase">
          Motion preference
        </dt>
        <dd className="mt-1 text-sm">
          {reducedMotion === null
            ? "reading…"
            : reducedMotion
              ? "Reduced — durations are 1ms and springs are flat"
              : "No preference — the full curves are in effect"}
        </dd>
      </div>
    </dl>
  )
}

/** A small visual for whatever kind of value this token turned out to be. */
function TokenPreview({ token }: { token: Token }) {
  const shared = "size-9 shrink-0 rounded-md border border-border"

  switch (token.kind) {
    case "color":
      return (
        <span
          aria-hidden
          className={shared}
          style={{ background: `var(${token.property})` }}
        />
      )
    case "easing":
      return <EasingPlot value={token.value} />
    case "duration":
      return (
        <span
          aria-hidden
          className={cn(shared, "flex items-center justify-center bg-muted")}
        >
          <span className="font-mono text-[10px] text-muted-foreground">
            {token.value}
          </span>
        </span>
      )
    case "length":
      return (
        <span
          aria-hidden
          className={cn(shared, "flex items-center justify-center bg-muted")}
        >
          <span
            className="size-5 bg-foreground/70"
            style={{ borderRadius: `var(${token.property})` }}
          />
        </span>
      )
    default:
      return <span aria-hidden className={cn(shared, "bg-muted")} />
  }
}

/**
 * Plot a `linear()` easing from the stops the stylesheet actually declares.
 *
 * The curve is read, never described. `linear()` stops are `<number>` with an
 * optional `<percentage>` input position; unpositioned stops are distributed
 * evenly between their positioned neighbours, which is what the interpolation
 * below reproduces. A curve this component cannot parse renders as an empty
 * frame rather than a straight line, because a straight line is a claim.
 */
function EasingPlot({ value }: { value: string }) {
  const points = useMemo(() => parseLinearEasing(value), [value])
  if (points.length < 2) {
    return (
      <span
        aria-hidden
        className="size-9 shrink-0 rounded-md border border-border bg-muted"
      />
    )
  }

  const path = points
    .map(([x, y]) => `${(x * 36).toFixed(2)},${(36 - y * 30 - 3).toFixed(2)}`)
    .join(" ")

  return (
    <svg
      aria-hidden
      viewBox="0 0 36 36"
      className="size-9 shrink-0 rounded-md border border-border bg-muted"
    >
      <polyline
        points={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function parseLinearEasing(value: string): Array<[number, number]> {
  const match = value.trim().match(/^linear\((.*)\)$/s)
  if (!match?.[1]) return []

  const stops: Array<{ output: number; input: number | null }> = []
  for (const raw of match[1].split(",")) {
    const parts = raw.trim().split(/\s+/)
    const output = Number(parts[0])
    if (!Number.isFinite(output)) continue
    const positions = parts.slice(1).filter((part) => part.endsWith("%"))
    if (positions.length === 0) {
      stops.push({ output, input: null })
    } else {
      for (const position of positions) {
        stops.push({ output, input: Number(position.slice(0, -1)) / 100 })
      }
    }
  }

  if (stops.length < 2) return []
  if (stops[0]!.input === null) stops[0]!.input = 0
  if (stops[stops.length - 1]!.input === null)
    stops[stops.length - 1]!.input = 1

  // Distribute unpositioned stops evenly between their positioned neighbours.
  for (let index = 0; index < stops.length; index += 1) {
    if (stops[index]!.input !== null) continue
    let end = index
    while (end < stops.length && stops[end]!.input === null) end += 1
    const before = stops[index - 1]!.input ?? 0
    const after = stops[end]?.input ?? 1
    const span = end - index + 1
    for (let step = 0; step < end - index; step += 1) {
      stops[index + step]!.input =
        before + ((after - before) * (step + 1)) / span
    }
    index = end - 1
  }

  return stops.map((stop) => [
    Math.max(0, Math.min(1, stop.input ?? 0)),
    stop.output,
  ])
}
