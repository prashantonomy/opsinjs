/**
 * Skeleton — the shape of content that has not arrived, and nothing more.
 *
 * THE RULE THIS COMPONENT EXISTS TO ENFORCE. A skeleton must never imply a
 * value. A rounded rectangle sitting where a reading will be, at the width the
 * reading will be, has already told the reader that a reading exists — and
 * sometimes none does, and the surface resolves into an EmptyState saying so.
 * That is why `shape` has four members and none of them is "value", "dial" or
 * "bar", and why a shape outside the four resolves to `text` rather than to
 * whatever is nearest what the caller asked for: `text` is the shape that
 * asserts least.
 *
 * NOT COMPOSABLE. There is no `Skeleton.Block` export and no `Skeleton.Group`
 * export. The parts named in the anatomy are identified by `data-slot`, which
 * is enough to style them and not enough to assemble a value-shaped placeholder
 * out of them. Everything a caller needs to reach — width, height, the corner —
 * is reachable through `className` on the root and through the `data-slot`
 * selectors underneath it.
 *
 * IT ANNOUNCES NOTHING, ON PURPOSE. The root is `aria-hidden`, so a dashboard
 * with eleven skeletons on it is silent rather than saying "loading" eleven
 * times. The polite announcement belongs to the region the skeletons are
 * inside — one `role="status"` on that region, one message — and this component
 * deliberately does not mount it, because a component that speaks on the
 * caller's behalf speaks once per instance.
 *
 * IT IS A SERVER COMPONENT, AND `appearAfterMs` IS WHY THAT TOOK WORK. The
 * appearance delay is the one thing here that wants a timer, and a timer would
 * make every skeleton on the page a client component — which would mean the
 * placeholder that exists to stop the layout jumping does not render until
 * JavaScript has loaded, on exactly the connections where the jump is worst. So
 * the delay is CSS: an animation with `animation-fill-mode: backwards` holds
 * the root at `opacity: 0` for the length of `animation-delay` and then fades
 * it in. Animations run on first paint, with no hydration and no JavaScript at
 * all, which is the behaviour a loading placeholder has to have.
 *
 * WHY THIS FILE SHIPS A STYLESHEET, AND WHY IT IS THE SMALLEST ONE POSSIBLE.
 * Holding an element hidden and then revealing it cannot be expressed as a
 * Tailwind utility: it needs a `@keyframes` rule, and no keyframe in Tailwind's
 * defaults has an explicit `from`, so none of them can hold anything.
 * `@starting-style` was the alternative and was turned down — a caller whose
 * browser does not support it would get no delay and no error, which is a prop
 * that silently does nothing. The rule below is emitted only when
 * `appearAfterMs` is actually set, and React hoists and de-duplicates it by
 * `href`, so a screen with fifty skeletons carries it once.
 */

import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

/**
 * The appearance delay, as CSS, because it has to work before hydration.
 *
 * `from { opacity: 0 }` plus `animation-fill-mode: backwards` is the whole
 * mechanism: during the delay the element takes the first keyframe's value, and
 * the implicit `to` is the element's own opacity, so nothing here has to know
 * what that is.
 *
 * The reduced-motion block is not a duplicate of the token layer's. Inside
 * opsinjs `--opsin-duration-fast` already collapses to 1ms under
 * `prefers-reduced-motion` — `app/product.css` does it below its `@import`, and
 * that ordering is load-bearing. In a project that installed this file and does
 * not have the opsinjs token stylesheet, the `var()` falls through to its
 * literal fallback and nothing collapses it, so the component closes the
 * preference itself. The DELAY is untouched in both cases, deliberately: a
 * delay is timing rather than movement, and a reader who asked for less motion
 * did not ask for more flashing.
 */
const APPEARANCE_CSS = `@keyframes opsin-skeleton-in {
  from { opacity: 0; }
}
.opsin-skeleton-appear {
  animation-name: opsin-skeleton-in;
  animation-duration: var(--opsin-duration-fast, 140ms);
  animation-timing-function: var(--opsin-ease-standard, cubic-bezier(0.2, 0, 0, 1));
  animation-fill-mode: backwards;
}
@media (prefers-reduced-motion: reduce) {
  .opsin-skeleton-appear { animation-duration: 1ms; }
}`

/**
 * Every shape, written out, because Tailwind reads class names as literal
 * strings. `rounded-${shape}` and `h-[${height}]` generate no CSS at all and
 * render a placeholder with no shape — the one defect a reviewer looking at a
 * grey rectangle is least likely to notice.
 *
 * The sizes are in `em` and in `rem` and never in `px`. At 200% text it is the
 * reader's root font size that changes, so a skeleton sized this way takes the
 * space the real content will take AT 200% rather than the space it took at
 * 100% — which is the difference between a placeholder that holds the layout
 * open and one that lets it collapse the moment the text lands.
 */
const SHAPES = {
  /* One line of body text. `1em` is the glyph height and not the line box; the
     rest of the line box is the margin in TEXT_LINE_RHYTHM below, so N of these
     occupy the height N lines of text will — exactly, where the surrounding
     text is at the body step, and approximately everywhere else. The bar
     follows the INHERITED font size while the rhythm follows the body step's
     leading, and those are the same number only at the body step. */
  text: "h-[1em] rounded-full",
  line: "h-[1em] w-full rounded-full",
  /* A card, an image, a chart's plotting area. 4rem is a starting height and
     nothing more — the caller knows what is coming and this component does not,
     so `className` is expected here rather than exceptional. */
  block: "h-opsin-16 w-full rounded-opsin-md",
  /* An avatar or a thumbnail. Sized from the space scale rather than from the
     target scale: nothing here is tappable, and borrowing a touch-target token
     for a decorative circle is how a target minimum stops meaning anything. */
  circle: "size-opsin-10 rounded-full",
} satisfies Record<NonNullable<SkeletonProps["shape"]>, string>

type SkeletonShape = keyof typeof SHAPES

/**
 * The four, as a list, so the runtime check reads the object's OWN keys.
 *
 * `shape in SHAPES` would answer yes to `"constructor"` and `"toString"`, which
 * is a JavaScript caller's typo turning into a class list built from a
 * function. `Object.keys` cannot reach the prototype, so this cannot either.
 */
const SHAPE_NAMES = Object.keys(SHAPES) as SkeletonShape[]

/**
 * The ceiling on `lines`, and the reason there is one.
 *
 * A text skeleton stands in for a paragraph, and no paragraph a loading state
 * reserves space for runs past this. The number is a bound on an allocation
 * rather than a claim about typography: without it `lines` is the one prop that
 * turns an unchecked count from a caller into an unbounded array in a server
 * render.
 */
const MAX_TEXT_LINES = 24

/**
 * The vertical rhythm of the text shape, taken from the type scale rather than
 * guessed — with one precondition, stated here because the page states it too.
 *
 * `--opsin-text-body-leading` is a unitless multiplier, so `(leading - 1) * 1em`
 * is what is left of a line box once the `1em` bar is taken out of it, and half
 * of that above and below each bar makes each bar's margin box one line box.
 * Flex items do not collapse their margins, so N bars in the group occupy the
 * height of N lines of body text.
 *
 * THE PRECONDITION. The bar is `1em` of the font size it INHERITS, while the
 * multiplier is the body step's leading. Those agree only where the skeleton
 * sits at the body step; in a container at any other step the bar is that
 * step's height and the gap between bars is body's, so the reservation is close
 * rather than exact. The component cannot read the leading of text that is not
 * there yet, so the repair is the caller's: set the spacing through
 * `[data-slot="skeleton-block"]` when the surrounding text is a different step.
 *
 * The fallback is the system's own body leading rather than a generic one, so
 * that an install without the opsinjs token sheet reserves the same space this
 * one does — the same convention the durations in APPEARANCE_CSS follow.
 */
const TEXT_LINE_RHYTHM: CSSProperties = {
  marginBlock: "calc((var(--opsin-text-body-leading, 1.294) - 1) * 0.5em)",
}

export interface SkeletonProps {
  /**
   * The shape being stood in for. There is deliberately no "value", "dial" or
   * "bar" member: a placeholder shaped like a measurement asserts that a
   * measurement is coming, and sometimes none is. A value outside the four
   * resolves to `text`, which is the shape that claims least.
   */
  shape?: "text" | "line" | "block" | "circle"
  /**
   * Number of lines for the text shape, ignored by the other three. The last is
   * rendered shorter, the way a paragraph's last line is. Defaults to 3. The
   * count is repaired at both ends rather than trusted: a value below 1 is
   * raised to 1 rather than rendering a group that reserves no space at all,
   * and a value above 24 is lowered to 24 — no paragraph a skeleton stands in
   * for has more lines than that, and an unbounded count allocates an unbounded
   * array during a server render.
   */
  lines?: number
  /**
   * Delay in milliseconds before the skeleton appears. Content that arrives
   * faster than this never shows one, which removes the flash. Implemented in
   * CSS, so it holds before hydration and with JavaScript switched off.
   */
  appearAfterMs?: number
  /**
   * Movement is a preference, never a signal. It does not encode progress, it
   * does not speed up, and it is suppressed under `prefers-reduced-motion`,
   * which leaves the static tint behind. On by default: a motionless grey
   * rectangle reads as content that did not arrive at least as readily as it
   * reads as content that is arriving.
   *
   * It loops for as long as the skeleton is mounted, and there is no pause,
   * stop or hide control — `prefers-reduced-motion` is an operating-system
   * preference, not the page-level mechanism WCAG 2.2 SC 2.2.2 asks for past
   * five seconds. Pass `false`, or replace the skeleton with words, on a wait
   * long enough for that to matter.
   */
  shimmer?: boolean
  /**
   * Merged onto the root. This is where the size of what is coming goes, and it
   * is expected rather than exceptional: the component knows the vocabulary of
   * shapes and the caller knows the content.
   */
  className?: string
}

export function Skeleton({
  shape = "text",
  lines = 3,
  appearAfterMs,
  shimmer = true,
  className,
}: SkeletonProps) {
  /* A shape outside the vocabulary is refused by resolving to `text`, not
     approximated. This file ships as source into JavaScript projects where a
     type is advice, and `shape="value"` is the exact request the four members
     exist to turn down — so the answer to it has to be a shape that says
     nothing about a number, rather than the nearest available rectangle. */
  const resolved: SkeletonShape = SHAPE_NAMES.includes(shape) ? shape : "text"

  /* Line counts are repaired rather than rejected, at BOTH ends. There is no
     honest rendering of `lines={0}` — a group that reserves no space defeats the
     component — and no OPSIN code covers it, so the repair is silent and
     documented rather than warned about through a channel that does not exist.

     The ceiling is not cosmetic. This is a server component, so the array below
     is allocated during the render of the page rather than in one client tab,
     and it ships as source into JavaScript projects where a type is advice:
     `lines={items.length}` over an unvalidated list is the ordinary way a
     placeholder becomes `RangeError: Invalid array length` (with `Infinity`) or
     an out-of-memory kill (with a large finite count), on the loading path,
     while the reader is already waiting. `Number.isFinite` is the same guard
     `appearAfterMs` gets below. */
  const requested = Number(lines)
  const count = Number.isFinite(requested)
    ? Math.min(Math.max(1, Math.floor(requested)), MAX_TEXT_LINES)
    : 1

  const delay =
    typeof appearAfterMs === "number" &&
    Number.isFinite(appearAfterMs) &&
    appearAfterMs > 0
      ? Math.round(appearAfterMs)
      : 0

  const block = cn(
    /* The fill and the boundary are the only two neutral roles the product
       theme bridges, and both are used rather than one: two weak signals read
       better than one on a card, which is the surface a skeleton is usually
       drawn on and the one where a tint alone comes closest to disappearing. */
    "border border-border bg-muted",
    /* `motion-safe:` rather than a JavaScript media query, so the suppression
       lives in the same cascade as the preference and survives being rendered
       on the server. Under reduce there is no animation at all and the tint
       stays, which is what the specification asks for and also what is left
       when a reader has switched animation off at the operating system. */
    shimmer && "motion-safe:animate-pulse",
    SHAPES[resolved]
  )

  return (
    <div
      data-slot="skeleton"
      /* It conveys nothing. Announcing it — once, let alone once per block — is
         worse than silence, and the region around it owns the single polite
         message that is worth making. */
      aria-hidden="true"
      /* A printed page has no loading state, and a grey rectangle on paper is
         indistinguishable from a printer fault. */
      className={cn(
        "print:hidden",
        delay > 0 && "opsin-skeleton-appear",
        className
      )}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {/* Emitted only when there is a delay to serve, then hoisted into the
          document head and de-duplicated by React under this `href`. On a React
          release without style hoisting it renders in place instead, which is
          still valid CSS and still `display: none`, so it changes nothing about
          the layout either way. */}
      {delay > 0 ? (
        <style href="opsinjs-skeleton" precedence="default">
          {APPEARANCE_CSS}
        </style>
      ) : null}

      {resolved === "text" ? (
        <div data-slot="skeleton-group" className="flex flex-col">
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              data-slot="skeleton-block"
              style={TEXT_LINE_RHYTHM}
              className={cn(
                block,
                /* The last line of a paragraph is short; everything above it
                   fills the measure. With one line there is no paragraph to
                   imitate, so it is not shortened. */
                count > 1 && index === count - 1 ? "w-3/5" : "w-full"
              )}
            />
          ))}
        </div>
      ) : (
        <div
          data-slot="skeleton-block"
          style={resolved === "line" ? TEXT_LINE_RHYTHM : undefined}
          className={block}
        />
      )}
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the four shapes with the
 * name of each beside it, because the vocabulary IS the component: the thing
 * worth seeing here is which four shapes exist and, more to the point, that
 * none of them is shaped like a number.
 *
 * The captions are ordinary text and sit outside the skeletons, which are
 * hidden from assistive technology. Nothing in this demo carries a measurement,
 * a unit or a range.
 */
export default function SkeletonDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-opsin-6">
      {SHAPE_NAMES.map((shape) => (
        <div key={shape} className="flex flex-col gap-opsin-2">
          <p className="m-0 font-mono text-opsin-caption1 text-muted-foreground">
            shape=&quot;{shape}&quot;
          </p>
          <Skeleton shape={shape} />
        </div>
      ))}
    </div>
  )
}
