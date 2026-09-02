import postcss from "/Users/taramaa/opsinjs/node_modules/.pnpm/postcss@8.5.26/node_modules/postcss/lib/postcss.mjs"
import tw from "/Users/taramaa/opsinjs/node_modules/.pnpm/@tailwindcss+postcss@4.3.3/node_modules/@tailwindcss/postcss/dist/index.mjs"
import fs from "node:fs"
const which = process.argv[2]
const p = `/Users/taramaa/opsinjs/apps/www/app/${which}.css`
const css = fs.readFileSync(p, "utf8")
const plugin = (tw.default ?? tw)({ optimize: false })
const res = await postcss([plugin]).process(css, { from: p })
fs.writeFileSync(`/private/tmp/claude-501/-Users-taramaa-opsinjs/031f02f5-afad-4862-adb2-b1c8a2b2bd4c/scratchpad/out-${which}.css`, res.css)
console.log(which, "bytes", res.css.length)
