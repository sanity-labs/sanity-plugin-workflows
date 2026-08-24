---
"@sanity-labs/sanity-plugin-workflows": minor
---

Add declared and tested support for Sanity Studio 6.9.2 and later 6.x releases. Replace the Sanity 3-only Lucide picker dependency with a namespaced built-in picker, use the official UI 4 tooltip and toast entrypoints, harden asynchronous effects for React strict mode, and add clean packed-consumer builds at the Studio 6.9.2/UI 4.0.1 minimum and against the current Studio 6 release.

**Breaking:** Sanity `^6.9.2`, `@sanity/ui@^4.0.1`, and `workflow-kit@^0.6.0` are now required. Sanity 5 consumers should remain on plugin `^0.7.1` and workflow-kit `^0.5.1`. Sanity 6.0–6.9.1 is not formally supported; upgrade Studio before installing this release.
