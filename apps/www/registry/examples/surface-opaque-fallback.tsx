/**
 * The degraded path, made visible without changing an operating-system setting.
 *
 * Three different conditions end at the same surface: a reader who has switched
 * on Reduce Transparency, a reader who has asked for more contrast, and an
 * engine with no `backdrop-filter`. `tokens/material.json` makes them one
 * fallback on purpose, so that the degraded route is exercised every day by
 * real people rather than only by an old browser nobody tests on.
 *
 * `opaque` is the fourth way into that fallback, and it is the one a designer
 * can look at without setting a system preference. See the prop's own
 * documentation on Surface for what it does. That makes it the cheapest
 * possible review of a claim that would otherwise need a device with the
 * preference set. The two panels below are the same rung, the same content and
 * the same floor; the only thing that differs is whether the backdrop exists.
 *
 * Print is a separate path, and this panel is not a picture of it. On paper the
 * boundary survives, because Surface draws its edge with an outline that a
 * printer keeps, and the geometry survives with it. The fill is the part that
 * varies: it depends on whether the reader has background graphics switched on
 * and on the print block in the theme layer that carries the rung to its opaque
 * tint. So read this panel as the fallback on a screen, and not as a printout.
 *
 * Look at what does NOT change. The border, the shadow and the geometry are
 * identical, because they are what carries the layering once the translucency
 * is gone. A fallback that flattened the ladder would answer the preference by
 * throwing away the information the ladder was there to convey.
 *
 * The tile order is chosen so that both panels meet the page's darkest tone and
 * its lightest at every width. A comparison whose backdrop shifts with the
 * breakpoint is not a controlled comparison, so six columns are used rather than
 * four: at `sm:` each panel spans three of them, and every such half carries
 * both black and white behind it just as the full width does on a phone.
 */

import { Surface } from "@/registry/base-lyra/ui/surface"

/* Surface roles only. A backdrop is decoration, and the category and status
   axes both mean something specific about a person's data; neither is
   available as wallpaper. */
const BACKDROP_TILES = [
  "bg-foreground",
  "bg-primary",
  "bg-background",
  "bg-background",
  "bg-muted",
  "bg-foreground",
  "bg-background",
  "bg-muted",
  "bg-foreground",
  "bg-foreground",
  "bg-primary",
  "bg-background",
]

export default function SurfaceOpaqueFallback() {
  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-opsin-lg">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-6 grid-rows-2"
      >
        {BACKDROP_TILES.map((tone, index) => (
          <div key={`${tone}-${index}`} className={tone} />
        ))}
      </div>

      {/* Concentric radius, matching the component's own demo: the wrapper is
          rounded-opsin-lg (21px) with p-opsin-4 (16px) between it and each
          panel, so a panel's radius is 21 minus 16, which is 5px, floored to the
          published floor radius-xs (4px). tokens/shape.json rules[2] is the
          rule. The job line is text-opsin-body and not text-opsin-footnote: the
          page's Don't names small caption text on a heavily blurred surface, and
          footnote's published use is provenance rather than prose a reader
          reads. */}
      <div className="relative grid gap-opsin-3 p-opsin-4 sm:grid-cols-2">
        <Surface rung="sheet" className="rounded-opsin-xs">
          <div className="p-opsin-3">
            <p className="m-0 text-opsin-headline">Sheet rung</p>
            <p className="m-0 text-opsin-body">
              Translucent, with the page blurred behind it.
            </p>
          </div>
        </Surface>

        <Surface rung="sheet" opaque className="rounded-opsin-xs">
          <div className="p-opsin-3">
            <p className="m-0 text-opsin-headline">Same rung, opaque</p>
            <p className="m-0 text-opsin-body">
              What reduced transparency, increased contrast and a missing
              backdrop-filter all produce.
            </p>
          </div>
        </Surface>
      </div>
    </div>
  )
}
