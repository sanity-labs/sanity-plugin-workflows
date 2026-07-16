# @sanity-labs/sanity-plugin-workflows

## 0.7.0

### Minor Changes

- 65755f8: Ensure current-stage workflow tasks when document assignments gain user ids, instead of relying on publish.

  - `WorkflowAssignmentsFieldWrapper` calls `ensureWorkflowStageTasks` when assignment user ids appear, so first-stage tasks work even when the current stage has `enablePublishing: false`.
  - The publish audit-trail path still best-effort ensures tasks, but is no longer the primary first-stage creation strategy.
  - Role-bound task templates are deferred until their assignee role resolves on `assignments[]` (via `@sanity-labs/workflow-kit`).
  - Depends on `@sanity-labs/workflow-kit@^0.5.0` for `ensureWorkflowStageTasks` and deferred task creation.

## 0.6.1

### Patch Changes

- f078905: Stop leaving an empty grid row when workflow fields are hidden

  `withWorkflow` now injects a document-level `input` component that filters the injected `status` and `assignments` members out of the form when no `workflow.definition` targets the document type. Previously the fields were only hidden visually, so Sanity's per-field comments wrapper (`FieldStack`) still occupied a grid row and pushed the remaining fields down. Any `components.input` the document already declares is preserved and rendered with the filtered members.

## 0.6.0

### Minor Changes

- bdd3dbc: Fix workflow field wrappers hiding unrelated UI by mutating parent DOM

  The `status`, `assignments`, and `statuses` field wrappers previously set `display: none` on their parent DOM element via a `useEffect`. When these fields rendered outside the document form (for example in the Studio's compare versions tool), the parent was a shared layout container, so entire panes were blanked out — and the inline style persisted even after the component unmounted.

  The wrappers now use React's `<Activity>` component to hide their own subtree instead, which never touches DOM outside the component and pauses effects of hidden content. Fields are also hidden while the workflow lookup is in flight, removing the flash where inputs briefly appeared and then disappeared when opening a document without a workflow.

  Note: the `react` peer dependency is now `^19.2`, since `<Activity>` shipped in React 19.2.

## 0.5.0

### Minor Changes

- dd274ac: Namespace the workflow stage color type to avoid collisions with host studios.

  v0.4.0 registered `@sanity/color-input` via `colorInput()`, which defines a global `color` object type. Studios that already define their own `color` type (for example a `color` product-attribute document) failed to compile with "A type with name 'color' is already defined".

  The stage color field now uses a namespaced `workflow.color` object that reuses color-input's field structure, preview, and `ColorInput` component, so the plugin no longer registers the bare `color` type. No consumer configuration is required.

  **Breaking:** stage `color` values stored under `_type: 'color'` (v0.4.0) or as legacy hex strings (<= v0.3.0) must be converted. Run the bundled migration:

  ```
  npx sanity migration run color-to-color-input
  ```

## 0.4.0

### Minor Changes

- 251646e: Restore the Lucide icon picker and add a color picker to workflow stages.
  - The `workflow.lucideIcon` field uses the `sanity-plugin-lucide-icon-picker` input again, fixing a v0.3.0 regression where it rendered as a plain text field. The stored kebab-case string is unchanged.
  - The `workflow.stage` `color` field is now a `@sanity/color-input` color object instead of a hex string, giving editors a real color picker. The plugin registers `colorInput()` automatically, so no consumer configuration is required.

  Requires `@sanity-labs/workflow-kit` >= 0.4.0, which projects stage/off-ramp colors via `coalesce(color.hex, color)`.

  **Breaking:** existing `workflow.definition` documents store `color` as a hex string. Run the bundled migration to convert them to the new object shape:

  ```
  npx sanity migration run color-to-color-input
  ```

## 0.3.0

### Minor Changes

- dedfc4d: **Breaking change:** namespace all bundled workflow schema types under `workflow.*` to avoid claiming generic global schema names in consuming Studios.

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

## 0.2.4

### Patch Changes

- 7547690: Hide the injected `assignments` field on document types that have no `workflowDefinition`, matching the visibility behavior of the injected `status` and `statuses` fields.

  Resolve the injected `status` field's initial value from the attached workflow's first stage instead of hardcoding `draft`, and leave it unset when no workflow applies.

  Require `@sanity-labs/workflow-kit@^0.2.1`, which makes `StatusPathInput` respect Sanity document update permissions so users without edit access can no longer change a document's workflow stage.

## 0.2.3

### Patch Changes

- 749387a: Fix clean Studio startup by registering bundled fallback `user` and `lucide-icon` schema types for workflow audit entries and icons, resolving the schema compilation errors reported in [#9](https://github.com/sanity-labs/sanity-plugin-workflows/issues/9).

## 0.2.2

### Patch Changes

- 707785e: Improve the default assignment object experience in Studio.

  Assignment previews now resolve project member display names and avatars from project access data
  instead of only showing the raw assigned user id. The assignment type input now falls back to the
  default string input when workflow role options are unavailable, avoiding a blank or broken role
  selector in custom workflow setups.

## 0.2.1

### Patch Changes

- c6e14ed: Remove Sanetti-specific default excluded document types from `withWorkflow()` so only
  `workflowDefinition` and `workflowsConfig` are excluded by default.

  Update the README and API reference to clarify the new default exclusion behavior and explain
  how plugin behavior varies across Sanity plans.

## 0.2.0

### Minor Changes

- 8fd819b: # Changes

  **BREAKING**: `generateAssignmentObject` has been removed. Use the exported `assignmentObject` directly. If you need additional fields on assignments (e.g. channel, market, region), define your own schema type with `name: 'assignment'` and register it via `workflowsPlugin({schemaTypes: [yourAssignment]})` — the plugin merges schema types by name, so yours replaces the default.

  The `assignmentGroup` / `assignmentGroupLabel` / `assignmentGroupOptions` options are gone with the generator. Existing documents that stored these values will retain them as orphan data; run a one-off `unset` migration if you want to tidy them up.

  **New feature**: `withWorkflow` now auto-injects an `assignments` array field on every workflow-aware document by default. Opt out with `workflowsPlugin({injectAssignments: false})`, or by declaring your own `assignments` field on the document type.

  **Nicety**: `workflowsPlugin` can now be called with no arguments (`workflowsPlugin()`) for the default setup. Passing `workflowsPlugin({})` still works.

## 0.1.1

### Patch Changes

- 0286f8d: fix: update plugin to use published @sanity-labs/workflow-kit package
