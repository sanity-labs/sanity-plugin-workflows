---
"@sanity-labs/sanity-plugin-workflows": minor
---

**Breaking change:** namespace all bundled workflow schema types under `workflow.*` to avoid claiming generic global schema names in consuming Studios.

Schema type names changed as follows:

- `workflowDefinition` -> `workflow.definition`
- `workflowRole` -> `workflow.role`
- `workflowStage` -> `workflow.stage`
- `workflowOffRamp` -> `workflow.offRamp`
- `taskTemplate` -> `workflow.taskTemplate`
- `assignment` -> `workflow.assignment`
- `setStatus` -> `workflow.setStatus`
- `user` -> `workflow.user`
- `lucide-icon` -> `workflow.lucideIcon`

This release also removes the deprecated document lifecycle dashboard schema types `workflowsConfig`, `tableView`, and `tableViewColumn` from the plugin's default schema types and public schema entrypoint. These types were orphans from early stage development and were unused.

Existing datasets with workflow definitions, injected `assignments`, or audit `statuses` must migrate persisted `_type` values before the Studio will fully validate historical data. A copyable Sanity migration is included at [`migrations/namespace-workflow-schema-types`](./migrations/namespace-workflow-schema-types), and the README includes full upgrade notes in the "Migrating to 0.3.0" section.
