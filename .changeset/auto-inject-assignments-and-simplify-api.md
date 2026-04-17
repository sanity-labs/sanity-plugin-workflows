---
"@sanity-labs/sanity-plugin-workflows": minor
---

# Changes

**BREAKING**: `generateAssignmentObject` has been removed. Use the exported `assignmentObject` directly. If you need additional fields on assignments (e.g. channel, market, region), define your own schema type with `name: 'assignment'` and register it via `workflowsPlugin({schemaTypes: [yourAssignment]})` — the plugin merges schema types by name, so yours replaces the default.

The `assignmentGroup` / `assignmentGroupLabel` / `assignmentGroupOptions` options are gone with the generator. Existing documents that stored these values will retain them as orphan data; run a one-off `unset` migration if you want to tidy them up.

**New feature**: `withWorkflow` now auto-injects an `assignments` array field on every workflow-aware document by default. Opt out with `workflowsPlugin({injectAssignments: false})`, or by declaring your own `assignments` field on the document type.

**Nicety**: `workflowsPlugin` can now be called with no arguments (`workflowsPlugin()`) for the default setup. Passing `workflowsPlugin({})` still works.
