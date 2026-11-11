"use client"

/**
 * The five interaction motions (ADR 0031), one row each, on the components
 * that carry them, so the Motion foundation can be tried rather than read.
 *
 * Every row is a real component from the registry and nothing here adds motion
 * of its own: press the button, flip the switch, tick the box, change the range,
 * open the menu and raise a toast, then throw the toast sideways or downwards.
 * Under `prefers-reduced-motion: reduce` each one still changes state, and the
 * travel, the squash, the scale and the blur are gone.
 *
 * The controls hold their own state because each is controlled, and a demo has
 * to close that loop somewhere. Every word is about a fictional note and carries
 * no number a reader could take for their own (ADR 0012). Nothing in it is a
 * reading, which is why every one of the five is allowed to move.
 */

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { useState, type ReactNode } from "react"

import { Button } from "@/registry/base-lyra/ui/button"
import { Checkbox } from "@/registry/base-lyra/ui/checkbox"
import { Menu } from "@/registry/base-lyra/ui/menu"
import { SegmentedControl } from "@/registry/base-lyra/ui/segmented-control"
import { Switch } from "@/registry/base-lyra/ui/switch"
import { Toast } from "@/registry/base-lyra/ui/toast"

/** One labelled row: the motion's name, what to do, and the component. */
function Row({ name, hint, children }: { name: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-opsin-2 border-t border-edge pt-opsin-4 first:border-t-0 first:pt-0">
      <p className="m-0 flex flex-wrap items-baseline gap-x-opsin-2">
        <span className="text-opsin-headline text-foreground">{name}</span>
        <span className="text-opsin-footnote text-muted-foreground">{hint}</span>
      </p>
      <div className="flex flex-wrap items-center gap-opsin-3">{children}</div>
    </div>
  )
}

/** Raises a toast through the provider the surrounding `<Toast>` mounts. */
function RaiseToast() {
  const manager = ToastPrimitive.useToastManager()
  return (
    <Button
      variant="secondary"
      onClick={() =>
        manager.add({
          title: "Example note saved",
          description: "Throw it right or down to dismiss it.",
        })
      }
    >
      Save example note
    </Button>
  )
}

export default function MotionTheFiveInteractions() {
  const [remind, setRemind] = useState(false)
  const [summary, setSummary] = useState(false)
  const [range, setRange] = useState("recent")
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <Toast>
      <section
        aria-label="The five interaction motions"
        className="flex w-full max-w-md flex-col gap-opsin-4 rounded-opsin-lg border border-edge bg-card p-opsin-5 shadow-card [corner-shape:var(--opsin-corner-shape)]"
      >
        <Row name="Press" hint="Hold, then let go">
          <Button variant="primary">Save example</Button>
          <Button variant="secondary">Not now</Button>
        </Row>
        <Row name="Toggle" hint="Hold the row, then flip and tick">
          <div className="flex w-full flex-col">
            <Switch label="Example reminder" checked={remind} onCheckedChange={setRemind} />
            <Checkbox label="Send the example summary" checked={summary} onCheckedChange={setSummary} />
          </div>
        </Row>
        <Row name="Glide" hint="Choose another range">
          <SegmentedControl
            label="Example range"
            value={range}
            onValueChange={setRange}
            options={[
              { value: "recent", label: "Recent" },
              { value: "earlier", label: "Earlier" },
              { value: "all", label: "All" },
            ]}
          />
        </Row>
        <Row name="Unfold" hint="Open the menu">
          <Menu
            trigger={<Button variant="secondary">Example actions</Button>}
            items={[
              { label: "Share", onClick: () => setLastAction("Share") },
              { label: "Rename", onClick: () => setLastAction("Rename") },
              { label: "Remove", separatorBefore: true, onClick: () => setLastAction("Remove") },
            ]}
          />
          <span aria-live="polite" className="text-opsin-footnote text-muted-foreground">
            {lastAction ? `Last example action: ${lastAction}` : null}
          </span>
        </Row>
        <Row name="Arrive" hint="Raise a toast, then throw it">
          <RaiseToast />
        </Row>
      </section>
    </Toast>
  )
}
