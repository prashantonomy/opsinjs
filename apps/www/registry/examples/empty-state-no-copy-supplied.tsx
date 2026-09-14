/**
 * This example shows what an EmptyState renders when nobody wrote the body, and
 * what it renders once somebody does.
 *
 * The first card is the component refusing to help. There is no default
 * sentence for an empty health surface, so the omission is stated rather than
 * filled: "There is nothing here yet, and this app does not say why." It is a
 * plain admission. Every friendly line that could go there instead is a
 * claim about the reader's health that the product has not made and cannot
 * support, and an empty list is not a clean bill of health. *Nothing to
 * report*, *you are all caught up* and *all clear* are three such lines.
 *
 * The second card is the same component with two sentences. That is the
 * whole fix, and it is why the first also logs a development warning
 * naming the reason it was given.
 *
 * WHAT THE SECOND CARD IS CAREFUL NOT TO SAY, because a Do exemplar is the
 * sentence somebody copies. It does not congratulate the reader on being
 * finished. "You have worked through everything" is *you are all caught up*
 * with the words changed, and it is on the list above. It does not vouch for
 * the record either: whether anything has been removed from somebody's data is
 * a claim about a system this component cannot see. It states what the queue
 * holds, and what will put something in it.
 *
 * Both are server-rendered: neither action is a handler, so nothing here needs
 * a client boundary. The two columns are a container query rather than the
 * `sm:` breakpoint, because rem inside a media query is pinned to the initial
 * font size and would hold two columns while the text in them doubled.
 */

import { EmptyState } from "@/registry/base-lyra/ui/empty-state"

export default function EmptyStateNoCopySupplied() {
  return (
    <div className="@container w-full">
      <div className="grid w-full max-w-3xl gap-opsin-6 @2xl:grid-cols-2">
        <div className="rounded-opsin-md border border-border">
          <EmptyState reason="nothing-left" title="Nothing left to review" titleLevel={3} />
        </div>

        <div className="rounded-opsin-md border border-border">
          <EmptyState
            reason="nothing-left"
            title="Nothing left to review"
            titleLevel={3}
            action={{ label: "See everything you have added", href: "#example-destination" }}
          >
            There is nothing in the review queue at the moment. Items arrive here
            when this product has something for you to look at, and they stay
            until you have opened them.
          </EmptyState>
        </div>
      </div>
    </div>
  )
}
