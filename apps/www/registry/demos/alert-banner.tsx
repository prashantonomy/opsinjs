import { AlertBanner } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It is ONE banner rather
 * than a row of four, and that is the demo teaching the rule: the escalation
 * budget is one `urgent` per screen and two banners in total, and a specimen
 * sheet of all four levels would break it on the first surface a reader ever
 * sees this component on. The four levels are told apart on the StatusPill
 * page, where the same four words and glyphs are the whole component and
 * nothing is interrupted to show them.
 *
 * It is at `attention` because that is the level where the obligations start:
 * an action is required, the banner announces politely, and the message leads
 * with the instruction rather than with the finding. `steady` and `watch` are
 * the quiet half of the ladder and `urgent` is the half a demo should not
 * rehearse.
 *
 * THE BODY OPENS WITH THE ACTION, which is `clinical-status-semantics` on
 * `attention`: "direct and calm, action first". The DOM order on this surface
 * is fixed at heading, body, actions, so the only place an action can come
 * first is the first sentence of the body. At `steady` and `watch` the
 * order is the other way round, and the two-banner example shows that half.
 *
 * THE SECOND ACTION IS A RULE RATHER THAN A GARNISH. The body reports a
 * comparison against a range this surface has no room to show, and
 * `reference-ranges` is unambiguous that a value compared to a range is a value
 * whose range the reader can see. A banner that makes that comparison carries a
 * route to where the reading and the range are both visible.
 *
 * Both actions navigate rather than acting, which is the form to prefer and the
 * form that keeps this file server-rendered. BOTH HREFS ARE INERT, and that is
 * said here rather than left for the first keyboard user to discover: the demo
 * renders alone at `/view` with no document around it, so the fragments reach
 * nothing and pressing either changes the address and nothing else. A product
 * replaces them with two real destinations.
 *
 * The subject is fictional and carries no number, and the detection instant is
 * fixed (ADR 0012): a demo whose text depends on when the page was built cannot be
 * reviewed twice, and a screenshot of an opsinjs example must never be
 * mistakable for somebody's result.
 */
export default function AlertBannerDemo() {
  return (
    <AlertBanner
      status="attention"
      heading="Your example measurement is outside the range your clinic set"
      detectedAt="2026-03-14T09:40:00+00:00"
      actions={[
        { label: "Contact your clinic", href: "#example-clinic" },
        { label: "See the reading and the range", href: "#example-reading" },
      ]}
      className="w-full max-w-xl"
    >
      Contact your clinic before your next appointment. This reading is outside
      the range they asked us to tell you about.
    </AlertBanner>
  )
}
