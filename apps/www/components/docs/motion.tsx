"use client"

import { useId, useMemo, useState, useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

/* ==========================================================================
   motion.tsx — <MotionCurve> and <MotionDemo>.

   opsinjs expresses springs as `linear()` easing tokens rather than as
   per-component spring configuration. The reason is that a spring is a physical
   description — stiffness, damping, mass — and a design system that ships
   springs as configuration ends up with every component re-tuning them until
   nothing on the screen agrees about how the product moves. `linear()` freezes
   the physics into a token, so a spring is a decision taken once.

   The cost is that a linear() string is unreadable: fifty numbers. <MotionCurve>
   pays that cost back by plotting it, and <MotionDemo> plays it on a real
   element.

   THE REDUCED-MOTION TOGGLE IS THE POINT OF <MotionDemo>. Every motion token
   documents what it degrades to under `prefers-reduced-motion: reduce`, and a
   documented degradation nobody can see is a claim. The toggle makes it
   observable: the element still arrives, it simply arrives immediately. Nothing
   is removed, because a state change that silently stops happening is a
   different and worse accessibility bug than one that happens too fast.
   ========================================================================== */

/**
 * True once the component has hydrated.
 *
 * `useSyncExternalStore` with a never-firing subscription is the sanctioned way
 * to ask "am I on the client yet" without pushing a boolean through an effect:
 * the server snapshot is `false`, the client snapshot is `true`, React swaps
 * them during hydration, and nothing calls setState inside an effect to make it
 * happen. Anything that has to read `window`, `document` or `CSS.supports`
 * during render is gated on it.
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  )
}

/** A subscription that never fires. Module-level so its identity is stable. */
function subscribeNever(): () => void {
  return () => {}
}

/** One point on the curve: progress in, output out, both 0–1. */
interface CurvePoint {
  t: number
  v: number
}

/**
 * Parse a CSS `linear()` easing into plottable points.
 *
 * The grammar allows a bare number, a number with one stop position, or a
 * number with two (which duplicates the value across a flat span). Positions
 * that are omitted are distributed evenly between the neighbours that have one
 * — which is exactly what the CSS spec says the browser does, so the plot and
 * the animation agree.
 */
export function parseLinearEasing(value: string): CurvePoint[] {
  const inner = value.match(/linear\(([^)]*)\)/i)?.[1]
  if (!inner) return []

  const raw: { v: number; t?: number }[] = []
  for (const part of inner.split(",")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) continue
    const v = Number.parseFloat(tokens[0])
    if (!Number.isFinite(v)) continue
    const stops = tokens
      .slice(1)
      .map((token) => Number.parseFloat(token) / 100)
      .filter((n) => Number.isFinite(n))
    if (stops.length === 0) {
      raw.push({ v })
    } else {
      for (const t of stops) raw.push({ v, t })
    }
  }

  if (raw.length === 0) return []
  if (raw[0].t === undefined) raw[0].t = 0
  if (raw[raw.length - 1].t === undefined) raw[raw.length - 1].t = 1

  // Fill the gaps between anchored stops.
  let anchor = 0
  for (let i = 1; i < raw.length; i += 1) {
    if (raw[i].t === undefined) continue
    const span = i - anchor
    const from = raw[anchor].t ?? 0
    const to = raw[i].t ?? 1
    for (let j = 1; j < span; j += 1) {
      raw[anchor + j].t = from + ((to - from) * j) / span
    }
    anchor = i
  }

  return raw.map((point) => ({ t: point.t ?? 0, v: point.v }))
}

/**
 * A damped spring, sampled. Used when a token's source parameters are known and
 * the generated `linear()` has not been produced yet, so the curve on a
 * Foundations page is never blank.
 */
export function sampleSpring(
  stiffness: number,
  damping: number,
  mass = 1,
  samples = 60
): CurvePoint[] {
  const w0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  // Settle when the envelope has decayed to 0.1% of the initial displacement.
  const duration = zeta < 1 ? -Math.log(0.001) / (zeta * w0) : 6 / w0
  const points: CurvePoint[] = []

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples
    const time = t * duration
    let v: number
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta)
      v =
        1 -
        Math.exp(-zeta * w0 * time) *
          (Math.cos(wd * time) + ((zeta * w0) / wd) * Math.sin(wd * time))
    } else {
      v = 1 - Math.exp(-w0 * time) * (1 + w0 * time)
    }
    points.push({ t, v })
  }
  return points
}

/* --------------------------------------------------------------------------
   <MotionCurve>
   -------------------------------------------------------------------------- */

export interface MotionCurveProps {
  /** The easing token to plot: `--opsin-ease-spring`. */
  token?: string
  /** Or the spring parameters, when the token has not been generated. */
  stiffness?: number
  damping?: number
  mass?: number
  className?: string
}

/**
 * Plots an easing token as a curve, with the overshoot visible.
 *
 * The dashed line at 1 is what makes the plot worth having: a spring that
 * overshoots crosses it and comes back, and a reader can see immediately
 * whether this token is one that will make a health value appear to move past
 * its target and settle — which is charming on a toggle and unacceptable on a
 * number somebody is about to act on.
 */
export function MotionCurve({
  token = "--opsin-ease-spring",
  stiffness,
  damping,
  mass,
  className,
}: MotionCurveProps) {
  const isClient = useIsClient()

  /**
   * Read during render rather than pushed in from an effect. The token's value
   * is a property of the stylesheet, not of any state this component owns, so
   * the only thing that has to wait is hydration — and `useIsClient` is what
   * waits, keeping the server and the first client render identical.
   */
  const points = useMemo<CurvePoint[]>(() => {
    if (!isClient) return []
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(token)
      .trim()
    const parsed = parseLinearEasing(resolved)
    if (parsed.length > 1) return parsed
    if (stiffness && damping) return sampleSpring(stiffness, damping, mass)
    return []
  }, [isClient, token, stiffness, damping, mass])

  const width = 320
  const height = 160
  const padding = 12
  const min = Math.min(0, ...points.map((p) => p.v))
  const max = Math.max(1, ...points.map((p) => p.v))
  const scaleY = (v: number) =>
    height - padding - ((v - min) / (max - min || 1)) * (height - padding * 2)
  const scaleX = (t: number) => padding + t * (width - padding * 2)

  return (
    <figure
      className={cn("not-prose my-6 border border-border p-3", className)}
      data-opsinjs-specimen="motion-curve"
    >
      {points.length > 1 ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full max-w-sm"
          role="img"
          aria-label={`Easing curve for ${token}. Progress on the horizontal axis, output on the vertical.`}
        >
          <line
            x1={padding}
            x2={width - padding}
            y1={scaleY(1)}
            y2={scaleY(1)}
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeWidth={1}
            opacity={0.35}
          />
          <line
            x1={padding}
            x2={width - padding}
            y1={scaleY(0)}
            y2={scaleY(0)}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.2}
          />
          <polyline
            points={points
              .map((p) => `${scaleX(p.t)},${scaleY(p.v)}`)
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          />
        </svg>
      ) : (
        <p className="m-0 text-sm text-muted-foreground">
          <code className="text-xs">{token}</code> does not resolve to a{" "}
          <code className="text-xs">linear()</code> value in this theme, and no
          spring parameters were given. Curves are generated from{" "}
          <code className="text-xs">tokens/motion.json</code> by{" "}
          <code className="text-xs">scripts/build-tokens.mts</code>.
        </p>
      )}
      <figcaption className="mt-2 text-xs text-muted-foreground">
        <code className="text-xs">{token}</code>. The dashed line is the target;
        anything above it is overshoot.
      </figcaption>
    </figure>
  )
}

/* --------------------------------------------------------------------------
   <MotionDemo>
   -------------------------------------------------------------------------- */

export interface MotionDemoProps {
  /** The easing token to replay. */
  easing?: string
  /** The duration token to use. */
  duration?: string
  /** What moves: a slide, a scale, or a cross-fade. */
  property?: "translate" | "scale" | "fade"
  /** What this motion is used for, one phrase. */
  label?: string
  className?: string
}

export function MotionDemo({
  easing = "--opsin-ease-spring",
  duration = "--opsin-duration-base",
  property = "translate",
  label,
  className,
}: MotionDemoProps) {
  const id = useId()
  const [on, setOn] = useState(false)
  const [reduced, setReduced] = useState(false)

  const transform =
    property === "translate"
      ? on
        ? "translateX(calc(100% - 3rem))"
        : "translateX(0)"
      : property === "scale"
        ? on
          ? "scale(1)"
          : "scale(0.6)"
        : undefined

  return (
    <div
      className={cn("not-prose my-6 border border-border", className)}
      data-opsinjs-specimen="motion-demo"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 p-3">
        <button
          type="button"
          onClick={() => setOn((value) => !value)}
          className="border border-border px-2 py-1 text-xs hover:bg-muted"
        >
          {on ? "Send it back" : "Play"}
        </button>
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={reduced}
            onChange={(event) => setReduced(event.target.checked)}
            aria-describedby={`${id}-note`}
          />
          Simulate reduced motion
        </label>
        {label ? (
          <span className="text-xs text-muted-foreground">{label}</span>
        ) : null}
      </div>

      <div className="overflow-hidden bg-muted/30 p-6">
        <div
          className="flex size-12 items-center justify-center bg-foreground text-xs text-background"
          style={{
            transform,
            opacity: property === "fade" ? (on ? 1 : 0.15) : 1,
            transitionProperty: "transform, opacity",
            // Reduced motion collapses the duration and flattens the curve. It
            // does NOT remove the transition: the element still arrives.
            transitionDuration: reduced ? "1ms" : `var(${duration})`,
            transitionTimingFunction: reduced
              ? "linear(0, 1)"
              : `var(${easing})`,
          }}
        >
          148
        </div>
      </div>

      <p
        id={`${id}-note`}
        className="m-0 border-t border-border/60 px-3 py-2 text-[0.6875rem] text-muted-foreground"
      >
        <code className="text-[0.6875rem]">{easing}</code> ·{" "}
        <code className="text-[0.6875rem]">{duration}</code>. Under{" "}
        <code className="text-[0.6875rem]">prefers-reduced-motion: reduce</code>{" "}
        this becomes 1ms with a flat curve — the element still moves, it simply
        arrives at once. The checkbox simulates the preference; if you have
        actually set it, app/globals.css has already applied it and the two
        states will look the same.
      </p>
    </div>
  )
}
