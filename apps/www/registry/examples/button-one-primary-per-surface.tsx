/**
 * The emphasis ladder, on one surface, doing the job it exists for.
 *
 * The rule this demonstrates is the one that is broken most often and costs the
 * most: ONE primary action per surface. Three filled buttons of equal weight
 * answer "what should I do here?" with a shrug, and a reader in a corridor with
 * one hand free does not have time to work it out. Everything that is not the
 * one action gets `secondary` or `quiet`.
 *
 * It is also the honest place to look at `destructive`, because opsinjs has no
 * destructive colour and does not borrow one from the clinical status axis. The
 * outlined destructive control and the soft-filled secondary one share one
 * boundary width, the hairline every rung in this file now carries, and they
 * are told apart by the ink of that boundary rather than by its weight, because
 * the emphasis width belongs to the status axis and cannot also be the whole of
 * a delete signal. That ink is `--foreground`, the page's own near-black, and
 * it has been measured by hand against both surfaces this control sits on: it
 * reaches 18.12:1 on `--background` and 18.61:1 on `--card` in light, and
 * 17.53:1 and 15.96:1 on the same two surfaces in dark, so the boundary clears
 * the 3:1 non-text floor everywhere. The words still carry the heavier part of
 * the signal, which is why the label here says what will be deleted rather than
 * saying "Delete" and stopping.
 *
 * The row is spaced by `gap-opsin-2`, which is 0.5rem, which is exactly
 * `--opsin-target-separation`. Adjacent targets need that gap and a component
 * cannot enforce its neighbours' spacing, so the caller owns it. This is what
 * owning it looks like. The container is `max-w-lg` rather than `max-w-md`
 * because at 448px the first row wrapped one control to its own line and the
 * ladder read as three rows instead of one row plus a separated destructive,
 * which is the opposite of what this file demonstrates.
 *
 * The reading is fictional and carries no number at all.
 */

import { Plus } from "lucide-react"

import { Button } from "@/registry/base-lyra/ui/button"

export default function ButtonOnePrimaryPerSurface() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-opsin-4">
      <p className="m-0 text-opsin-body text-muted-foreground">
        Example measurement, taken this morning.
      </p>
      <div className="flex flex-wrap items-center gap-opsin-2">
        <Button variant="primary" icon={<Plus />}>
          Add a reading
        </Button>
        <Button variant="secondary">Edit this reading</Button>
        <Button variant="quiet">Cancel</Button>
      </div>
      <div className="flex flex-wrap items-center gap-opsin-2">
        <Button variant="destructive">Delete this example reading</Button>
      </div>
    </div>
  )
}
