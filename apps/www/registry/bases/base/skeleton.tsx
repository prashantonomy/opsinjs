/**
 * Skeleton is the shape of content that has not arrived, and nothing more.
 *
 * THE RULE THIS COMPONENT EXISTS TO ENFORCE. A skeleton must never imply a
 * value. A rounded rectangle sitting where a reading will be, at the width the
 * reading will be, has already told the reader that a reading exists. Sometimes
 * none does, and the surface resolves into an EmptyState saying so.
 * That is why `shape` has four members and none of them is "value", "dial" or
 * "bar", and why a shape outside the four resolves to `text` rather than to
 * whatever is nearest what the caller asked for: `text` is the shape that
 * asserts least.
 *
 * NOT COMPOSABLE. There is no `Skeleton.Block` export and no `Skeleton.Group`
 * export. The parts named in the anatomy are identified by `data-slot`, which
 * is enough to style them and not enough to assemble a value-shaped placeholder
 * out of them. The width, the height and the corner are everything a caller
 * needs to reach, and each is reachable through `className` on the root and
 * through the `data-slot` selectors underneath it.
 *
 * IT ANNOUNCES NOTHING, ON PURPOSE. The root is `aria-hidden`, so a dashboard
 * with eleven skeletons on it is silent rather than saying "loading" eleven
 * times. The polite announcement belongs to the region the skeletons are
 * inside: one `role="status"` on that region, one message. This component
 * deliberately does not mount it, because a component that speaks on the
 * caller's behalf speaks once per instance.
 *
 * IT IS A SERVER COMPONENT, AND `appearAfterMs` IS WHY THAT TOOK WORK. The
 * appearance delay is the one thing here that wants a timer, and a timer would
 * make every skeleton on the page a client component. That would mean the
 * placeholder that exists to stop the layout jumping does not render until
 * JavaScript has loaded, on exactly the connections where the jump is worst. So
 * the delay is CSS: an animation with `animation-fill-mode: backwards` holds
 * the root at `opacity: 0` for the length of `animation-delay` and then fades
 * it in. Animations run on first paint, with no hydration and no JavaScript at
 * all, which is the behaviour a loading placeholder has to have.
 *
 * WHY THIS FILE SHIPS A STYLESHEET, AND WHY IT IS STILL THE SMALLEST ONE
 * POSSIBLE. The sheet does three jobs. Two of them cannot be expressed as a
 * Tailwind utility at all. Holding an element hidden and then revealing it needs
 * a `@keyframes` rule, and no keyframe in Tailwind's defaults has an explicit
 * `from`, so none of them can hold anything. `@starting-style` was the
 * alternative and was turned down: a caller whose browser does not support it
 * would get no delay and no error, which is a prop that silently does nothing.
 * The bounded shimmer needs a keyframe too, and a finite iteration count that
 * Tailwind's `animate-pulse` cannot give. The third job is the text rhythm, and
 * a Tailwind margin utility could express it, so the reason it lives here is a
 * different one: an arbitrary margin utility on the bar could not then be beaten
 * by an author rule on plain source order, whereas a class in this unlayered
 * sheet loses to a later author rule on `[data-slot="skeleton-block"]` with no
 * `!important` needed. So the sheet carries the appearance keyframe with its
 * class, the bounded shimmer keyframe with its rule, and the rhythm class with
 * its `@supports` refinement, and it is emitted on every instance rather than
 * only when `appearAfterMs` is set. React hoists it into the document head and
 * de-duplicates it by `href`, so a screen with fifty skeletons still carries it
 * once. The appearance keyframe stays inert when no delay is set, because
 * nothing applies its class.
 */

import { cn } from "@/lib/utils"

/**
 * The one stylesheet this file ships, holding every rule that cannot be a
 * Tailwind utility: the appearance keyframe with its class, the bounded shimmer
 * keyframe with its class, and the text rhythm class that reserves one line box
 * per bar. The rhythm has to live here rather than as an inline style so an
 * author rule on `[data-slot="skeleton-block"]` can override it on source order
 * without `!important`, which is the escape hatch an inline style could not give.
 *
 * The appearance delay has to work before hydration. `from { opacity: 0 }` plus
 * `animation-fill-mode: backwards` is the whole mechanism: during the delay the
 * element takes the first keyframe's value, and the implicit `to` is the
 * element's own opacity, so nothing here has to know what that is.
 *
 * The reduced-motion handling is not a duplicate of the token layer's. Inside
 * opsinjs `--opsin-duration-fast` already collapses to 1ms under
 * `prefers-reduced-motion`, because `app/product.css` does it below its
 * `@import` and that ordering is load-bearing. In a project that installed this
 * file and does not have the opsinjs token stylesheet, the `var()` falls through
 * to its literal fallback and nothing collapses it, so the component closes the
 * preference itself. The appearance DELAY is untouched in both cases,
 * deliberately: a delay is timing rather than movement, and a reader who asked
 * for less motion did not ask for more flashing. The shimmer takes the stronger
 * gate: it is declared inside a `prefers-reduced-motion: no-preference` query,
 * so under reduce it never runs at all and the static tint is there from the
 * first frame.
 *
 * Every colour in the sheet is a `var()` onto a theme-owned custom property with
 * no literal fallback. A component may not paint a colour nobody has measured,
 * so an install without the opsinjs token sheet drops the gradient and keeps the
 * static tint rather than painting an unmeasured neutral.
 */
const SKELETON_CSS = `@keyframes opsin-skeleton-in {
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
}
@keyframes opsin-skeleton-shimmer {
  from { background-position-x: 100%; }
  to { background-position-x: 0%; }
}
@media (prefers-reduced-motion: no-preference) {
  .opsin-skeleton-shimmer {
    /* The band is a narrow sheen inside a wide fill: fill for the first third,
       the sheen crossing the middle, then fill again for the last third. At a
       300% background size the block's window is one third of the image, so both
       ends of the travel sit entirely inside a fill run and the fill is what is
       painted at rest. At the end position the window is the last third, pure
       fill; at the start it is the first third, pure fill; only mid-sweep does
       the sheen cross the block. The band never interpolates through
       transparency. The sheen moves away from the page in both themes, a darker
       step than the fill in the light theme and a lighter one in the dark theme,
       so no frame of the sweep has less contrast than the static state, which is
       the promise Tailwind's opacity pulse could not make. */
    background-image: linear-gradient(90deg, var(--opsin-placeholder-fill) 0%, var(--opsin-placeholder-fill) 33.333%, var(--opsin-placeholder-sheen) 50%, var(--opsin-placeholder-fill) 66.667%, var(--opsin-placeholder-fill) 100%);
    background-size: 300% 100%;
    background-repeat: no-repeat;
    animation-name: opsin-skeleton-shimmer;
    animation-duration: var(--opsin-duration-shimmer, 1600ms);
    animation-timing-function: var(--opsin-ease-standard, cubic-bezier(0.2, 0, 0, 1));
    /* Two cycles at 1600ms is 3.2 seconds of total movement, under the five
       seconds past which SC 2.2.2 requires a page-level pause, stop or hide
       mechanism that no opsinjs component owns; after the second cycle the
       static tint remains, which is the same end state that shimmer set to
       false gives from the first frame. */
    animation-iteration-count: 2;
    animation-fill-mode: both;
  }
}
.opsin-skeleton-rhythm {
  /* The vertical rhythm of the text and line shapes, as a class in this
     unlayered sheet rather than an inline style. An inline style could not be
     reached by an author rule on [data-slot="skeleton-block"] without
     !important, so the escape hatch the file used to promise did not work; a
     class loses to a later author rule on plain source order, so now it does.
     The fallback below is the floor: (leading - 1) * 0.5em is what is left of a
     body line box once the 1em bar is taken out, half above and half below, so
     each bar's margin box is one body line. It is exact at the body step and
     close at the others, which is the old behaviour a browser without the lh
     unit still lands on. */
  margin-block: calc((var(--opsin-text-body-leading, 1.294) - 1) * 0.5em);
}
@supports (margin-block: calc(1lh - 1em)) {
  /* Where lh is supported (current Chrome, Safari and Firefox) the margin is
     read from the inherited line box, so the bar plus its two margins equal one
     line of the surrounding text at whatever type step the container sets, with
     no precondition on the caller. This is the primary path; the calc above is
     only the fallback. */
  .opsin-skeleton-rhythm { margin-block: calc((1lh - 1em) / 2); }
}`

/**
 * Every shape, written out, because Tailwind reads class names as literal
 * strings. `rounded-${shape}` and `h-[${height}]` generate no CSS at all and
 * render a placeholder with no shape. That is the one defect a reviewer looking
 * at a grey rectangle is least likely to notice.
 *
 * The sizes are in `em` and in `rem` and never in `px`. At 200% text it is the
 * reader's root font size that changes, so a skeleton sized this way takes the
 * space the real content will take AT 200% rather than the space it took at
 * 100%. That is the difference between a placeholder that holds the layout open
 * and one that lets it collapse the moment the text lands.
 */
const SHAPES = {
  /* One line of body text. `1em` is the glyph height and not the line box; the
     rest of the line box is the margin the `opsin-skeleton-rhythm` class adds in
     SKELETON_CSS above, so N of these occupy the height N lines of text will.
     Where the browser supports the `lh` unit that reservation is exact at any
     type step, because the margin is read from the same inherited line box the
     bar's `1em` is read from. On a browser without `lh` it falls back to the
     body step's leading, so it is exact at the body step and close elsewhere. */
  text: "h-[1em] rounded-full",
  line: "h-[1em] w-full rounded-full",
  /* A card, an image, or the footprint where a chart's plotting area will go,
     and it is always a plain rectangle. Never draw a chart-shaped silhouette, an
     axis or a line into it, because a placeholder that looks like a chart has
     told the reader a trend exists before the data has, which is rule 7 of
     health/uncertainty-and-staleness. 4rem is a starting height and nothing
     more. The caller knows what is coming and this component does not, so
     `className` is expected here rather than exceptional. */
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
   * and a value above 24 is lowered to 24. No paragraph a skeleton stands in
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
   * The movement runs twice and then stops, which is under the five seconds past
   * which WCAG 2.2 SC 2.2.2 asks for a page-level pause, stop or hide mechanism
   * that no single component owns. After the second cycle the static tint
   * remains, which is the same end state `shimmer={false}` gives from the first
   * frame, so pass `false` to start there.
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
     exist to turn down. The answer to it therefore has to be a shape that says
     nothing about a number, rather than the nearest available rectangle. */
  const resolved: SkeletonShape = SHAPE_NAMES.includes(shape) ? shape : "text"

  /* Line counts are repaired rather than rejected, at BOTH ends. There is no
     honest rendering of `lines={0}`, because a group that reserves no space
     defeats the component. No OPSIN code covers it, so the repair is silent and
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
    /* The fill and the boundary are a measured placeholder pair, not the general
       muted and border roles, and both are drawn rather than one: two signals
       read better than one on a card, which is the surface a skeleton is usually
       drawn on and the one where a tint alone comes closest to disappearing. The
       boundary is the part held to the non-text floor; look for its number under
       the pair id `neutral.placeholder-line-on-page`. The fill is a tint and
       deliberately does not clear 3:1, because a placeholder dark enough to do so
       is a rectangle asserting that a reading exists, which is the one thing this
       component may never do. */
    "border border-placeholder-line bg-placeholder-fill",
    /* The bounded shimmer defined in the shipped stylesheet, not Tailwind's
       unbounded `animate-pulse`. The class only names the animation; the
       suppression lives in the stylesheet's own `prefers-reduced-motion:
       no-preference` query, so it stays in the same cascade as the preference
       and survives being rendered on the server. Under reduce nothing runs and
       the static tint stays, which is what the specification asks for and also
       what is left once the two cycles finish. */
    shimmer && "opsin-skeleton-shimmer",
    SHAPES[resolved]
  )

  return (
    <div
      data-slot="skeleton"
      /* It conveys nothing. Announcing it even once, let alone once per block,
         is worse than silence, and the region around it owns the single polite
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
      {/* Emitted on every instance now, because the shimmer rule it carries is
          needed whenever `shimmer` is on, which is by default. React hoists it
          into the document head and de-duplicates it by `href`, so a screen with
          fifty skeletons still carries it once. On a React release without style
          hoisting it renders in place instead, which is still valid CSS, so it
          changes nothing about the layout either way. */}
      <style href="opsinjs-skeleton" precedence="default">
        {SKELETON_CSS}
      </style>

      {resolved === "text" ? (
        <div data-slot="skeleton-group" className="flex flex-col">
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              data-slot="skeleton-block"
              className={cn(
                block,
                "opsin-skeleton-rhythm",
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
          className={cn(block, resolved === "line" && "opsin-skeleton-rhythm")}
        />
      )}
    </div>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows the four shapes with a
 * plain caption beside each naming what it stands in for, because the vocabulary
 * IS the component: the thing worth seeing here is which four shapes exist and,
 * more to the point, that none of them is shaped like a number.
 *
 * The captions are prose rather than prop syntax, deliberately. A demo is
 * shipped code held to the component's own standard, and a rendered preview
 * that prints `shape="text"` at the reader teaches the prop name where it should
 * be teaching what the shape is for. The captions are ordinary text and sit
 * outside the skeletons, which are hidden from assistive technology. Nothing in
 * this demo carries a measurement, a unit or a range.
 */
const SHAPE_CAPTIONS = {
  text: "Several lines of body text",
  line: "A single line, such as a label",
  block: "A card, an image or where a chart will go",
  circle: "A circle where an avatar goes",
} satisfies Record<SkeletonShape, string>

export default function SkeletonDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-opsin-6">
      {SHAPE_NAMES.map((shape) => (
        <div key={shape} className="flex flex-col gap-opsin-2">
          <p className="m-0 text-opsin-caption1 text-muted-foreground">
            {SHAPE_CAPTIONS[shape]}
          </p>
          <Skeleton shape={shape} />
        </div>
      ))}
    </div>
  )
}
