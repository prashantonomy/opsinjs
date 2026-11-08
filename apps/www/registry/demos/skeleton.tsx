import { Skeleton, type SkeletonProps } from "@opsinjs/react"

type SkeletonShape = NonNullable<SkeletonProps["shape"]>

const SHAPE_NAMES: SkeletonShape[] = ["text", "line", "block", "circle"]

const SHAPE_CAPTIONS = {
  text: "Several lines of body text",
  line: "A single line, such as a label",
  block: "A card, an image or where a chart will go",
  circle: "A circle where an avatar goes",
} satisfies Record<SkeletonShape, string>

export default function SkeletonDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-opsin-6">
      {SHAPE_NAMES.map((shape) => (
        <div key={shape} className="flex flex-col gap-opsin-2">
          <p className="m-0 text-opsin-caption1 text-muted-foreground">
            {SHAPE_CAPTIONS[shape]}
          </p>
          <Skeleton shape={shape} />
        </div>
      ))}
    </div>
  )
}
