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
 * only differences between the outlined destructive control and the soft-filled
 * secondary one are the boundary weight and the words — which is why the label
 * here says what will be deleted rather than just "Delete".
 *
 * The row is spaced by `gap-opsin-2`, which is 0.5rem, which is exactly
 * `--opsin-target-separation`. Adjacent targets need that gap and a component
 * cannot enforce its neighbours' spacing, so the caller owns it — and this is
 * what owning it looks like.
 *
 * The reading is fictional and carries no number at all.
 */

import { Plus } from "lucide-react"

import { Button } from "@/registry/base-lyra/ui/button"

export default function ButtonOnePrimaryPerSurface() {
  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-4">
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
