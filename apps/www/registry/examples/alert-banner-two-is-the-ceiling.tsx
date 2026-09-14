/**
 * The escalation budget, drawn at the line rather than described.
 *
 * TWO BANNERS IS THE CEILING FOR A WHOLE SCREEN, and one of them may be
 * `urgent`. This example sits exactly at the limit so the limit is something a
 * reader can see: a third banner here would not be a busier screen, it would be
 * a screen that has taught its reader to scroll past the second one. That
 * lesson does not wear off in time for the banner that matters.
 *
 * THE MORE SERIOUS ONE IS FIRST, and that is the second rule on show. A reader
 * meets banners in DOM order, whether they are looking or listening, so the
 * order is the product saying which of the two it would rather they read. When
 * a product's own rules produce three, the repair is to merge them into one
 * banner that names the most serious first, rather than to render all three and
 * hope.
 *
 * Neither banner announces itself. `attention` carries a polite live region and
 * `watch` carries none, and both of these are present when the surface loads,
 * which is the case screen readers do not announce as a change. That is the
 * behaviour the specification asks for and it is the reason a demo of two
 * banners is not a demo of two interruptions.
 *
 * THE TWO BODIES ARE ORDERED DIFFERENTLY ON PURPOSE. The `attention` banner
 * opens with the instruction, which is what `clinical-status-semantics` asks
 * for at that level and above; the `watch` banner opens with what happened,
 * because at `watch` there is nothing specific to do yet and an instruction
 * first would invent one. The first banner also carries a route to where the
 * reading and the range are both visible, which is the rule for any banner that
 * reports a comparison against a range it has no room to show.
 *
 * All three actions navigate rather than acting, so this example is
 * server-rendered and shows the form to prefer: a destination survives a new
 * tab, a copied address and a screen reader's list of links. The hrefs are
 * inert. The example renders with no document around it, so the fragments
 * reach nothing.
 *
 * Nothing here is a measurement. The subject is fictional, there is no number
 * anywhere in it, and the detection instants are fixed so the example says the
 * same thing every time it renders.
 */

import { AlertBanner } from "@/registry/base-lyra/ui/alert-banner"

export default function AlertBannerTwoIsTheCeiling() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-opsin-3">
      <AlertBanner
        status="attention"
        heading="Your example measurement is outside the range your clinic set"
        detectedAt="2026-03-14T09:40:00+00:00"
        actions={[
          { label: "Contact your clinic", href: "#example-clinic" },
          { label: "See the reading and the range", href: "#example-reading" },
        ]}
      >
        Contact your clinic before your next appointment. This reading is
        outside the range they asked us to tell you about.
      </AlertBanner>

      <AlertBanner
        status="watch"
        heading="Your device has not sent anything since Tuesday"
        detectedAt="2026-03-14T07:05:00+00:00"
        actions={[{ label: "Check the connection", href: "#example-device" }]}
      >
        Readings taken after Tuesday may be missing from this screen. Nothing
        that arrived before then has changed.
      </AlertBanner>
    </div>
  )
}
