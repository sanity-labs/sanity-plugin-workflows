import {
  ensureWorkflowStageTasks,
  type WorkflowAssignmentValue,
} from '@sanity-labs/workflow-kit/engine'
import {Activity, useEffect, useRef} from 'react'
import {
  type ArrayFieldProps,
  useClient,
  useCurrentUser,
  useFormValue,
} from 'sanity'

import {useHasWorkflow} from '../../../audit/useHasWorkflow'
import {getWorkflowsApiVersion} from '../../../plugin/constants'

function assignmentsFingerprint(value: unknown): string {
  if (!Array.isArray(value)) return ''

  return value
    .map((entry) => {
      const assignment = entry as WorkflowAssignmentValue & {_key?: string}
      return `${assignment._key ?? ''}:${assignment.assignmentType ?? ''}:${assignment.userId ?? ''}`
    })
    .sort()
    .join('|')
}

function hasAssignedUser(value: unknown): boolean {
  if (!Array.isArray(value)) return false
  return value.some((entry) => {
    const userId = (entry as WorkflowAssignmentValue | undefined)?.userId
    return typeof userId === 'string' && userId.length > 0
  })
}

/**
 * Hides the assignments field when no workflow targets the document type, and
 * ensures current-stage tasks when assignments gain user ids (publish may be gated).
 */
export function WorkflowAssignmentsFieldWrapper(props: ArrayFieldProps) {
  const {renderDefault, value} = props
  const documentType = useFormValue(['_type']) as string | undefined
  const documentId = useFormValue(['_id']) as string | undefined
  const status = useFormValue(['status']) as string | undefined
  const hasWorkflow = useHasWorkflow(documentType ?? '')
  const client = useClient({apiVersion: getWorkflowsApiVersion()})
  const currentUser = useCurrentUser()
  const lastEnsuredFingerprint = useRef<string>('')

  useEffect(() => {
    if (hasWorkflow !== true) return
    if (!documentId || !documentType || !currentUser?.id) return
    if (typeof status !== 'string' || !status) return
    if (!hasAssignedUser(value)) return

    const fingerprint = `${documentId}|${status}|${assignmentsFingerprint(value)}`
    if (fingerprint === lastEnsuredFingerprint.current) return
    lastEnsuredFingerprint.current = fingerprint

    void ensureWorkflowStageTasks({
      client,
      currentUserId: currentUser.id,
      document: {
        assignments: Array.isArray(value) ? (value as WorkflowAssignmentValue[]) : undefined,
        status,
      },
      documentId,
      documentType,
      logPrefix: '[WorkflowAssignmentsFieldWrapper]',
      statusSlug: status,
    }).catch((error: unknown) => {
      // Allow a later effect to retry if this attempt failed.
      if (lastEnsuredFingerprint.current === fingerprint) {
        lastEnsuredFingerprint.current = ''
      }
      console.error('[WorkflowAssignmentsFieldWrapper] Failed to ensure stage tasks:', error)
    })
  }, [client, currentUser?.id, documentId, documentType, hasWorkflow, status, value])

  return <Activity mode={hasWorkflow ? 'visible' : 'hidden'}>{renderDefault(props)}</Activity>
}
