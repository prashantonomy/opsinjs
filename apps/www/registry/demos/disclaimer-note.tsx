import { DisclaimerNote } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the note in its
 * two placements: inline under the block it qualifies, carrying everything it
 * can hold, and footer ending a surface. Both instances carry synthetic words,
 * so the demo renders warning-free, which is the standard ADR 0009 holds the
 * shipped demo to and the state a developer told to copy it should meet. The
 * missing-words case, which is what a product is most likely to ship by
 * accident, is still made visible at runtime: the component warns and prints
 * that none were supplied whenever a real caller omits them. The demo no longer
 * renders that case, because a demo is the happy case and the absence belongs
 * in an example rather than in the code `/view` renders.
 *
 * THE WORDS ARE OBVIOUSLY SYNTHETIC AND SAY SO OF THEMSELVES. They are not a
 * disclaimer, they are not a draft of one, and they are not a starting point:
 * every sentence below is about the example rather than about any product, so
 * that a reader who copies this file has copied nothing usable and an author
 * who screenshots it has screenshotted nothing quotable (ADR 0012). No
 * emergency number, no jurisdiction, no service name, no clinical claim.
 *
 * Two notes on one surface is a rule this demo breaks knowingly, because it is
 * a gallery rather than a screen. One note per surface is the rule, and the
 * example `disclaimer-note-once-at-the-foot-of-a-surface` is where it is shown.
 */
export default function DisclaimerNoteDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-opsin-8">
      <DisclaimerNote
        icon
        more={{
          label: "Read the placeholder statement",
          href: "#example-destination",
        }}
        textVersion="Example wording, version one"
      >
        Placeholder wording, for layout only. The product that installs this
        component writes the two sentences that belong here, and opsinjs ships
        none of them.
      </DisclaimerNote>

      <DisclaimerNote placement="footer">
        Placeholder wording again, for layout only. This is the footer
        placement, which ends a surface rather than sitting under a single block
        of it. The product still writes the sentence that belongs here, and
        opsinjs ships none of it.
      </DisclaimerNote>
    </div>
  )
}
