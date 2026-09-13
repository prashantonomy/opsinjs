import type { MDXComponents } from "mdx/types"
import defaultMdxComponents from "fumadocs-ui/mdx"
import { Accordion, Accordions } from "fumadocs-ui/components/accordion"
import { File, Files, Folder } from "fumadocs-ui/components/files"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { TypeTable } from "fumadocs-ui/components/type-table"

import {
  A11yReport,
  ContrastOracle,
  ContrastReport,
  CvdSimulator,
} from "./docs/a11y"
import {
  Anatomy,
  ApiLink,
  CompositionTree,
  FlowDiagram,
  RelatedComponents,
} from "./docs/anatomy"
import {
  ColorScale,
  StatusAxisDemo,
  StatusLadder,
  TokenSwatch,
} from "./docs/colour"
import { CopyButton, OpenInSandbox, PageActions } from "./docs/copy"
import {
  Callout,
  ClinicalNote,
  DoDont,
  PlainLanguage,
  ReadingLevel,
  ResearchNote,
  Reviewed,
  SafetyCallout,
  WhenToUse,
} from "./docs/guidance"
import { Glossary, RangeDemo, Term } from "./docs/health"
import { MaterialLadder } from "./docs/material"
import {
  BrowserSupport,
  EvalResult,
  Feedback,
  Figure,
  LastUpdated,
  PromptRecipe,
  RegistryItem,
  VersionNotice,
} from "./docs/meta"
import { MotionCurve, MotionDemo } from "./docs/motion"
import { PageTemplate } from "./docs/page-template"
import { DeviceFrame, ViewportToolbar } from "./docs/preview"
/* ComponentPreview and IframePreview come from the SERVER wrapper, not from
   ./docs/preview. The wrapper resolves the name against the generated registry
   index and hands the client surface a single boolean; importing the index
   into a "use client" module would put every built component's full source
   text in the browser bundle of every page on this site. DeviceFrame and
   ViewportToolbar have no lookup to do and come straight from the surface. */
import { ComponentPreview, IframePreview } from "./docs/preview-server"
import { SectionsRail } from "./docs/sections-rail"
import {
  CodeBlockCommand,
  CodeCollapsible,
  CodeTabs,
  ComponentInstall,
  ComponentSource,
} from "./docs/source"
import {
  ComponentsList,
  SectionProgress,
  SinceBadge,
  StatusBadge,
  StatusLegend,
  StatusMatrix,
} from "./docs/status"
import {
  NoDataYet,
  NotBuiltYet,
  StubNotice,
  Todo,
} from "./docs/stub"
import {
  BundleSize,
  CssVariablesTable,
  DataAttributesTable,
  KeyboardTable,
  Kbd,
  PropsTable,
  TokenTable,
} from "./docs/tables"
import { RadiusSpecimen, SpaceSpecimen, TypeScaleSpecimen } from "./docs/type"

/* ==========================================================================
   mdx.tsx DEFINES THE CLOSED VOCABULARY.

   Every tag an MDX page in this repository is allowed to use is in the object
   below, and nothing else is. `scripts/assert-ia.mts` fails the build on an
   unknown JSX tag, which makes this file the single definition of what a
   content author can write, whether that author is a person or an agent.

   Why closed rather than open. 280 content files are written in parallel. An
   open vocabulary means a page invents <Warning> where <SafetyCallout> exists,
   and the invented one renders as nothing: MDX silently drops an unknown
   capitalised tag's children in some configurations and throws in others, and
   in a health document "silently dropped" is the outcome that matters. Closing
   the set turns that into a build failure with a name in it.

   Two rules for anyone extending this file:

     1. A new tag is a change to the contract, not a convenience. It goes in
        anatomy.txt first, then here, then into the templates, and only then
        into a page.

     2. fumadocs' `Card` is left UNSHADOWED. It is used by the docs chrome, by
        the generated index cards and by `<Cards>` in Markdown, and replacing it
        with an opsinjs-flavoured one would fork the chrome for no gain.

   `Callout` IS shadowed, deliberately, so that the four clinical status levels
   and fumadocs' info/warn/error types resolve through one component. Markdown
   admonition syntax (`> [!NOTE]`) keeps working because the shadow accepts both
   vocabularies.
   ========================================================================== */

/* CategoryGrid and PlannedApi are intentionally NOT registered here. Contract
   C4 declares the MDX vocabulary closed, and assert-ia fails the build on a tag
   outside it; registering a tag no page may use is the same drift in the other
   direction. Both components still exist and are exported from their own files -
   PlannedApi is the intended host for anatomy section 9 once component pages
   move off bare code fences. Add them to the vocabulary first, then to this map. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    // fumadocs defaults: pre, headings, links, images, tables, Card/Cards and
    // the code-block tab primitives. Left intact.
    ...defaultMdxComponents,

    // fumadocs built-ins re-exported for sequences, tabs, FAQs and file trees.
    Accordion,
    Accordions,
    File,
    Files,
    Folder,
    Step,
    Steps,
    Tab,
    Tabs,
    // Emitted by remarkAutoTypeTable when a page uses <auto-type-table>. It is
    // not part of the authored vocabulary. Pages use <PropsTable> instead.
    TypeTable,

    // ---- The page contract -------------------------------------------------
    PageTemplate,

    // ---- Nothing is built --------------------------------------------------
    NotBuiltYet,
    StubNotice,
    NoDataYet,
    Todo,

    // ---- Status, release phase and the catalogue ---------------------------
    StatusBadge,
    SinceBadge,
    StatusMatrix,
    SectionProgress,
    ComponentsList,
    StatusLegend,
    SectionsRail,

    // ---- Preview and source ------------------------------------------------
    ComponentPreview,
    IframePreview,
    DeviceFrame,
    ViewportToolbar,
    ComponentSource,
    ComponentInstall,
    CodeBlockCommand,
    CodeTabs,
    CodeCollapsible,

    // ---- Copy, sharing and sandboxes ---------------------------------------
    CopyButton,
    PageActions,
    OpenInSandbox,

    // ---- Generated tables ---------------------------------------------------
    PropsTable,
    DataAttributesTable,
    CssVariablesTable,
    KeyboardTable,
    TokenTable,
    BundleSize,
    Kbd,

    // ---- Accessibility and colour measurement ------------------------------
    A11yReport,
    ContrastReport,
    ContrastOracle,
    CvdSimulator,

    // ---- Colour specimens ---------------------------------------------------
    ColorScale,
    TokenSwatch,
    StatusLadder,
    StatusAxisDemo,

    // ---- Material, motion, type, space, shape ------------------------------
    MaterialLadder,
    MotionCurve,
    MotionDemo,
    TypeScaleSpecimen,
    SpaceSpecimen,
    RadiusSpecimen,

    // ---- Guidance, evidence and review -------------------------------------
    WhenToUse,
    DoDont,
    Callout,
    SafetyCallout,
    ClinicalNote,
    ResearchNote,
    Reviewed,
    LastUpdated,
    PlainLanguage,
    ReadingLevel,

    // ---- Health vocabulary --------------------------------------------------
    RangeDemo,
    Term,
    Glossary,

    // ---- Anatomy and the component graph -----------------------------------
    Anatomy,
    CompositionTree,
    RelatedComponents,
    ApiLink,
    FlowDiagram,

    // ---- Page furniture -----------------------------------------------------
    BrowserSupport,
    VersionNotice,
    RegistryItem,
    Figure,
    PromptRecipe,
    EvalResult,
    Feedback,

    // Caller overrides last. This is where the docs route injects
    // `a: createRelativeLink(source, page)` so that relative .mdx links in
    // content resolve to real URLs. That resolution is why absolute /docs/
    // paths are banned in MDX (addendum A11).
    ...components,
  }
}

/**
 * fumadocs-mdx looks for `useMDXComponents` when a page is rendered outside an
 * explicit provider. Same object, different name.
 */
export const useMDXComponents = getMDXComponents

declare global {
  /** Consumed by fumadocs-mdx's generated types so MDX files typecheck. */
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
