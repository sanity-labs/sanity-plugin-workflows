---
"@sanity-labs/sanity-plugin-workflows": minor
---

Restore the Lucide icon picker and add a color picker to workflow stages.

- The `workflow.lucideIcon` field uses the `sanity-plugin-lucide-icon-picker` input again, fixing a v0.3.0 regression where it rendered as a plain text field. The stored kebab-case string is unchanged.
- The `workflow.stage` `color` field is now a `@sanity/color-input` color object instead of a hex string, giving editors a real color picker. The plugin registers `colorInput()` automatically, so no consumer configuration is required.

Requires `@sanity-labs/workflow-kit` >= 0.4.0, which projects stage/off-ramp colors via `coalesce(color.hex, color)`.

**Breaking:** existing `workflow.definition` documents store `color` as a hex string. Run the bundled migration to convert them to the new object shape:

```
npx sanity migration run color-to-color-input
```
