import { Button } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is reviewed public code rather than a scratch demo. It shows the four
 * variants together because the only question worth answering at a glance is
 * whether the emphasis ladder reads as a ladder. That question is worth asking
 * in greyscale, where three of the four rungs have only fill and boundary to be
 * told apart by. The boundary is now measured: `destructive`'s `--foreground`
 * edge reaches 18.12:1 on `--background` and 18.61:1 on `--card` in light, and
 * 17.53:1 and 15.96:1 in dark, well clear of the 3:1 non-text floor, so the
 * ladder is carried by the styling rather than propped up by the words below
 * it.
 *
 * The shape obeys two rules and each names a source. One primary per surface,
 * per `foundations/space/density-and-touch`: the first row holds a single
 * filled primary, then secondary and quiet in descending weight. And a
 * destructive control is separated from the rest rather than set beside it, per
 * `accessibility/target-size-and-motor`, which is why Delete sits on its own
 * row under a `gap-opsin-4` step and is never a thumb-slip from Save or Add.
 * `sm` and `busy` are left to their own examples: a size is not a rung of
 * emphasis, `busy` already has a worked example, and folding either into the
 * row is what made the ladder wrap into four lines on a phone.
 *
 * No two controls here share an accessible name, and that is deliberate. This
 * is the first Button the component's page shows and the one people imitate
 * first, and a voice-control user who says "click Save example reading" against
 * two identical labels gets a disambiguation prompt rather than the action they
 * asked for.
 *
 * The labels name a fictional reading (ADR 0012). No number, no unit, nothing a
 * screenshot could be mistaken for.
 */
export default function ButtonDemo() {
  return (
    <div className="flex flex-col gap-opsin-4">
      <div className="flex flex-wrap items-center gap-opsin-2">
        <Button variant="primary">Save example reading</Button>
        <Button variant="secondary">Add a note</Button>
        <Button variant="quiet">Cancel</Button>
      </div>
      <div className="flex flex-wrap items-center gap-opsin-2">
        <Button variant="destructive">Delete this example reading</Button>
      </div>
    </div>
  )
}
