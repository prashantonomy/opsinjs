/**
 * A list of identical Read more links made distinct for a screen-reader user.
 *
 * A sighted reader tells the links apart by the title beside each one. A
 * screen reader listing the links hears "Read more" three times, so the
 * subject is appended inside VisuallyHidden, with a leading space so the
 * concatenated name reads as one sentence. The layout does not change. The
 * titles are fictional so nothing here can be mistaken for real content.
 */

import { VisuallyHidden } from "@/registry/base-lyra/ui/visually-hidden"

const ARTICLES = [
  "Keeping a simple daily log",
  "What an estimate is and what it is not",
  "Reading a range without a verdict",
] as const

export default function VisuallyHiddenContextForARepeatedLink() {
  return (
    <ul className="m-0 flex list-none flex-col gap-opsin-4 p-0">
      {ARTICLES.map((title) => (
        <li key={title} className="flex flex-col gap-opsin-1">
          <span className="text-opsin-body [color:var(--foreground)]">{title}</span>
          <a
            href="#example"
            className="w-fit text-opsin-body underline underline-offset-2 [color:var(--foreground)] focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[var(--opsin-border-focus-offset,2px)] focus-visible:outline-ring"
          >
            Read more<VisuallyHidden> about {title}</VisuallyHidden>
          </a>
        </li>
      ))}
    </ul>
  )
}
