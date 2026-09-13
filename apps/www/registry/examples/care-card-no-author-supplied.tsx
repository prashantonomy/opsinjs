/**
 * The composition error, shown next to the card it should have been.
 *
 * The two cards below carry the same instruction. The second one names the
 * author; the first one does not, and the difference is the entire
 * specification. A reader who is not told who is asking does not conclude that
 * nobody is: they fill the gap with the most authoritative answer available,
 * which is a clinician who has looked at their results. The product then has no
 * way to withdraw a claim it never explicitly made.
 *
 * So the card renders and admits, in a sentence that is deliberately unlovely.
 * An author who sees it on a screen fixes it; a reader who sees it has at least
 * not been told something untrue. In development it also prints one warning
 * naming the card, because the sentence on screen is easy to miss and the
 * warning is not.
 *
 * The rule to take from this example: an omitted input renders an explicit
 * "we do not have this", never a substituted default and never silence.
 *
 * THE TWO CARDS CARRY THE SAME INSTRUCTION AND THEREFORE THE SAME ACCESSIBLE
 * NAME. That is the subject of the example rather than an oversight, because
 * the instruction is the control variable. But it has a cost worth naming: the
 * card's name is its heading, so a screen-reader user listing the regions
 * on this page hears the same name twice and cannot tell which is which until
 * they read into it. The captions below separate them for anybody reading in
 * order. They do not separate them in a list of landmarks, and nothing
 * available to an example file would.
 */

import { CareCard } from "@/registry/base-lyra/ui/care-card"

export default function CareCardNoAuthorSupplied() {
  return (
    <div className="gap-opsin-6 flex w-full max-w-md flex-col">
      <div className="gap-opsin-2 flex flex-col">
        <p className="text-opsin-footnote m-0 text-muted-foreground">
          With nobody named as asking
        </p>
        <CareCard
          heading="Repeat the example measurement in three months"
          urgency="when-convenient"
          /* Empty, deliberately. This is the state the component is refusing to
             make invisible, and it is one console warning as well as one line on
             the card. */
          attribution=""
          reason="A repeat of this example measurement is due."
        />
      </div>
      <div className="gap-opsin-2 flex flex-col">
        <p className="text-opsin-footnote m-0 text-muted-foreground">
          With the author named
        </p>
        <CareCard
          heading="Repeat the example measurement in three months"
          urgency="when-convenient"
          attribution="An automatic reminder from this example app, not a message from your clinic"
          reason="A repeat of this example measurement is due."
        />
      </div>
    </div>
  )
}
