---
"@sanity-labs/sanity-plugin-workflows": patch
---

Hide the injected `assignments` field on document types that have no `workflowDefinition`, matching the visibility behavior of the injected `status` and `statuses` fields.

Resolve the injected `status` field's initial value from the attached workflow's first stage instead of hardcoding `draft`, and leave it unset when no workflow applies.

Require `@sanity-labs/workflow-kit@^0.2.1`, which makes `StatusPathInput` respect Sanity document update permissions so users without edit access can no longer change a document's workflow stage.
