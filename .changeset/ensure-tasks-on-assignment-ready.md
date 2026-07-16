---
'@sanity-labs/sanity-plugin-workflows': minor
---

Ensure current-stage workflow tasks when document assignments gain user ids, instead of relying on publish.

- `WorkflowAssignmentsFieldWrapper` calls `ensureWorkflowStageTasks` when assignment user ids appear, so first-stage tasks work even when the current stage has `enablePublishing: false`.
- The publish audit-trail path still best-effort ensures tasks, but is no longer the primary first-stage creation strategy.
- Role-bound task templates are deferred until their assignee role resolves on `assignments[]` (via `@sanity-labs/workflow-kit`).
