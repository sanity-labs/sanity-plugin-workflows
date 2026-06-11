---
"@sanity-labs/sanity-plugin-workflows": patch
---

Stop leaving an empty grid row when workflow fields are hidden

`withWorkflow` now injects a document-level `input` component that filters the injected `status` and `assignments` members out of the form when no `workflow.definition` targets the document type. Previously the fields were only hidden visually, so Sanity's per-field comments wrapper (`FieldStack`) still occupied a grid row and pushed the remaining fields down. Any `components.input` the document already declares is preserved and rendered with the filtered members.
