/**
 * IconButton is the shipped Button with its label taken off the screen and
 * made mandatory. The visible content is a single glyph, and the accessible
 * name is required rather than optional, because there is no other route to
 * it once the glyph is hidden from assistive technology.
 *
 * IT IS A COMPOSITION, NOT A NEW CONTROL. It renders `@/registry/base-lyra/ui/button`
 * and inherits the real `<button>` element, the 44pt target floor, the focus
 * ring, the four variants and the busy-free press behaviour from it. Nothing
 * about the control's mechanics is re-implemented here, because
 * re-implementing them is how two buttons in one system drift apart. What
 * this file adds is a shape and a rule.
 *
 * WHY THE NAME IS REQUIRED AND CANNOT BE REMOVED. An icon has no accessible
 * name of its own once it is `aria-hidden`, and a decorative glyph is the
 * right call because an announced icon makes a screen reader say the action
 * as a picture. So the name has to come from somewhere the reader cannot
 * see, and `label` is that somewhere. It is a required `string`, not a
 * `ReactNode`, because an accessible name is text. The name is set two ways
 * on purpose, as `aria-label` on the button and as a visually hidden text
 * node inside it. `aria-label` is the accessible name a browser computes,
 * and the hidden node is a fallback that survives translation tooling or a
 * wrapper that strips the attribute, keeping the name in the DOM as real
 * text.
 *
 * WHY IT REFUSES TO BE THE DEFAULT CHOICE. An icon alone is rarely as clear
 * as a short verb. This file cannot make a glyph legible, so the honest
 * thing it does is document the preference for a labelled Button and warn on
 * the one failure it can detect, a missing name. Name the exception: a dense
 * toolbar, a card header, or a repeated row action where a word on every
 * control would crowd the content out. Everywhere else, a labelled Button is
 * the safer control.
 *
 * NEITHER COLOUR AXIS, AND NO NEW EMPHASIS. It states nothing clinical, so it
 * carries only `data-slot` and draws only the neutral chrome its variant
 * inherits from Button. It introduces no round pill variant and no
 * icon-only variant on Button, because a round pill and an icon-only mode
 * are the two redesigns products reach for first, and neither is this
 * component's to invent.
 *
 * WHERE THE data-slot LIVES, AND WHY IT IS ON A WRAPPER. The composed Button
 * owns `data-slot="button"` on the pressable element and pins it after its
 * own prop spread, so IconButton cannot set the root slot on that element.
 * The component's own identity therefore sits on a thin wrapper span
 * carrying `data-slot="icon-button"`, which adds no styling and exists so
 * the control has one stable slot to select on.
 *
 * WHAT IT DOES NOT DO. It does not derive anything, does not animate
 * anything, does not move focus, and does not expose Button's `busy`,
 * `busyLabel`, `fullWidth`, `iconPosition` or `type`. The surface is
 * deliberately seven props, because an icon-only control with a wide surface
 * is an invitation to the mistakes this file exists to prevent.
 *
 * NO "use client" LINE. IconButton uses no hooks, no state and no effects of
 * its own. It forwards `onClick` to Button and defines no handler, so it
 * follows Button exactly: a shared component with no directive that becomes
 * a client component when rendered inside a client tree and stays
 * server-renderable otherwise. The client boundary lives inside Base UI's
 * own button file, reached through the composed Button, not here.
 */

import { Button, type ButtonProps } from "@/registry/base-lyra/ui/button"
import { Bell, Plus, Search } from "lucide-react"
import type { ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The square shape, merged onto the composed Button last so it wins.
 *
 * `aspect-square` keeps width equal to height. The two `min-*` classes floor
 * both axes at the target minimum in rem, with the literal fallback so the
 * declaration stays valid in a project that installed this file without the
 * generated token sheet. `p-0` removes Button's own `px`/`py` from its size
 * classes, so the glyph centres in the box rather than sitting inside
 * horizontal padding that would stretch the control wider than it is tall.
 * `cn` files `p-0` in the same padding group as Button's own padding classes
 * and keeps the later one, and this string arrives inside Button's
 * `className`, which is the last argument to its own `cn`, so the removal
 * holds.
 */
const SQUARE =
  "aspect-square min-h-(--opsin-target-minimum,2.75rem) min-w-(--opsin-target-minimum,2.75rem) p-0"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and an icon button asserts nothing
 * clinical. `button.tsx` and `segmented-control.tsx` keep the same small set
 * for the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface IconButtonProps {
  /**
   * Required. The glyph, and the only thing a sighted reader sees. Always
   * decorative and always hidden from assistive technology, because the
   * label carries the meaning and an announced icon makes a screen reader
   * say the action as a picture. Size it in `em` upstream or leave it: the
   * icon slot sizes any child `svg` at `1em`, so the glyph tracks the type
   * step.
   */
  icon: ReactNode
  /**
   * Required. The accessible name, and there is no way to remove it: this
   * is the whole reason IconButton is a separate control rather than a size
   * of Button. It is set as `aria-label` on the button and, as a fallback,
   * as a visually hidden text node inside it. Name the action and its
   * object, such as "Close the reading details", so a voice-control user
   * can say what they mean and a screen-reader user hears a verb rather
   * than "button". A missing or whitespace-only value raises a development
   * warning.
   */
  label: string
  /**
   * Emphasis, mirrored from Button. Four values in descending order:
   * `primary`, `secondary`, `quiet`, `destructive`. Defaults to
   * `secondary`, which keeps a visible boundary, because an icon-only
   * control with no border and no word is the hardest of all to recognise
   * as a control. Reach for `quiet` only in a toolbar or a header where the
   * surrounding context already says these are controls.
   */
  variant?: ButtonProps["variant"]
  /**
   * Visual weight only, mirrored from Button. Both sizes clear the 44pt
   * target floor; `sm` takes a smaller glyph at the same target, never a
   * shorter one. Defaults to `md`.
   */
  size?: ButtonProps["size"]
  /**
   * The action. Forwarded to the button unchanged. IconButton defines no
   * handler of its own, so this is the caller's own click, run in the
   * caller's own context.
   */
  onClick?: ButtonProps["onClick"]
  /**
   * Makes the control genuinely unavailable through the native attribute,
   * which takes it out of the tab order and the accessibility tree. There
   * is no busy state here: IconButton does not expose Button's `busy`,
   * because an icon-only control has no label to keep visible while it
   * works, so a busy icon button is a control whose name and glyph both
   * vanish. Use a labelled Button where a busy state matters. Defaults to
   * `false`.
   */
  disabled?: boolean
  /**
   * Merged onto the composed Button last, so a class you pass wins over the
   * square shape where the two conflict. Width, margin and place in a
   * layout belong here. Do not resolve a category or a status colour
   * through it: this control takes neither axis.
   */
  className?: string
}

export function IconButton({
  icon,
  label,
  variant = "secondary",
  size = "md",
  onClick,
  disabled,
  className,
}: IconButtonProps) {
  if (isDevelopment()) {
    if (typeof label !== "string" || label.trim() === "") {
      warnDev(
        "no-label",
        "[opsinjs] IconButton was rendered with no label. The visible " +
          "content is a decorative icon, so the label is the whole of the " +
          "accessible name. Without it the control is announced as " +
          '"button" and nothing else, and a voice-control user cannot ' +
          "target it. Note that a whitespace-only string counts as no " +
          "label. If the design cannot supply a name, it cannot use an " +
          "icon button; use a labelled Button instead.",
      )
    }
    if (icon === null || icon === undefined) {
      warnDev(
        "no-icon",
        "[opsinjs] IconButton was rendered with no icon, so it draws an " +
          "empty control with a hidden name and nothing a sighted reader " +
          "can see. Pass a glyph through `icon`, or use a labelled Button.",
      )
    }
  }

  return (
    <span data-slot="icon-button" className="inline-flex">
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        icon={
          <span
            data-slot="icon-button-icon"
            className="inline-flex [&_svg]:size-[1em]"
          >
            {icon}
          </span>
        }
        className={cn(SQUARE, className)}
      >
        <span data-slot="icon-button-name" className="sr-only">
          {label}
        </span>
      </Button>
    </span>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * reviewed public code. It shows three variants as icon-only controls,
 * because the one thing worth seeing at a glance is that each reads as a
 * control without a word inside it while still carrying a name. Each label
 * is distinct, so a voice-control user saying one of them gets one control
 * rather than a disambiguation prompt, and none of the three triggers the
 * missing-name warning. The labels name a fictional action (ADR 0012): no
 * number, no unit, nothing a screenshot could be mistaken for a reading.
 */
export default function IconButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-opsin-2">
      <IconButton variant="primary" icon={<Plus />} label="Add an example reading" />
      <IconButton variant="secondary" icon={<Search />} label="Search example readings" />
      <IconButton variant="quiet" icon={<Bell />} label="Example reminders" />
    </div>
  )
}
