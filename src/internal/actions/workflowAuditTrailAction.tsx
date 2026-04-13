import {
  type DocumentActionComponent,
  type DocumentActionProps,
  useClient,
  useCurrentUser,
  useSchema,
} from 'sanity'
import {
  appendStatusAuditEntry,
  createTasksForWorkflowTemplates,
  fetchWorkflowDefinition,
  findWorkflowTransitionTarget,
  shouldSkipPublishAuditEntry,
  stripDraftsPrefix,
  type WorkflowTransitionDocument,
} from 'sanity-workflow-kit/engine'

import {getWorkflowsApiVersion} from '../plugin/constants'
import {workflowOffRampDocumentActionsResolver} from './workflowOffRampDocumentActions'
import {workflowTransitionActionResolver} from './workflowTransitionAction'

/** @public */
export function workflowAuditTrailActionResolver(
  prev: DocumentActionComponent[],
  context: {schemaType: string},
): DocumentActionComponent[] {
  const withPublishAudit = prev.map((action) => {
    if (action.action !== 'publish') return action

    const WrappedAction: DocumentActionComponent = (props: DocumentActionProps) => {
      const schema = useSchema()
      const schemaType = schema.get(context.schemaType)
      const hasStatusField =
        schemaType &&
        'fields' in schemaType &&
        Array.isArray(schemaType.fields) &&
        schemaType.fields.some((field: {name: string}) => field.name === 'status')

      if (!hasStatusField) {
        return action(props)
      }

      return createAuditTrailPublishAction(action, context.schemaType)(props)
    }

    WrappedAction.action = 'publish'
    return WrappedAction
  })

  return workflowTransitionActionResolver(
    workflowOffRampDocumentActionsResolver(withPublishAudit, context),
    context,
  )
}

function createAuditTrailPublishAction(
  originalPublishAction: DocumentActionComponent,
  documentType: string,
): DocumentActionComponent {
  const AuditTrailPublishAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const client = useClient({apiVersion: getWorkflowsApiVersion()})
    const currentUser = useCurrentUser()
    const originalResult = originalPublishAction(props)

    if (!originalResult) {
      return originalResult
    }

    return {
      ...originalResult,
      onHandle: async () => {
        const publishedId = stripDraftsPrefix(props.id)
        let previousStatus: string | undefined

        try {
          const document = await client.fetch<null | Record<string, unknown>>(`*[_id == $id][0]`, {
            id: publishedId,
          })
          previousStatus = typeof document?.status === 'string' ? document.status : undefined
        } catch {
          // Ignore pre-publish fetch errors for new documents.
        }

        if (originalResult.onHandle) {
          await originalResult.onHandle()
        }

        const draft = props.draft
        if (!draft || !currentUser) return

        const draftStatus = draft.status
        if (typeof draftStatus !== 'string' || !draftStatus) return
        if (previousStatus === draftStatus) return

        let workflowDefinition = null
        try {
          workflowDefinition = await fetchWorkflowDefinition(client, documentType)
        } catch {
          // Fall back to slug-only labels if the definition fetch fails.
        }

        const workflowDocument = draft as WorkflowTransitionDocument
        const targetStage = findWorkflowTransitionTarget(workflowDefinition, draftStatus)

        if (!shouldSkipPublishAuditEntry(workflowDocument.statuses, draftStatus)) {
          try {
            await appendStatusAuditEntry({
              client,
              currentUserId: currentUser.id,
              document: workflowDocument,
              documentId: publishedId,
              documentType,
              statusSlug: draftStatus,
              workflowDefinition,
            })
          } catch (error) {
            console.error('[workflowAuditTrailAction] Failed to append audit entry:', error)
          }
        }

        if (targetStage?.taskTemplates?.length) {
          try {
            await createTasksForWorkflowTemplates({
              client,
              currentUserId: currentUser.id,
              document: workflowDocument,
              documentId: publishedId,
              documentType,
              logPrefix: '[workflowAuditTrailAction]',
              skipIfTasksExist: true,
              templates: targetStage.taskTemplates,
            })
          } catch (error) {
            console.error('[workflowAuditTrailAction] Task creation safety net failed:', error)
          }
        }
      },
    }
  }

  return AuditTrailPublishAction
}
