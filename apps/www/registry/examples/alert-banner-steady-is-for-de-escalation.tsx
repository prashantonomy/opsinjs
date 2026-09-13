/**
 * The one honest use of `steady` on a banner: saying that something the product
 * raised earlier has stopped being true.
 *
 * WHY THIS LEVEL EXISTS HERE AT ALL. An interruption that says "nothing needs
 * attention" is a strange object, and a banner that can be `steady` is a banner
 * a product will reach for whenever it wants to be noticed. What makes this one
 * legitimate is that it is not an announcement about a reading. It is the
 * withdrawal of an earlier announcement about one. A reader who was told on
 * Tuesday that their device had stopped sending is owed the sentence that says
 * it started again, and no other component in the system delivers it: a Callout
 * carries no level, so it cannot close one.
 *
 * IT STILL SPENDS ONE OF THE TWO the screen is allowed, and it should be gone by
 * the reader's next visit. The component never removes itself, so the product is
 * what stops rendering it. Here that would be a rule saying the resolution
 * notice is shown once, not a dismiss control the reader has to find.
 *
 * NO ACTIONS, AND THAT IS THE LEVEL RATHER THAN AN OMISSION. Actions are
 * required at `attention` and `urgent`, where the banner asserts there is
 * something specific to do. This one asserts the opposite, and a button on it
 * would invent a task out of a resolution. `steady` and `watch` are the two
 * levels where a banner may say something and stop.
 *
 * IT SAYS WHAT HAPPENED BEFORE WHAT IT MEANS, which is the ordering for the
 * quiet half of the ladder. `attention` and `urgent` lead with the instruction
 * instead, because at those two levels there is one; here there is not.
 *
 * The level's word is rendered by the component, inside the heading, with a
 * comma between the word and the subject that exists in the accessibility tree
 * and not on the screen. So this banner announces as "Steady, your device is
 * sending readings again" whatever the caller writes, and the sentence never
 * has to say the word twice.
 *
 * Nothing here is a measurement, and the instants are fixed so the example says
 * the same thing every time it renders.
 */

import { AlertBanner } from "@/registry/base-lyra/ui/alert-banner"

export default function AlertBannerSteadyIsForDeEscalation() {
  return (
    <AlertBanner
      status="steady"
      heading="Your device is sending readings again"
      detectedAt="2026-03-14T10:20:00+00:00"
      now="2026-03-14T11:12:00+00:00"
      locale="en-GB"
      className="w-full max-w-xl"
    >
      Everything taken while it was disconnected has now arrived, so this screen
      is up to date. Nothing is missing from the days it was quiet.
    </AlertBanner>
  )
}
