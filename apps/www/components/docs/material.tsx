"use client"

import { useId, useState, type CSSProperties, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/* ==========================================================================
   material.tsx defines <MaterialLadder>.

   Six rungs, from the opaque page to the modal scrim, stacked over a
   deliberately hostile backdrop.

   WHY THE BACKDROP IS HOSTILE. A translucent surface is where a contrast floor
   quietly disappears: the token pair passes when it is measured against a flat
   card, and then the same surface is put over a photograph and the text sitting
   on it is measured against nothing in particular. On a health screen the text
   that becomes unreadable is a number and a verdict. So the ladder is shown
   over a high-frequency, multi-hue field rather than a tasteful grey. The floor
   has to be VISIBLE, not asserted.

   The backdrop is generated in CSS rather than shipped as a photograph. That is
   not a compromise: a real photograph would be one sample, and a reader would
   reasonably ask whether a different one would break it. Overlapping gradients
   at high frequency give a worse case than most photographs and cost nothing.

   TWO TOGGLES, AND BOTH ARE OS PREFERENCES, NOT PREVIEW TOYS.

     Scrim. Every translucent rung has a minimum scrim opacity in
     tokens/material.json. Turning it off shows what the rung looks like without
     the thing that keeps its text legible, which is the argument for the scrim.

     Reduced transparency. `prefers-reduced-transparency: reduce` is a stated
     preference, and app/globals.css already collapses every translucent rung to
     its opaque fallback when it is set. This toggle simulates that for a reader
     who has not set it, so the fallback can be reviewed rather than trusted.
   ========================================================================== */

interface Rung {
  /** Ordinal position on the ladder. Used only for ordering and labelling. */
  index: 0 | 1 | 2 | 3 | 4 | 5
  /**
   * The rung's NAME, which is also its token segment.
   *
   * tokens/material.json addresses rungs by name rather than by number on
   * purpose: a number invites arithmetic like "one more than a card", and this
   * ladder is not arithmetic. Each rung answers a different question about what
   * is behind it, and there is no sense in which `overlay` is `sheet` plus one.
   */
  name: "canvas" | "card" | "raised" | "sheet" | "overlay" | "scrim"
  label: string
  /** The question this rung answers. Straight from the token source. */
  question: string
  /** What it is for, in the reader's terms. */
  use: string
  translucent: boolean
  /** What it collapses to when transparency is reduced. */
  fallback: string
}

const RUNGS: Rung[] = [
  {
    index: 0,
    name: "canvas",
    label: "Canvas",
    question: "What is the page itself?",
    use: "The application background. Nothing is behind it, so nothing shows through it.",
    translucent: false,
    fallback: "Unchanged. There is nothing to reduce.",
  },
  {
    index: 1,
    name: "card",
    label: "Card",
    question: "Is this a distinct piece of content on the page?",
    use: "A grouped block of related values, such as a result or a day's readings. Opaque, bordered, no shadow. The workhorse.",
    translucent: false,
    fallback: "Unchanged.",
  },
  {
    index: 2,
    name: "raised",
    label: "Raised",
    question: "Is this temporarily above the page, but not covering it?",
    use: "A card that has been lifted: a selected row, a dragged tile, a result being acted on.",
    translucent: false,
    fallback: "Unchanged. Elevation here is shadow, not transparency.",
  },
  {
    index: 3,
    name: "sheet",
    label: "Sheet",
    question:
      "Is this covering the page while leaving it recognisable underneath?",
    use: "A bottom sheet or side panel the reader can dismiss. The blur keeps enough of the page visible that they know where they will return to.",
    translucent: true,
    fallback:
      "Opaque card colour, blur removed. Border, shadow and geometry stay. They are what carry the layering once the translucency is gone.",
  },
  {
    index: 4,
    name: "overlay",
    label: "Overlay",
    question: "Is this chrome floating over scrolling content?",
    use: "A sticky header, a filter bar, a popover. The rung most often misused for content that has to stay readable.",
    translucent: true,
    fallback: "Opaque card colour, blur removed.",
  },
  {
    index: 5,
    name: "scrim",
    label: "Scrim",
    question: "Am I trying to make everything behind this unusable on purpose?",
    use: "The dimming layer behind a modal. Its job is to remove the page, not to be looked at.",
    translucent: true,
    fallback: "A denser opaque scrim. It gets darker, never lighter.",
  },
]

/**
 * A material property, with two fallbacks.
 *
 * The named form (`--opsin-material-sheet-bg`) is what
 * `scripts/build-tokens.mts` emits from tokens/material.json. The numbered form
 * is the authored fallback currently in app/globals.css. Asking for both, in
 * that order, means this specimen renders correctly before `pnpm run generate`
 * has ever run AND after it has. Once the two naming schemes have been
 * reconciled, dropping the second form is one edit.
 */
function materialVar(rung: Rung, property: string, fallback: string): string {
  return `var(--opsin-material-${rung.name}-${property}, var(--opsin-material-${rung.index}-${property}, ${fallback}))`
}

type Backdrop = "busy" | "text" | "flat"

const BACKDROPS: Record<Backdrop, { label: string; style: CSSProperties }> = {
  busy: {
    label: "Busy",
    style: {
      backgroundImage: [
        "repeating-conic-gradient(from 15deg, oklch(0.62 0.19 25) 0deg 12deg, oklch(0.86 0.16 95) 12deg 24deg)",
        "repeating-linear-gradient(63deg, oklch(0.45 0.17 250 / 0.75) 0 14px, oklch(0.92 0.13 150 / 0.6) 14px 30px)",
      ].join(", "),
      backgroundSize: "88px 88px, auto",
      backgroundBlendMode: "overlay",
    },
  },
  text: {
    label: "Over text",
    style: { background: "var(--background)" },
  },
  flat: {
    label: "Flat",
    style: { background: "var(--muted)" },
  },
}

export interface MaterialLadderProps {
  /** Start on a particular backdrop. */
  backdrop?: Backdrop
  /** Show only one rung. A rung's own page uses this inline. */
  only?: 0 | 1 | 2 | 3 | 4 | 5
  className?: string
}

export function MaterialLadder({
  backdrop: initialBackdrop = "busy",
  only,
  className,
}: MaterialLadderProps) {
  const id = useId()
  const [backdrop, setBackdrop] = useState<Backdrop>(initialBackdrop)
  const [scrim, setScrim] = useState(true)
  const [reduced, setReduced] = useState(false)

  const rungs =
    only === undefined ? RUNGS : RUNGS.filter((r) => r.index === only)

  return (
    <div
      className={cn("not-prose my-6 border border-border", className)}
      data-opsinjs-specimen="material-ladder"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/60 p-3">
        <fieldset className="m-0 flex items-center gap-1 border-0 p-0">
          <legend className="sr-only">Backdrop</legend>
          <span
            aria-hidden="true"
            className="pr-1 text-xs text-muted-foreground"
          >
            Backdrop
          </span>
          {(Object.keys(BACKDROPS) as Backdrop[]).map((key) => (
            <span key={key} className="contents">
              <input
                type="radio"
                className="sr-only"
                id={`${id}-bg-${key}`}
                name={`${id}-bg`}
                checked={backdrop === key}
                onChange={() => setBackdrop(key)}
              />
              <label
                htmlFor={`${id}-bg-${key}`}
                className={cn(
                  "cursor-pointer border border-border px-2 py-0.5 text-xs",
                  backdrop === key
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {BACKDROPS[key].label}
              </label>
            </span>
          ))}
        </fieldset>

        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={scrim}
            onChange={(event) => setScrim(event.target.checked)}
          />
          Scrim
        </label>

        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={reduced}
            onChange={(event) => setReduced(event.target.checked)}
          />
          Simulate reduced transparency
        </label>
      </div>

      <div
        className="relative overflow-hidden p-4"
        style={BACKDROPS[backdrop].style}
      >
        {backdrop === "text" ? (
          <p
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden p-3 text-sm leading-snug text-foreground opacity-70"
          >
            {Array.from({ length: 12 })
              .map(
                () =>
                  "Your blood pressure was 148 over 92 on 12 March at 08:14. "
              )
              .join("")}
          </p>
        ) : null}

        <ul className="relative m-0 flex list-none flex-col gap-3 p-0">
          {rungs.map((rung) => (
            <li key={rung.index} className="m-0">
              <div
                data-material={rung.name}
                className="border p-3"
                style={{
                  background:
                    reduced && rung.translucent
                      ? "var(--card)"
                      : materialVar(rung, "bg", "var(--card)"),
                  backdropFilter:
                    reduced || !rung.translucent
                      ? "none"
                      : `blur(${materialVar(rung, "blur", "0px")})`,
                  borderColor: materialVar(rung, "border", "transparent"),
                  boxShadow: materialVar(rung, "shadow", "none"),
                  // The scrim is the minimum tint that keeps text on a
                  // translucent rung legible. Opaque rungs take none.
                  ...(rung.translucent && scrim && !reduced
                    ? {
                        backgroundImage:
                          "linear-gradient(oklch(1 0 0 / 0.35), oklch(1 0 0 / 0.35))",
                      }
                    : {}),
                  color:
                    rung.name === "scrim"
                      ? "var(--background)"
                      : "var(--foreground)",
                }}
              >
                <p className="m-0 flex items-baseline gap-2 text-sm font-semibold">
                  <span className="font-mono text-xs opacity-70">
                    {rung.index}
                  </span>
                  {rung.label}
                </p>
                <p className="m-0 text-xs opacity-80">{rung.question}</p>
                <p className="m-0 text-sm">{rung.use}</p>
                {reduced && rung.translucent ? (
                  <p className="m-0 pt-1 text-xs opacity-80">
                    Reduced transparency: {rung.fallback}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="m-0 border-t border-border/60 px-3 py-2 text-[0.6875rem] text-muted-foreground">
        The backdrop is generated in CSS, not photographed, so it is the same
        worst case on every machine. Measured contrast for these pairs is
        published by <code className="text-[0.6875rem]">pnpm run contrast</code>{" "}
        on foundations/materials/the-contrast-floor. This specimen shows you the
        problem, and that page gives you the numbers.
      </p>
    </div>
  )
}

export interface MaterialSurfaceProps {
  /** The rung by name. Never by number. See the note on `Rung.name`. */
  rung: Rung["name"]
  children: ReactNode
  className?: string
}

/** One rung, applied to arbitrary content. Used inline in Foundations prose. */
export function MaterialSurface({
  rung,
  children,
  className,
}: MaterialSurfaceProps) {
  const meta = RUNGS.find((entry) => entry.name === rung) ?? RUNGS[1]
  return (
    <div
      data-material={rung}
      className={cn("not-prose border p-3", className)}
      style={{
        background: materialVar(meta, "bg", "var(--card)"),
        backdropFilter: meta.translucent
          ? `blur(${materialVar(meta, "blur", "0px")})`
          : "none",
        borderColor: materialVar(meta, "border", "var(--border)"),
        boxShadow: materialVar(meta, "shadow", "none"),
      }}
    >
      {children}
    </div>
  )
}
