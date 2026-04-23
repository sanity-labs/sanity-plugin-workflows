# @sanity-labs/sanity-plugin-workflows

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
