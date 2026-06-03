---
"@sanity-labs/sanity-plugin-workflows": minor
---

Namespace the workflow stage color type to avoid collisions with host studios.

v0.4.0 registered `@sanity/color-input` via `colorInput()`, which defines a global `color` object type. Studios that already define their own `color` type (for example a `color` product-attribute document) failed to compile with "A type with name 'color' is already defined".

The stage color field now uses a namespaced `workflow.color` object that reuses color-input's field structure, preview, and `ColorInput` component, so the plugin no longer registers the bare `color` type. No consumer configuration is required.

**Breaking:** stage `color` values stored under `_type: 'color'` (v0.4.0) or as legacy hex strings (<= v0.3.0) must be converted. Run the bundled migration:

```
npx sanity migration run color-to-color-input
```
