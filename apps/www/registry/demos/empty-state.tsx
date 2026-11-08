import { EmptyState } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows three reasons.
 * Two are the hardest to keep apart: `nothing-yet`, where the reader can fix
 * the emptiness, and `not-enough`, where the product has declined to draw
 * something and owes an explanation of what it is waiting for. The third is
 * `could-not-load`, the error state, which must never be mistaken for either:
 * the fetch failed, the readings are not gone, and the surface says so and
 * offers a way to try again.
 *
 * The measurement is fictional, and there is no count of days, no count of
 * readings and no number of any kind in the copy (ADR 0012). A minimum window
 * is a per-metric rule the consuming product declares and opsinjs ships none;
 * a threshold in a demo is a threshold somebody copies.
 *
 * The two columns are a CONTAINER query and not the `sm:` breakpoint. Everything
 * inside them is in rem or ch and follows the reader's text size, but rem inside
 * a media query resolves against the initial font size rather than the root's,
 * so a `sm:` split would stay pinned at one viewport width while every glyph in
 * it doubled. The shipped layout should respond the way the component does.
 *
 * A container query measures the nearest ancestor container and never the
 * element that declares one, so the `@container` and the grid it governs are
 * two elements here rather than one. Put both classes on a single element and
 * the split silently never fires, because `@2xl:grid-cols-2` then has no
 * ancestor container to measure and falls back to a single column at every
 * width.
 */
export default function EmptyStateDemo() {
  return (
    <div className="@container w-full">
      <div className="grid w-full max-w-3xl gap-opsin-6 @2xl:grid-cols-2">
        <EmptyState
          reason="nothing-yet"
          title="No readings yet"
          titleLevel={3}
          action={{ label: "Add a reading", href: "#example-destination" }}
        >
          Once you add your first example measurement it will be here, with
          whatever range this product compares it against.
        </EmptyState>

        <EmptyState
          reason="not-enough"
          title="Not enough readings for a trend yet"
          titleLevel={3}
        >
          A trend needs more readings than there are so far, and this product
          sets how many. Nothing is drawn until then, because a line through too
          few points suggests a direction the readings do not support.
        </EmptyState>

        <EmptyState
          reason="could-not-load"
          title="We could not load your readings"
          titleLevel={3}
          action={{ label: "Try again", href: "#example-destination" }}
        >
          We could not reach the place these readings are stored. Your readings
          are safe and nothing has been lost. Try again.
        </EmptyState>
      </div>
    </div>
  )
}
