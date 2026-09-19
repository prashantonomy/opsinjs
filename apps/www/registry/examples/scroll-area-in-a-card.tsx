/**
 * A scrolling region set inside a card surface, which is the shape ScrollArea is
 * meant for: one bounded panel that holds more than it can show, on a page that
 * still scrolls on its own. The card draws the surface and the heading stays
 * fixed above the region, so only the body scrolls. The card is a plain neutral
 * surface here rather than the shipped Card component, to keep the example to
 * one import. Every line is fictional copy (ADR 0012), not a reading.
 */

import { ScrollArea } from "@/registry/base-lyra/ui/scroll-area"

const PARAGRAPHS = [
  "This panel holds a longer stretch of text than the card can show at once, so the body scrolls while the heading above it stays put.",
  "A scrolling region belongs to one bounded block like this one. The page it sits on keeps the browser's own scroll, so a reader who turns their text size up still reaches every word.",
  "The rail on the right is quiet neutral chrome. It carries no status and no category, and it fades in as the reader scrolls rather than sitting as a fixed line.",
  "When the region is this short, most readers reach its end in a few flicks. The point of bounding it is to keep the card a fixed size on the surface, not to hide the content.",
  "Keyboard readers reach this region as one tab stop and scroll it with the arrow keys, so the content is reachable without a pointer.",
]

export default function ScrollAreaInACard() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-opsin-lg border border-border bg-card">
      <div className="border-b border-border px-opsin-4 py-opsin-3 text-opsin-headline [color:var(--foreground)]">
        About this panel
      </div>
      <ScrollArea maxHeight="11rem">
        <div className="flex flex-col gap-opsin-3 px-opsin-4 py-opsin-3 text-opsin-body [color:var(--foreground)]">
          {PARAGRAPHS.map((paragraph) => (
            <p key={paragraph} className="m-0">
              {paragraph}
            </p>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
