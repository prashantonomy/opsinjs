import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

/* ==========================================================================
   type.tsx — <TypeScaleSpecimen>, <SpaceSpecimen>, <RadiusSpecimen>.

   A specimen shows the thing. That is the whole difference between a
   foundations page that is useful and one that is a table of numbers with a
   paragraph on top.

   Each of these takes a TOKEN NAME, never a value. They render with
   `var(--the-token)`, so whatever the cascade currently resolves — the authored
   fallback in globals.css, the generated ramp from tokens/*.json, a theme
   override, a reader's own zoom — is what appears. A specimen that hard-coded
   "17px" would be wrong the first time the scale moved, and would be wrong
   silently, which is worse.

   THE 200% ROW IS NOT OPTIONAL. foundations/typography/dynamic-type and
   accessibility/text-resizing-and-zoom both promise a 200% demonstration.
   <TypeScaleSpecimen> renders every step twice, at its own size and at double,
   in the same column width — so what the reader sees is not "bigger text" but
   what actually happens: the line wraps, the measure collapses, and a label
   that fitted on one line now takes three. That is the failure mode the
   promise is about.
   ========================================================================== */

export interface TypeScaleSpecimenProps {
  /** The custom property holding the size: `--opsin-text-title-2`. */
  token: string
  /** The semantic name a designer uses: `Title 2`. */
  name: string
  /** What it is for. Be concrete: "a result headline", not "large text". */
  use: string
  /** The line-height token, when the scale has one. */
  leadingToken?: string
  /** The letter-spacing token, when the scale has one. */
  trackingToken?: string
  /** Font weight for the step. */
  weight?: number
  /** The string to set. Health copy by default — it is what these are for. */
  sample?: string
  /** Skip the doubled row on a step where it adds nothing. */
  hide200?: boolean
  className?: string
}

export function TypeScaleSpecimen({
  token,
  name,
  use,
  leadingToken,
  trackingToken,
  weight,
  sample = "Your blood pressure was 148 over 92",
  hide200,
  className,
}: TypeScaleSpecimenProps) {
  const base = {
    fontSize: `var(${token})`,
    lineHeight: leadingToken ? `var(${leadingToken})` : undefined,
    letterSpacing: trackingToken ? `var(${trackingToken})` : undefined,
    fontWeight: weight,
  }

  return (
    <figure
      className={cn("not-prose my-4 border border-border", className)}
      data-opsinjs-specimen="type"
      data-token={token}
    >
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 px-3 py-2">
        <span className="text-sm font-medium">{name}</span>
        <code className="text-xs text-muted-foreground">{token}</code>
      </figcaption>

      <div className="px-3 py-3">
        <p className="m-0" style={base}>
          {sample}
        </p>
      </div>

      {!hide200 ? (
        <div className="border-t border-border/60 px-3 py-3">
          <p className="m-0 mb-1 text-[0.6875rem] text-muted-foreground">
            At 200%
          </p>
          <p
            className="m-0"
            style={{ ...base, fontSize: `calc(var(${token}) * 2)` }}
          >
            {sample}
          </p>
        </div>
      ) : null}

      <p className="m-0 border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
        {use}
      </p>
    </figure>
  )
}

/* --------------------------------------------------------------------------
   <SpaceSpecimen>
   -------------------------------------------------------------------------- */

export interface SpaceSpecimenProps {
  /** The custom property: `--opsin-space-4`. */
  token: string
  /** The step name: `4`. */
  name: string
  /** What it is for. */
  use: string
  /**
   * Mark a step that is a touch-target minimum rather than a spacing step.
   * These must never be reduced by a density setting.
   */
  target?: boolean
  className?: string
}

/**
 * One spacing step, drawn at its real width beside a rule so the size is
 * comparable across steps rather than described.
 */
export function SpaceSpecimen({
  token,
  name,
  use,
  target,
  className,
}: SpaceSpecimenProps) {
  return (
    <div
      className={cn(
        "not-prose flex items-center gap-3 border-b border-border/60 py-2 last:border-b-0",
        className
      )}
      data-opsinjs-specimen="space"
      data-token={token}
    >
      <span
        aria-hidden="true"
        className="h-4 shrink-0 bg-foreground/80"
        style={{ width: `var(${token})`, minWidth: 2 }}
      />
      <span className="min-w-0 flex-1">
        <code className="block text-xs">{token}</code>
        <span className="block text-xs text-muted-foreground">{use}</span>
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {name}
        {target ? (
          <span className="block text-[0.625rem]">touch minimum</span>
        ) : null}
      </span>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <RadiusSpecimen>
   -------------------------------------------------------------------------- */

export interface RadiusSpecimenProps {
  /** The custom property: `--opsin-radius-md`. */
  token: string
  name: string
  use: string
  /**
   * Apply `corner-shape` as well as `border-radius`. The product theme is
   * squircle; browsers without `corner-shape` get a plain rounded rectangle at
   * the same radius, which is a taste difference and never a functional one.
   */
  squircle?: boolean
  className?: string
}

export function RadiusSpecimen({
  token,
  name,
  use,
  squircle = true,
  className,
}: RadiusSpecimenProps) {
  // `corner-shape` is not in React's CSSProperties yet, so the style object is
  // widened rather than the property being dropped. Browsers without it ignore
  // the declaration and keep the border-radius, which is the documented
  // degradation on foundations/shape.
  const swatch: CSSProperties & Record<string, string> = {
    borderRadius: `var(${token})`,
  }
  if (squircle) swatch.cornerShape = "var(--opsin-corner-shape)"

  return (
    <figure
      className={cn("not-prose m-0 flex items-center gap-3 py-2", className)}
      data-opsinjs-specimen="radius"
      data-token={token}
    >
      <span
        aria-hidden="true"
        className="size-14 shrink-0 border border-border bg-muted"
        style={swatch}
      />
      <figcaption className="min-w-0">
        <span className="block text-sm font-medium">{name}</span>
        <code className="block text-xs text-muted-foreground">{token}</code>
        <span className="block text-xs text-muted-foreground">{use}</span>
      </figcaption>
    </figure>
  )
}
