/**
 * build-favicons.mts rasterises the opsinjs mark into the PNG sizes Google
 * Search can actually read.
 *
 *   node scripts/build-favicons.mts            # write app/icon1.png and app/apple-icon.png
 *   node scripts/build-favicons.mts --check    # fail if either file is missing
 *
 * WHY THIS EXISTS. `app/icon.svg` is the mark, and it is the right icon for a
 * browser tab: one file, crisp at every size, a few hundred bytes. It is not a
 * favicon as far as Google Search is concerned. Google publishes the list of
 * formats it accepts and SVG is not on it: BMP, GIF, ICO, PNG, JPEG, PPM and
 * TIFF. A site whose only icon is an SVG gets the generic globe next to every
 * one of its results, on the surface where a favicon does the most work, which
 * is a phone.
 *
 * So the mark ships twice. The SVG stays and browsers keep using it. The two
 * PNGs written here are for Google, and `apple-icon.png` doubles as the iOS
 * home-screen icon, which is the other `rel` value Google names as acceptable.
 *
 * WHY IT IS NOT IN `pnpm generate`. Every other generator in this directory is
 * wired into `check:generated`, which regenerates and then diffs. That works
 * because those outputs are text. These are DEFLATE streams, and zlib does not
 * promise the same bytes across versions, so the same mark built on two Node
 * builds can differ without anything being wrong. A gate that fails on the
 * patch version of a compression library is a gate that gets disabled. The mark
 * changes roughly never; run this by hand when it does, and commit the result.
 *
 * NO DEPENDENCIES, ON PURPOSE. The mark is five rounded rectangles and circles.
 * Rasterising it needs a coverage test and an averaging step, and encoding a
 * PNG needs CRC32 and `node:zlib`. That is less code than the argument for
 * adding an image library would be, and it cannot break when one is bumped.
 */

/* ------------------------------------------------------------------ *
 * Node version guard (addendum A5).                                   *
 * ------------------------------------------------------------------ */
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10)
if (!Number.isFinite(NODE_MAJOR) || NODE_MAJOR < 24) {
  console.error(
    [
      "",
      "  opsinjs: scripts/build-favicons.mts needs Node 24 or newer.",
      `  You are on Node ${process.versions.node}.`,
      "",
    ].join("\n")
  )
  process.exit(1)
}

import { existsSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { deflateSync } from "node:zlib"

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..")

/* ------------------------------------------------------------------ *
 * The mark, in the 32 unit coordinate space of app/icon.svg.          *
 * ------------------------------------------------------------------ */

/**
 * A value read against a range: a track, the band that is expected, and one
 * marker sitting outside it. It is the RangeBar, which is the system's argument
 * that a health number means nothing until you can see where it falls.
 *
 * These five shapes are `app/icon.svg` transcribed. The SVG is the source a
 * human edits; if the two ever disagree, the SVG is right and this is the bug.
 */
const VIEWBOX = 32

type Shape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; r: number; fill: string }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string }

const SHAPES: Shape[] = [
  { kind: "rect", x: 0, y: 0, w: 32, h: 32, r: 7, fill: "#17181A" },
  { kind: "rect", x: 6, y: 14.5, w: 20, h: 3, r: 1.5, fill: "#3F4145" },
  { kind: "rect", x: 6, y: 14.5, w: 11, h: 3, r: 1.5, fill: "#7FB77A" },
  { kind: "circle", cx: 22, cy: 16, r: 4, fill: "#17181A" },
  { kind: "circle", cx: 22, cy: 16, r: 2.75, fill: "#E08A3C" },
]

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
}

/** Is the point inside a rounded rectangle? Corner radius is clamped to half. */
function inRoundedRect(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): boolean {
  if (px < x || px > x + w || py < y || py > y + h) return false
  const radius = Math.min(r, w / 2, h / 2)
  const dx = Math.max(x + radius - px, 0, px - (x + w - radius))
  const dy = Math.max(y + radius - py, 0, py - (y + h - radius))
  return dx * dx + dy * dy <= radius * radius
}

function inCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= r * r
}

/** The topmost shape covering a point, or undefined where the mark is empty. */
function sampleAt(px: number, py: number): Shape | undefined {
  for (let i = SHAPES.length - 1; i >= 0; i -= 1) {
    const shape = SHAPES[i]!
    const hit =
      shape.kind === "rect"
        ? inRoundedRect(px, py, shape.x, shape.y, shape.w, shape.h, shape.r)
        : inCircle(px, py, shape.cx, shape.cy, shape.r)
    if (hit) return shape
  }
  return undefined
}

/**
 * Rasterise to straight (un-premultiplied) RGBA.
 *
 * Supersampled 4 by 4 and averaged. Averaging happens in PREMULTIPLIED space
 * and is divided back out at the end, which is the difference between a clean
 * edge and a pale halo everywhere the rounded corners meet transparency.
 */
function render(size: number): Uint8Array {
  const SS = 4
  const pixels = new Uint8Array(size * size * 4)
  const scale = VIEWBOX / size

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const px = (x + (sx + 0.5) / SS) * scale
          const py = (y + (sy + 0.5) / SS) * scale
          const shape = sampleAt(px, py)
          if (!shape) continue
          const [sr, sg, sb] = rgb(shape.fill)
          r += sr
          g += sg
          b += sb
          a += 255
        }
      }

      const samples = SS * SS
      const offset = (y * size + x) * 4
      const alpha = a / samples
      if (alpha === 0) {
        pixels[offset] = 0
        pixels[offset + 1] = 0
        pixels[offset + 2] = 0
        pixels[offset + 3] = 0
        continue
      }
      /* r, g and b were accumulated only over covered samples, so dividing by
         the covered count rather than by the sample count is what un-does the
         premultiplication. */
      const covered = a / 255
      pixels[offset] = Math.round(r / covered)
      pixels[offset + 1] = Math.round(g / covered)
      pixels[offset + 2] = Math.round(b / covered)
      pixels[offset + 3] = Math.round(alpha)
    }
  }

  return pixels
}

/* ------------------------------------------------------------------ *
 * PNG container.                                                      *
 * ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, "ascii"), Buffer.from(data)])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

/** Colour type 6 is truecolour with alpha; filter 0 on every scanline. */
function encodePng(pixels: Uint8Array, size: number): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr.writeUInt8(8, 8)
  ihdr.writeUInt8(6, 9)
  ihdr.writeUInt8(0, 10)
  ihdr.writeUInt8(0, 11)
  ihdr.writeUInt8(0, 12)

  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", new Uint8Array(0)),
  ])
}

/* ------------------------------------------------------------------ *
 * Outputs.                                                            *
 * ------------------------------------------------------------------ */

/**
 * `icon1.png` and not `icon.png`, because `app/icon.svg` already claims the
 * unsuffixed name. Next's metadata convention numbers additional icons, and
 * both end up in the head as separate `<link rel="icon">` entries: the browser
 * takes the SVG, Google takes the PNG.
 *
 * 192 rather than the 48 Google gives as its recommended floor. The same file
 * is what a browser uses for a bookmark tile and what a reader gets if they add
 * the site to a home screen, and one file that is large enough for all of those
 * beats three that each fit one.
 */
const OUTPUTS = [
  { file: "app/icon1.png", size: 192 },
  { file: "app/apple-icon.png", size: 180 },
]

const checkOnly = process.argv.includes("--check")
let failed = false

for (const output of OUTPUTS) {
  const path = join(APP_DIR, output.file)

  if (checkOnly) {
    if (!existsSync(path)) {
      console.error(
        `  missing ${output.file}. Run: node scripts/build-favicons.mts`
      )
      failed = true
    }
    continue
  }

  writeFileSync(path, encodePng(render(output.size), output.size))
  console.log(`  wrote ${output.file} (${output.size}x${output.size})`)
}

if (failed) process.exit(1)
