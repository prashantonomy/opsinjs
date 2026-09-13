/**
 * The degraded path, made visible without changing an operating-system setting.
 *
 * Three different conditions end at the same surface: a reader who has switched
 * on Reduce Transparency, a reader who has asked for more contrast, and an
 * engine with no `backdrop-filter`. `tokens/material.json` makes them one
 * fallback on purpose, so that the degraded route is exercised every day by
 * real people rather than only by an old browser nobody tests on.
 *
 * `opaque` is the fourth way in, and it is the one a designer can look at. It
 * takes the same rung to the same opaque fallback for print and export paths.
 * That makes it the cheapest possible review of a claim that would otherwise
 * need a device with the preference set. The two panels below are the same
 * rung, the same content and the same floor; the only thing that differs is
 * whether the backdrop exists.
 *
 * Look at what does NOT change. The border, the shadow and the geometry are
 * identical, because they are what carries the layering once the translucency
 * is gone. A fallback that flattened the ladder would answer the preference by
 * throwing away the information the ladder was there to convey.
 */

import { Surface } from "@/registry/base-lyra/ui/surface"

/* Surface roles only. A backdrop is decoration, and the category and status
   axes both mean something specific about a person's data; neither is
   available as wallpaper. */
const BACKDROP_TILES = [
  "bg-foreground",
  "bg-background",
  "bg-primary",
  "bg-muted",
  "bg-background",
  "bg-foreground",
  "bg-muted",
  "bg-primary",
]

export default function SurfaceOpaqueFallback() {
  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-opsin-lg">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-4 grid-rows-2"
      >
        {BACKDROP_TILES.map((tone, index) => (
          <div key={`${tone}-${index}`} className={tone} />
        ))}
      </div>

      <div className="relative grid gap-opsin-3 p-opsin-4 sm:grid-cols-2">
        <Surface rung="sheet" className="rounded-opsin-md">
          <div className="p-opsin-3">
            <p className="m-0 text-opsin-headline">Sheet rung</p>
            <p className="m-0 text-opsin-footnote">
              Translucent, with the page blurred behind it.
            </p>
          </div>
        </Surface>

        <Surface rung="sheet" opaque className="rounded-opsin-md">
          <div className="p-opsin-3">
            <p className="m-0 text-opsin-headline">Same rung, opaque</p>
            <p className="m-0 text-opsin-footnote">
              What reduced transparency, increased contrast, a missing
              backdrop-filter and a printout all produce.
            </p>
          </div>
        </Surface>
      </div>
    </div>
  )
}
