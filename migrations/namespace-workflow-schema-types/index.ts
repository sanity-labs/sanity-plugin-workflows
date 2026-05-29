import {at, defineMigration, set} from 'sanity/migrate'

const OBJECT_TYPE_RENAMES: Record<string, string> = {
  assignment: 'workflow.assignment',
  setStatus: 'workflow.setStatus',
  taskTemplate: 'workflow.taskTemplate',
  workflowOffRamp: 'workflow.offRamp',
  workflowRole: 'workflow.role',
  workflowStage: 'workflow.stage',
}

/**
 * Namespace persisted workflow schema types introduced in v0.3.0.
 *
 * To run:
 *   npx sanity migration run namespace-workflow-schema-types
 *   (append --no-dry-run to apply changes)
 *
 * If you used the optional generateStatusType() helper, migrate `status`
 * documents to `workflow.status` separately to avoid renaming unrelated
 * project-specific status document types.
 */
export default defineMigration({
  migrate: {
    document(doc) {
      if (doc._type === 'workflowDefinition') {
        return at('_type', set('workflow.definition'))
      }
    },
    object(obj, path) {
      const lastSegment = path[path.length - 1]
      const nextType =
        obj._type === 'user' && lastSegment === 'completedBy'
          ? 'workflow.user'
          : typeof obj._type === 'string'
            ? OBJECT_TYPE_RENAMES[obj._type]
            : undefined

      if (nextType) {
        return set({...obj, _type: nextType})
      }
    },
  },
  title: 'Namespace workflow schema types',
})
