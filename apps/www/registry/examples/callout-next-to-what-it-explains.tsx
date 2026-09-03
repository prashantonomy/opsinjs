/**
 * The primary use: one callout, immediately under the thing it annotates.
 *
 * Two rules are visible here and both are about restraint.
 *
 * ONE PER SURFACE. Set-apart content that is everywhere is not set apart, and a
 * reader who meets four boxes down one screen reads none of them. The rule is
 * the same shape as the escalation budget on the status axis, for the same
 * reason: a treatment that means "look here" stops meaning anything once it is
 * the fourth thing saying it.
 *
 * A SPECIFIC, CHECKABLE LIMITATION. "This average does not include days when
 * you did not wear the device" tells the reader what to subtract from what they
 * are looking at. "Your data may be incomplete" tells them to be uneasy and
 * gives them nothing to do about it, which is the exact recipe for alarm
 * fatigue with none of the compensating urgency.
 *
 * The content above the callout is deliberately not a measurement. A callout is
 * for something that would still be true if this reader had never opened the
 * app, so an example of one does not need a number and must not invent a
 * plausible-looking reading to hang it on.
 */

import { Callout } from "@/registry/base-lyra/ui/callout"

export default function CalloutNextToWhatItExplains() {
  return (
    <div className="flex w-full max-w-(--opsin-measure-tight) flex-col gap-opsin-4">
      <h3 className="m-0 text-opsin-title3">Your weekly summary</h3>

      <p className="m-0 text-opsin-body">
        The summary above each section is worked out from the readings you have
        recorded in the last seven days, and it is redrawn every time a new one
        arrives.
      </p>

      <Callout variant="caveat" title="What this average leaves out">
        This average does not include days when you did not wear the device.
      </Callout>
    </div>
  )
}
