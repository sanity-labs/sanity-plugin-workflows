---
"@sanity-labs/sanity-plugin-workflows": minor
---

Add declared and tested support for Sanity Studio 6 while retaining Studio 5 compatibility. Replace the Sanity 3-only Lucide picker dependency with a namespaced built-in picker, use the official UI 4 tooltip and toast entrypoints, harden asynchronous effects for React strict mode, and add clean packed-consumer build coverage across supported Studio versions.

**Breaking:** `@sanity/ui` 4 is now required. Upgrade consumers from UI 3 to `@sanity/ui@^4` before installing this release.
