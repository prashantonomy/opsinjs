"use client"

import { useEffect, useId, useState, type ReactNode } from "react"

import contrast from "@/lib/generated/contrast.json"
import { apiRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { NoDataYet } from "./stub"

/* ==========================================================================
   a11y.tsx — <A11yReport>, <ContrastReport>, <ContrastOracle>, <CvdSimulator>.

   Three of these four report numbers, and the rule for all three is the same:
   opsinjs does not print a contrast figure a human typed. `pnpm contrast` runs
   the hand-written APCA-W3 and WCAG 2.2 implementations in lib/color/ over
   every token pair in both themes, writes lib/generated/contrast.json, and CI
   fails on a regression. Until that has run, these components say so.

   <ContrastReport> READS THAT FILE. It used to render only what an MDX author
   passed as a `pairs` prop, which no page has ever done, so every call site
   printed "has not been generated" over a file that was generated, committed
   and full. The `pairs` prop is still honoured first — it is how a page shows a
   subset the generator does not group — but the default is the measurement.
   The file groups pairs by TOKEN SCOPE, not by component, so a component-scoped
   report still has nothing to show and still says so.

   <ContrastOracle> is the exception and it is not really one. It is a tool, not
   a report: the reader types two colours and gets an answer about THOSE, which
   is a computation rather than a published claim about opsinjs. The WCAG 2.2
   ratio is computed in the page because the formula is short, fixed and
   unambiguous; the APCA Lc comes from POST /api/contrast, which runs the same
   implementation the CI gate does, so the tool and the published tables can
   never quietly disagree.

   <CvdSimulator> uses SVG colour matrices. They are approximations — a real
   simulation of dichromacy is a research instrument and this is a design check.
   What it proves is the only thing worth proving here: whether a status can
   still be read when its hue is gone. If it can only be read in full colour,
   the design has failed the colour-independence rule and no amount of matrix
   accuracy changes that.
   ========================================================================== */

/* --------------------------------------------------------------------------
   <ContrastReport>
   -------------------------------------------------------------------------- */

export interface ContrastPair {
  /** Human name of the pair, e.g. "urgent ink on urgent surface". */
  pair: string
  /** APCA lightness contrast, signed. */
  apcaLc?: number
  /** WCAG 2.2 contrast ratio. */
  wcag?: number
  theme: "light" | "dark"
  /** Whether it clears the published floor for its role. */
  passes?: boolean
}

export interface ContrastReportProps {
  /**
   * A token namespace the generator measures — `category`, `materials`,
   * `neutral` or `status` — or `all` for every measured pair. The authoritative
   * list is the `scopes` array in lib/generated/contrast.json; a name that is
   * not in it renders the empty state naming the ones that are.
   */
  scope?: string
  /** Or a component id, for the pairs that component actually uses. */
  component?: string
  /** Measured pairs, from lib/generated/contrast.json. */
  pairs?: ContrastPair[]
  className?: string
}

/**
 * The measured rows, projected onto the shape the table renders.
 *
 * `theme` is narrowed rather than asserted: JSON gives `string`, and a cast
 * would hide the day the generator emits a third theme.
 */
const MEASURED: (ContrastPair & { scope: string })[] = contrast.pairs.map(
  (row) => ({
    pair: row.pair,
    scope: row.scope,
    theme: row.theme === "dark" ? "dark" : "light",
    apcaLc: row.apcaLc,
    wcag: row.wcag,
    passes: row.passes,
  })
)

/** The scope names the file actually carries, for the empty state to name. */
const MEASURED_SCOPES: string[] = contrast.scopes

/**
 * Which measured rows this call site is asking for.
 *
 * `all` is resolved here rather than in the data because it is a question about
 * the report, not a group the generator emits. Everything else must match a
 * scope name verbatim: guessing that `color` means "the colour scopes" would be
 * this file inventing a grouping and publishing it as a measurement.
 */
function measuredPairs(
  scope: string | undefined,
  component: string | undefined
): ContrastPair[] {
  if (component) return []
  if (!scope) return []
  if (scope === "all") return MEASURED
  return MEASURED.filter((row) => row.scope === scope)
}

/**
 * CI-measured APCA Lc and WCAG 2.2 ratios for every token pair a page or a
 * component uses, in both themes, against the published floor.
 *
 * Both numbers are shown because they answer different questions and disagree
 * in useful ways. WCAG 2.2 is what a conformance report has to cite. APCA
 * models perceived lightness contrast far better at the extremes, which is
 * exactly where a health status colour lives — a bright amber that passes 4.5:1
 * on paper can still be unreadable, and Lc is what tells you so.
 */
export function ContrastReport({
  scope,
  component,
  pairs,
  className,
}: ContrastReportProps) {
  const rows = pairs?.length ? pairs : measuredPairs(scope, component)

  if (!rows.length) {
    return (
      <NoDataYet
        what={
          scope
            ? `The contrast report for ${scope}`
            : component
              ? `The contrast report for ${component}`
              : "This contrast report"
        }
        script="scripts/check-contrast.mts"
        command="pnpm run contrast"
        className={className}
      >
        {MEASURED.length === 0 ? (
          <>
            Every figure here is measured from the token values by{" "}
            <code className="text-xs">scripts/check-contrast.mts</code> into{" "}
            <code className="text-xs">lib/generated/contrast.json</code>, in
            both themes, and a regression fails the build. Nothing on this site
            quotes a contrast number that a person typed.
          </>
        ) : component ? (
          <>
            <code className="text-xs">lib/generated/contrast.json</code> holds{" "}
            {MEASURED.length} measured pairs and groups them by token scope, not
            by component: nothing records which of them{" "}
            <code className="text-xs">{component}</code> puts on screen, so
            running <code className="text-xs">pnpm run contrast</code> again
            adds no row here. The scopes it draws from are measured, and their
            tables are on the Foundations pages.
          </>
        ) : scope ? (
          <>
            <code className="text-xs">lib/generated/contrast.json</code> holds{" "}
            {MEASURED.length} measured pairs, under{" "}
            {MEASURED_SCOPES.join(", ")} — none under{" "}
            <code className="text-xs">{scope}</code>. Either that group is not
            one the generator measures, or the name on this page has drifted
            from the one it emits. Nothing here types a number to close the gap.
          </>
        ) : (
          <>
            This call names neither a scope nor a component, so there is nothing
            to select from the {MEASURED.length} measured pairs in{" "}
            <code className="text-xs">lib/generated/contrast.json</code>. Pass{" "}
            <code className="text-xs">scope</code> — {MEASURED_SCOPES.join(", ")}{" "}
            or <code className="text-xs">all</code>.
          </>
        )}
      </NoDataYet>
    )
  }

  return (
    <div className={cn("not-prose my-4 overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-2 pr-4 font-medium">
              Pair
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Theme
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              APCA Lc
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              WCAG 2.2
            </th>
            <th scope="col" className="py-2 font-medium">
              Floor
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.pair}-${row.theme}`}
              className="border-b border-border/60"
            >
              <td className="py-2 pr-4">{row.pair}</td>
              <td className="py-2 pr-4">{row.theme}</td>
              <td className="py-2 pr-4 font-mono text-xs">
                {row.apcaLc?.toFixed(1) ?? "—"}
              </td>
              <td className="py-2 pr-4 font-mono text-xs">
                {row.wcag ? `${row.wcag.toFixed(2)}:1` : "—"}
              </td>
              <td className="py-2">{row.passes ? "Pass" : "Below floor"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <A11yReport>
   -------------------------------------------------------------------------- */

export interface A11yReportProps {
  name?: string
  /** Number of checks run. */
  tested?: number
  passed?: number
  conditional?: number
  failed?: number
  /** WCAG success criteria this component is assessed against. */
  criteria?: string[]
  /** The version last tested. */
  version?: string
  /** ISO date. */
  date?: string
  className?: string
}

/**
 * Per-component conformance: how many checks, how many passed, which success
 * criteria, and when it was last tested.
 *
 * The `conditional` count is the honest one and the one most conformance tables
 * hide. A component can be accessible only if the consuming team supplies an
 * accessible name, or only if the surrounding heading structure is sane. Those
 * are not passes and they are not failures — collapsing them into either is how
 * a conformance report becomes a marketing document.
 */
export function A11yReport({
  name,
  tested,
  passed,
  conditional,
  failed,
  criteria,
  version,
  date,
  className,
}: A11yReportProps) {
  if (tested === undefined) {
    return (
      <NoDataYet
        what={name ? `The conformance report for ${name}` : "This report"}
        script="scripts/check-contrast.mts"
        className={className}
      >
        No conformance run has been recorded for this component. The
        accessibility bar it has to clear is stated on this page as a
        requirement, which is a different kind of claim; printing a figure here
        would imply a test that was never run.
      </NoDataYet>
    )
  }

  return (
    <div className={cn("not-prose my-4 border border-border p-4", className)}>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Checks</dt>
          <dd className="m-0 font-mono">{tested}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Pass</dt>
          <dd className="m-0 font-mono">{passed ?? 0}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Conditional</dt>
          <dd className="m-0 font-mono">{conditional ?? 0}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Fail</dt>
          <dd className="m-0 font-mono">{failed ?? 0}</dd>
        </div>
      </dl>
      {criteria?.length ? (
        <p className="m-0 mt-3 text-xs text-muted-foreground">
          Assessed against {criteria.join(", ")}.
        </p>
      ) : null}
      <p className="m-0 mt-1 text-xs text-muted-foreground">
        {version ? `Version ${version}. ` : null}
        {date ? `Last tested ${date}.` : null}
      </p>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <ContrastOracle>
   -------------------------------------------------------------------------- */

/** sRGB hex or `rgb()` → 0–255 triple. Returns null for anything else. */
function parseColor(input: string): [number, number, number] | null {
  const value = input.trim()
  const hex = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const digits = hex[1]
    const full =
      digits.length === 3
        ? digits
            .split("")
            .map((d) => d + d)
            .join("")
        : digits
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ]
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/i)
  if (rgb) {
    const parts = rgb[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map(Number)
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      return [parts[0], parts[1], parts[2]]
    }
  }
  return null
}

/** WCAG 2.2 relative luminance. The formula, unchanged since WCAG 2.0. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function wcagRatio(
  fg: [number, number, number],
  bg: [number, number, number]
): number {
  const a = relativeLuminance(fg)
  const b = relativeLuminance(bg)
  const [light, dark] = a > b ? [a, b] : [b, a]
  return (light + 0.05) / (dark + 0.05)
}

export interface ContrastOracleProps {
  defaultForeground?: string
  defaultBackground?: string
  /** Compact form for use inline in a Foundations page. */
  compact?: boolean
  className?: string
}

/**
 * Type two colours, get an answer.
 *
 * Used inline in Foundations and full-screen at /playground/contrast. The WCAG
 * ratio is computed here; the APCA Lc is fetched from POST /api/contrast so
 * that the tool and the CI gate share one implementation. If that route is not
 * available the Lc cell says so rather than guessing, because a wrong Lc is
 * worse than a missing one.
 */
export function ContrastOracle({
  defaultForeground = "#3d3d3d",
  defaultBackground = "#ffffff",
  compact,
  className,
}: ContrastOracleProps) {
  const id = useId()
  const [fg, setFg] = useState(defaultForeground)
  const [bg, setBg] = useState(defaultBackground)
  /**
   * The Lc answer is stored WITH the pair it belongs to, so a slow response for
   * an old pair can never be shown beside a new one. Everything else is derived
   * during render rather than pushed into state from the effect — the effect's
   * only job is the request.
   */
  const [answer, setAnswer] = useState<{
    key: string
    lc: number | null
  } | null>(null)

  const fgRgb = parseColor(fg)
  const bgRgb = parseColor(bg)
  const ratio = fgRgb && bgRgb ? wcagRatio(fgRgb, bgRgb) : null
  const key = `${fg}|${bg}`

  useEffect(() => {
    const requestKey = `${fg}|${bg}`
    if (!parseColor(fg) || !parseColor(bg)) return
    let cancelled = false
    fetch(apiRoutes.contrast(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fg, bg }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { apcaLc?: number }) => {
        if (cancelled) return
        setAnswer({
          key: requestKey,
          lc: typeof data.apcaLc === "number" ? data.apcaLc : null,
        })
      })
      .catch(() => {
        if (!cancelled) setAnswer({ key: requestKey, lc: null })
      })
    return () => {
      cancelled = true
    }
  }, [fg, bg])

  const settled = answer?.key === key
  const lc = settled ? answer.lc : null
  const lcState: "idle" | "loading" | "unavailable" =
    !fgRgb || !bgRgb
      ? "idle"
      : !settled
        ? "loading"
        : lc === null
          ? "unavailable"
          : "idle"

  return (
    <div
      className={cn("not-prose my-6 border border-border", className)}
      data-opsinjs-tool="contrast-oracle"
    >
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs" htmlFor={`${id}-fg`}>
          Foreground
          <span className="flex items-center gap-2">
            <input
              id={`${id}-fg`}
              value={fg}
              onChange={(event) => setFg(event.target.value)}
              spellCheck={false}
              className="w-full border border-border px-2 py-1 font-mono text-sm"
            />
            <span
              aria-hidden="true"
              className="size-7 shrink-0 border border-border"
              style={{ background: fg }}
            />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs" htmlFor={`${id}-bg`}>
          Background
          <span className="flex items-center gap-2">
            <input
              id={`${id}-bg`}
              value={bg}
              onChange={(event) => setBg(event.target.value)}
              spellCheck={false}
              className="w-full border border-border px-2 py-1 font-mono text-sm"
            />
            <span
              aria-hidden="true"
              className="size-7 shrink-0 border border-border"
              style={{ background: bg }}
            />
          </span>
        </label>
      </div>

      {!compact ? (
        <div
          className="border-y border-border/60 px-4 py-6"
          style={{ background: bg, color: fg }}
        >
          <p className="m-0 text-2xl leading-tight font-semibold">
            Your reading is 148/92
          </p>
          <p className="m-0 text-sm">
            Higher than the range your clinic set for you.
          </p>
        </div>
      ) : null}

      <dl className="m-0 grid grid-cols-2 gap-4 p-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">WCAG 2.2 ratio</dt>
          <dd className="m-0 font-mono text-lg">
            {ratio ? `${ratio.toFixed(2)}:1` : "—"}
          </dd>
          <dd className="m-0 text-xs text-muted-foreground">
            {ratio
              ? ratio >= 4.5
                ? "Clears 1.4.3 for body text."
                : ratio >= 3
                  ? "Large text only. Below the floor for body text."
                  : "Below every WCAG 2.2 text threshold."
              : "Enter a hex or rgb() colour."}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">APCA Lc</dt>
          <dd className="m-0 font-mono text-lg">
            {lcState === "loading"
              ? "…"
              : lcState === "unavailable"
                ? "—"
                : lc !== null
                  ? lc.toFixed(1)
                  : "—"}
          </dd>
          <dd className="m-0 text-xs text-muted-foreground">
            {lcState === "unavailable" ? (
              <>
                <code className="text-xs">POST {apiRoutes.contrast()}</code> did
                not answer, so no Lc is shown. It runs the same implementation
                as <code className="text-xs">pnpm run contrast</code>.
              </>
            ) : (
              "Perceptual lightness contrast. Polarity-sensitive: swapping the two colours changes it."
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <CvdSimulator>
   -------------------------------------------------------------------------- */

const CVD_FILTERS = {
  protanopia: "0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0",
  deuteranopia: "0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0",
  tritanopia: "0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0",
  grayscale:
    "0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0",
} as const

type CvdMode = keyof typeof CVD_FILTERS | "none"

const CVD_LABELS: Record<CvdMode, string> = {
  none: "Full colour",
  protanopia: "Protanopia",
  deuteranopia: "Deuteranopia",
  tritanopia: "Tritanopia",
  grayscale: "Greyscale",
}

export interface CvdSimulatorProps {
  /** Anything: a preview, a colour ramp, a status ladder. */
  children: ReactNode
  /** Show all five side by side instead of one at a time. */
  grid?: boolean
  className?: string
}

/**
 * Renders its children under simulated protanopia, deuteranopia, tritanopia and
 * greyscale, to prove colour independence rather than assert it.
 *
 * The greyscale panel is the one that matters most and the one people skip.
 * Roughly the same test is applied by a photocopier, a phone in bright sun and
 * a printed review pack. If the four clinical status levels are only
 * distinguishable in full colour, the design has failed — which is why every
 * opsinjs status ships with a word and, where the layout allows, an icon.
 */
export function CvdSimulator({ children, grid, className }: CvdSimulatorProps) {
  const id = useId()
  const [mode, setMode] = useState<CvdMode>("none")
  const modes = Object.keys(CVD_LABELS) as CvdMode[]

  return (
    <div className={cn("not-prose my-6 border border-border", className)}>
      <svg
        aria-hidden="true"
        focusable="false"
        className="absolute size-0"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          {(Object.keys(CVD_FILTERS) as (keyof typeof CVD_FILTERS)[]).map(
            (key) => (
              <filter
                key={key}
                id={`${id}-${key}`}
                colorInterpolationFilters="sRGB"
              >
                <feColorMatrix type="matrix" values={CVD_FILTERS[key]} />
              </filter>
            )
          )}
        </defs>
      </svg>

      {!grid ? (
        <fieldset className="m-0 flex flex-wrap items-center gap-1 border-0 border-b border-border/60 p-3">
          <legend className="sr-only">Colour vision simulation</legend>
          {modes.map((value) => (
            <span key={value} className="contents">
              <input
                type="radio"
                className="sr-only"
                id={`${id}-r-${value}`}
                name={`${id}-mode`}
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              <label
                htmlFor={`${id}-r-${value}`}
                className={cn(
                  "cursor-pointer border border-border px-2 py-0.5 text-xs",
                  mode === value
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {CVD_LABELS[value]}
              </label>
            </span>
          ))}
        </fieldset>
      ) : null}

      {grid ? (
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {modes.map((value) => (
            <figure key={value} className="m-0 border border-border p-3">
              <figcaption className="mb-2 text-xs text-muted-foreground">
                {CVD_LABELS[value]}
              </figcaption>
              <div
                style={
                  value === "none"
                    ? undefined
                    : { filter: `url(#${id}-${value})` }
                }
              >
                {children}
              </div>
            </figure>
          ))}
        </div>
      ) : (
        <div
          className="p-4"
          style={
            mode === "none" ? undefined : { filter: `url(#${id}-${mode})` }
          }
        >
          {children}
        </div>
      )}

      <p className="m-0 border-t border-border/60 px-3 py-2 text-[0.6875rem] text-muted-foreground">
        Simulated with SVG colour matrices. Close enough to answer the design
        question — can this still be read without hue — and not a clinical
        instrument. The audited version is{" "}
        <code className="text-[0.6875rem]">lib/color/cvd.ts</code>.
      </p>
    </div>
  )
}
