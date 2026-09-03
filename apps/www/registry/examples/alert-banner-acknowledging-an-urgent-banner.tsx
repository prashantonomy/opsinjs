"use client"

/**
 * An urgent banner is acknowledged, not dismissed — and the difference is a
 * record the product keeps.
 *
 * THE RULE THIS DEMONSTRATES is the one that costs a product the most to hold.
 * `dismissible` on its own renders nothing at any level: the component never
 * takes itself off the screen, so a control with no `onAcknowledge` would be a
 * control that acknowledges a press and changes nothing. At `urgent` the
 * callback is also the record. A reader who swipes a banner away on a bus has
 * not been informed, and nothing downstream can tell dismissal apart from
 * understanding unless something wrote down which one happened.
 *
 * THE MESSAGE OUTLIVES THE BANNER. What replaces the banner here is not an
 * empty space: the line below it is the message still being available on the
 * screen after the interruption has been taken away. An urgent banner must
 * never be the only place a serious message appears, and the way to see whether
 * a product has honoured that is to acknowledge the banner and look at what is
 * left.
 *
 * ONE ACTION, BECAUSE THIS ONE IS SAME-DAY. The body says the clinic has asked
 * to hear from the reader today, which is the trigger `emergency-and-escalation`
 * uses to enter its own path, and requirement 2 there is one primary route and
 * no competing choices: a second button is a decision, and this is the moment a
 * person is least able to make one. A banner may carry two actions and the
 * two-banner example shows that; a banner carrying a same-day finding may not.
 * The component reports the ceiling and does not enforce the floor, so this is
 * the example drawing the line the component cannot see.
 *
 * WHAT DOES NOT HAPPEN when the banner goes is as important as what does.
 * Nothing announces the removal, and that is right: a live region is for a
 * message arriving, not for one being taken away by the person listening.
 *
 * FOCUS IS NOT MOVED, BUT IT IS DESTROYED, AND THOSE ARE DIFFERENT THINGS. The
 * control the reader pressed leaves the DOM with the banner, so focus falls to
 * `<body>`: a keyboard user is returned to the top of the document, and a
 * screen-reader user's cursor is reset with nothing spoken, because the
 * paragraph that replaces the banner is ordinary content. The consequence lands
 * squarely on this example's own point — the message that outlives the banner
 * is the thing the reader has been sent away from. A product that removes
 * an acknowledged banner owns the recovery: move focus to the element that
 * replaces it, or to the heading of the region it was in. This example does not,
 * on purpose, so that what happens when nobody does is visible rather than
 * described.
 *
 * `press again` is the example's own affordance and would not exist in a
 * product: an acknowledged urgent banner comes back when the condition is still
 * true and the product's rules say it should, which is a decision no component
 * can make. It renders only once the banner is gone, so it is never a second
 * control beside an urgent message.
 *
 * The href is inert. This example renders on its own with no document around
 * it, so the fragment reaches nothing; a product replaces it with the route
 * that actually gets the reader to a person.
 *
 * Nothing here is a measurement. The subject is fictional, there is no number
 * anywhere in it, and the instants are fixed so the example says the same thing
 * every time it renders.
 */

import { useState } from "react"

import { AlertBanner } from "@/registry/base-lyra/ui/alert-banner"
import { Button } from "@/registry/base-lyra/ui/button"

const NOW = "2026-03-14T11:12:00+00:00"

export default function AlertBannerAcknowledgingAnUrgentBanner() {
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <div className="flex w-full max-w-xl flex-col gap-opsin-3">
      {acknowledged ? (
        <p className="m-0 text-opsin-body text-muted-foreground">
          Acknowledged. In a product this is the moment something is written
          down — who saw it, and when — and the message stays reachable on the
          screen it came from.
        </p>
      ) : (
        <AlertBanner
          status="urgent"
          heading="Your example measurement needs someone to look at it today"
          detectedAt="2026-03-14T10:55:00+00:00"
          now={NOW}
          locale="en-GB"
          dismissible
          onAcknowledge={() => setAcknowledged(true)}
          dismissLabel="I have read this"
          actions={[{ label: "Call your clinic", href: "#example-clinic" }]}
        >
          Call your clinic today. This reading is outside the range they asked
          us to tell you about, and they have asked to hear from you the same
          day. Your clinic has not been contacted for you.
        </AlertBanner>
      )}

      {acknowledged ? (
        <Button variant="quiet" onClick={() => setAcknowledged(false)}>
          Show the banner again
        </Button>
      ) : null}
    </div>
  )
}
