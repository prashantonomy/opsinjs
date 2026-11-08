import { Value } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows one reading at
 * both weights, a reading of zero, an absence, and that same absence at the
 * hero size. The distinction it is built to hold is the one this component is
 * most often got wrong about: a missing reading is not zero, and coercing one
 * to the other turns a sentence about not knowing into a false claim of zero.
 *
 * The failure form is deliberately not among these rows. A non-finite reading
 * emits a development warning, because it reports a defect on the caller's side,
 * and this zero-prop demo is public shipped code that ADR 0009 keeps free of
 * states that complain. That state is shown in the `value-zero-is-not-absence`
 * example instead, where it renders beside the absence it must never be mistaken
 * for.
 *
 * The numbers are obviously unreal (ADR 0012), and the magnitude is chosen
 * rather than convenient: over a tonne is not a person, and a count of zero is
 * a count. An earlier draft of this demo used a two-digit weight in kilograms,
 * which is a plausible reading for a small child. This file is public, one copy
 * away from somebody else's product and one screenshot away from outliving the
 * page it was written for, so a number a reader could take for their own is the
 * one thing it must never ship. There is no reference range in sight either;
 * this component has never seen one and never will.
 */
export default function ValueDemo() {
  return (
    <div className="flex flex-col gap-opsin-3 text-opsin-body">
      {/* The same reading at both weights, so it is visible that `size` moves
          nothing but the type: same digits, same decimal place, same unit. */}
      <Value value={1000.2} unit="kg" precision={1} size="display" />
      <Value value={1000.2} unit="kg" precision={1} />
      {/* A reading of zero is a measurement that was taken and came to
          nothing. */}
      <Value value={0} unit="steps" precision={0} />
      {/* No reading at all, which is a different sentence and says so. The
          precision is never used on an absence, and that is the point: a reading
          that was never taken still has a precision it would have been reported
          to. */}
      <Value value={null} unit="steps" precision={0} />
      {/* The same absence at the hero size, so the display-size treatment is on
          screen and reviewable. It is deliberately not set at the hero weight: a
          statement of not knowing drops to the headline step in the muted role
          rather than shouting louder than a steady reading would. */}
      <Value value={null} unit="steps" precision={0} size="display" />
    </div>
  )
}
