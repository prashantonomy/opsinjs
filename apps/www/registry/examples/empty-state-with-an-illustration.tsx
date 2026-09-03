/**
 * An illustration, and everything it is not allowed to do.
 *
 * The picture below is decoration and nothing else. Cover it and the empty
 * state still says what is absent, why, and what to do about it — which is the
 * test: if hiding the graphic loses information, the information was missing
 * from the words and the graphic was doing a job it cannot do for a reader
 * using speech, a reader who has turned images off, or a reader holding a
 * printout.
 *
 * So the component hides it three ways. `aria-hidden` keeps it out of the
 * accessibility tree; `print:hidden` keeps it off paper, where the title and
 * the body are the whole point; and a container query drops it once the
 * surface this component was handed is narrower than 24rem, so the picture
 * goes before any word does. That last one is worth trying: narrow the preview
 * and watch the illustration leave first, inside a card that has not moved.
 *
 * The drawing itself paints with `currentColor` and has no colour of its own.
 * A graphic that carried meaning would owe the non-text contrast floor, and a
 * literal colour cannot be held to anything.
 */

import { EmptyState } from "@/registry/base-lyra/ui/empty-state"

/* Deliberately abstract. A picture of a heart, a chart or a pill bottle beside
   an absence of somebody's own data starts to look like a statement about that
   data, and this one has nothing to say. */
function ExampleMark() {
  return (
    <svg
      viewBox="0 0 64 48"
      className="size-opsin-16 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="58" height="42" rx="6" />
      <path d="M14 33h36" strokeDasharray="4 6" />
      <path d="M14 23h20" strokeDasharray="4 6" />
    </svg>
  )
}

export default function EmptyStateWithAnIllustration() {
  return (
    <div className="w-full max-w-md rounded-opsin-md border border-border">
      <EmptyState
        reason="nothing-yet"
        title="Nothing in your log yet"
        titleLevel={3}
        illustration={<ExampleMark />}
        action={{ label: "Add your first entry", href: "#example-destination" }}
        secondary={{ label: "Read what a log is for", href: "#example-destination" }}
      >
        Entries you add appear here in the order you record them. Nothing has
        been recorded so far, so there is nothing to show.
      </EmptyState>
    </div>
  )
}
