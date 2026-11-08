"use client"

import { useState } from "react"
import { Button, Sheet } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows the default
 * sheet: one content-sized detent, dismissible and modal. It shows that shape
 * because it is the one a product reaches for first, and because the three
 * things worth checking about it are visible in that shape: the close control
 * is in the header before you look for it, the action is pinned below the
 * content rather than at the end of it, and the content scrolls under a footer
 * that does not move once the body outgrows the detent.
 *
 * There is not a number anywhere in it. A sheet renders no measurement of its
 * own, and a screenshot of an opsinjs demo must never be mistakable for
 * somebody's result.
 *
 * IT USES THE REAL `Button`, which is why `button` is in this component's
 * `registryDependencies` even though `Sheet` itself never imports it. A demo
 * that hand-rolled two controls would be teaching, in shipped source, that the
 * primary action at the foot of a sheet is a styled `<button>`. It would be
 * teaching it in the one file a consumer reads first.
 */
export default function SheetDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full flex-col items-center gap-opsin-4 p-opsin-4">
      <p className="m-0 max-w-sm text-center text-opsin-footnote text-muted-foreground">
        The sheet portals to the end of the document, so it covers the whole
        page rather than this frame. Close it with the button in its header,
        with the escape key, or by tapping the dimmed area.
      </p>

      <Button onClick={() => setOpen(true)}>Open the example sheet</Button>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        title="An example sheet"
        footer={
          <Button variant="primary" fullWidth onClick={() => setOpen(false)}>
            Save the example
          </Button>
        }
      >
        <Sheet.Content>
          <Sheet.Description className="text-opsin-body">
            A sheet is a place the reader chose to go and can leave at any
            moment. This sentence describes the sheet, so it is the text a screen
            reader announces after the title, and it takes up room so that the
            scrolling region has something to scroll.
          </Sheet.Description>
          <p className="mt-opsin-3 mb-0 text-opsin-body">
            The action below stays where it is while this text moves, which is
            the whole reason it is a footer rather than the last thing in the
            content.
          </p>
          <p className="mt-opsin-3 mb-0 text-opsin-body">
            There is always a way out of a sheet, and there is more than one.
            The close control sits in the header where a reader looks first,
            the escape key dismisses the surface from wherever focus happens to
            rest, and a tap on the dimmed area behind the sheet does the same
            thing without asking the reader to aim at a small target. None of
            these routes is hidden behind a gesture somebody has to guess at,
            because a surface that covers the whole page must never trap the
            person who opened it.
          </p>
          <p className="mt-opsin-3 mb-0 text-opsin-body">
            As this body grows past the height the sheet was given, the region
            holding it begins to scroll while the surface itself keeps the size
            it settled on. The header stays at the top and the action stays at
            the foot, and only the words in the middle move as a reader travels
            through them. That is the shape a sheet is built for. A reader can
            read as far as they need without ever losing sight of the control
            that finishes the task, or the one that simply leaves it behind.
          </p>
        </Sheet.Content>
      </Sheet>
    </div>
  )
}
