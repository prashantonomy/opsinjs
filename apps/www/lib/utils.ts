/**
 * The documentation site's `cn`, which is @opsinjs/react's.
 *
 * Re-exported from the exact module rather than from the package entry point.
 * The site reads the package's source through tsconfig paths, so the package's
 * `sideEffects` flag never reaches the bundler, and an import of the entry point
 * from the docs chrome would pull every component into its client bundle.
 */

export { cn } from "../../../packages/react/src/utils.ts"
