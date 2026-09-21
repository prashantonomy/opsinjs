/**
 * VisuallyHidden puts content in the accessibility tree and clips it out of sight.
 *
 * THE ONE JOB, AND WHY IT IS NOT `display:none`. The children are announced by a
 * screen reader and painted nowhere. `display:none`, the `hidden` attribute and
 * `visibility:hidden` all remove content from the accessibility tree as well as
 * from view, so none of them can carry a screen-reader-only string. This
 * component clips instead: it positions the span absolutely, shrinks it to one
 * pixel, hides the overflow and clips the box to nothing, which takes the
 * content off the screen while leaving it in the tree. That difference is the
 * whole reason the file exists.
 *
 * IT IS THE `sr-only` PATTERN, SHIPPED AS A COMPONENT. Every opsinjs component
 * that needs a screen-reader-only string inlines the same four or five rules
 * (StatusPill's `describes` span is one a reader has already seen). This file is
 * that pattern named once, so a product can reach it in JSX with a real
 * `data-slot`, a merged `className` and a single place to fix if the clip
 * technique ever has to change. It is shipped for consumers, because the
 * system's own components inline the rules rather than import a component into
 * their substrate.
 *
 * WHAT IT REFUSES: IT IS NOT A SKIP LINK. A skip link is hidden until it
 * receives focus and then it becomes visible, which is a different pattern
 * built from `:focus` or `:focus-within` reveal. This component is always
 * hidden and has no reveal. Placing a focusable control inside always-hidden
 * content makes a keyboard trap, because focus lands somewhere the reader
 * cannot see. So for a control that must appear on focus, reach for a link, and
 * keep this component for the always-hidden case.
 *
 * IT REFUSES EMPTY CONTENT, IN DEVELOPMENT. A VisuallyHidden with nothing
 * inside announces nothing and is a silent no-op, which is the mistake this
 * component is most often reduced to when a caller wires up `children` from a
 * variable that turned out empty. In development it warns once naming the
 * mistake, and it still renders, because a presentation layer's job is to
 * report rather than to throw on the render path.
 *
 * IT IS A SERVER COMPONENT. There is no state, no effect and no timer, so it
 * renders on the server and ships no JavaScript.
 */

import { isValidElement, type ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The clip pattern, as one literal string because Tailwind reads class names
 * out of source and never builds them at runtime. It is absolutely positioned
 * so it leaves the flow, shrunk to a single pixel, its overflow hidden, its box
 * clipped to nothing by both the legacy `clip` rectangle and the modern
 * `clip-path`, its whitespace held on one line so a wrapped word cannot leak a
 * sliver into view, and its border and padding zeroed so neither draws. It is
 * deliberately NOT `display:none` and NOT `visibility:hidden`: either of those
 * would take the content out of the accessibility tree, which is the one thing
 * this component exists to prevent.
 */
const CLIP =
  "absolute m-[-1px] h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)] [clip-path:inset(50%)]"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the caller's mistake is passing empty content, not a
 * clinical error, so the warning is plain rather than coded, matching the same
 * small pattern `button.tsx` and `segmented-control.tsx` keep for their own
 * uncoded mistakes.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * Whether the children amount to nothing a screen reader could announce.
 * `null`, `undefined`, a boolean, an empty or whitespace-only string, and an
 * array of only those are all empty. A number, including zero, is content, and
 * any element is assumed to carry content because walking arbitrary children to
 * prove otherwise is more than this guard should do.
 */
function isEmptyNode(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node === "boolean") return true
  if (typeof node === "string") return node.trim() === ""
  if (typeof node === "number") return false
  if (Array.isArray(node)) return node.every(isEmptyNode)
  return false
}

/**
 * Host tags and ARIA roles a browser or a screen reader treats as a tab stop.
 * The list is deliberately short rather than exhaustive: it is a development
 * guard against the mistake the file's own docblock names, not a claim about
 * every element that could ever take focus.
 */
const FOCUSABLE_TAGS = new Set([
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "audio",
  "video",
  "iframe",
  "embed",
  "object",
  "summary",
])

const FOCUSABLE_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "radio",
  "switch",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "slider",
  "spinbutton",
  "textbox",
  "combobox",
])

/**
 * Whether a descendant renders as, or is marked as, a focusable control.
 * Placing one inside this component is the keyboard trap the docblock warns
 * against: the control keeps its tab stop while the clip keeps it off
 * screen, so a keyboard user can focus something they cannot see and gets no
 * visible ring to follow. Checked alongside the empty-content check, in
 * development only.
 */
function hasFocusableDescendant(node: ReactNode): boolean {
  if (Array.isArray(node)) return node.some(hasFocusableDescendant)
  if (!isValidElement(node)) return false
  const props = node.props as Record<string, unknown>
  const type = node.type
  if (typeof type === "string" && FOCUSABLE_TAGS.has(type)) return true
  const role = props.role
  if (typeof role === "string" && FOCUSABLE_ROLES.has(role)) return true
  const tabIndex = props.tabIndex
  if (typeof tabIndex === "number" && tabIndex >= 0) return true
  return hasFocusableDescendant(props.children as ReactNode)
}

export interface VisuallyHiddenProps {
  /**
   * The words to announce. They are read by assistive technology and drawn
   * nowhere. Give a control the name its icon stands for, or a repeated link
   * the subject a sighted reader gets from the layout around it. Do not place a
   * focusable control in here: an always-hidden control is a keyboard trap, and
   * a control that must appear on focus is a skip link, which is a different
   * pattern. Empty children announce nothing and raise a development warning.
   */
  children: ReactNode
  /**
   * Merged onto the span. It is rarely needed, because the component's whole
   * treatment is the clip and there is nothing visible to style. Use it to
   * position the span when it must sit at a particular point for a control's
   * accessible name to compose correctly, not to make any of it visible: a
   * class that unclips the content defeats the component.
   */
  className?: string
}

export function VisuallyHidden({ children, className }: VisuallyHiddenProps) {
  /* A VisuallyHidden with nothing inside announces nothing. No OPSIN code
     covers it, so the warning is a plain dev-only message keyed on the
     mistake, and the span still renders because refusing on the render path is
     worse than an empty span nobody hears. */
  if (isEmptyNode(children)) {
    warnDev(
      "empty-children",
      "[opsinjs] VisuallyHidden was given no content to announce. It renders " +
        "an empty span that a screen reader passes over in silence. Pass the " +
        "words a sighted reader gets from the icon or the layout, or remove it.",
    )
  }

  /* A focusable control inside always-hidden content is the keyboard trap
     the docblock warns against: it keeps its tab stop while the clip keeps
     it off screen. No OPSIN code covers it either, for the same reason the
     empty-content warning above has none, so this is the same plain
     dev-only pattern applied to the second named misuse. */
  if (hasFocusableDescendant(children)) {
    warnDev(
      "focusable-child",
      "[opsinjs] VisuallyHidden was given a focusable child. This component " +
        "is always hidden and never reveals its content, so a control placed " +
        "inside it can receive keyboard focus with nothing on screen to show " +
        "it, which is a keyboard trap. Move the control outside, or use a " +
        "link that reveals itself on focus instead of this component.",
    )
  }

  return (
    <span data-slot="visually-hidden" className={cn(CLIP, className)}>
      {children}
    </span>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * A VisuallyHidden on its own renders nothing a reviewer can see, so a demo
 * that showed only the component would be a blank frame. The one distinction
 * worth seeing is exactly the gap between what the eye gets and what a screen
 * reader gets, so the demo makes that gap legible: a line of visible text with
 * a hidden clause spliced into it, and a caption naming the words a screen
 * reader adds that the eye never receives. Nothing here is a measurement, a
 * unit or a range (ADR 0012).
 */
export default function VisuallyHiddenDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-opsin-2">
      <p className="m-0 text-opsin-body [color:var(--foreground)]">
        Sort<VisuallyHidden> the example table</VisuallyHidden> ascending
      </p>
      <p className="m-0 text-opsin-caption1 text-muted-foreground">
        A screen reader reads &quot;Sort the example table ascending&quot;. The
        eye sees &quot;Sort ascending&quot;. The words between them are here,
        clipped out of sight and left in the accessibility tree.
      </p>
    </div>
  )
}
