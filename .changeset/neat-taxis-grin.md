---
'@sanity-labs/sanity-plugin-workflows': patch
---

Remove Sanetti-specific default excluded document types from `withWorkflow()` so only
`workflowDefinition` and `workflowsConfig` are excluded by default.

Update the README and API reference to clarify the new default exclusion behavior and explain
how plugin behavior varies across Sanity plans.
