## What changed

<!-- One or two sentences. If this touches a clinical safety claim, start with the word "safety". -->

## Why

<!-- Link the issue, for example "Closes #12". -->

## Checklist

- [ ] `pnpm typecheck`, `pnpm lint` and `pnpm check` pass locally
- [ ] The title follows Conventional Commits, for example `fix(www): correct the contrast table source`
- [ ] The docs that describe this change are updated here, or no docs change is needed
- [ ] A change users will notice has a line in `apps/www/content/docs/changelog.mdx`
- [ ] No generated file is edited by hand. I changed its source and regenerated
- [ ] No U+2014 (em dash) or U+2013 (en dash) anywhere
- [ ] Every claim is generated, cited or labelled as opinion, and nothing implies a review that has not happened
- [ ] No real patient data, secret or token in the code, the text or a screenshot
- [ ] A visual change has screenshots in light and dark mode, and at 200% text size

<!-- A security vulnerability goes through the Security tab, never into a pull request. -->
