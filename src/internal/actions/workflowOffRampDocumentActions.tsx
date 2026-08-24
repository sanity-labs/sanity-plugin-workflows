import {
  canUseOffRampStage,
  getCachedWorkflowDefinition,
  getOffRampDisabledTitle,
  performWorkflowTransition,
  stripDraftsPrefix,
  type WorkflowDefinition,
  type WorkflowTransitionDocument,
  type WorkflowTransitionStage,
} from '@sanity-labs/workflow-kit/engine'
import {WorkflowTransitionOffRampDialogContent} from '@sanity-labs/workflow-kit/react'
import {useWorkflowProjectUsers} from '@sanity-labs/workflow-kit/studio'
import {ArrowRightIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui/toast'
import * as LucideIcons from 'lucide-react'
import {useCallback, useEffect, useMemo, useState, type ComponentType, type SVGProps} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionProps,
  useClient,
  useCurrentUser,
  useSchema,
} from 'sanity'

import {getWorkflowsApiVersion} from '../plugin/constants'

const MAX_WORKFLOW_OFF_RAMP_ACTIONS = 10

interface WorkflowStatusDocument extends WorkflowTransitionDocument {
  _id?: string
  status?: string
}

function isTransactionSyncLockActive(lock: DocumentActionProps['transactionSyncLock']): boolean {
  if (lock == null) return false
  if (typeof lock === 'object' && lock !== null && 'enabled' in lock) {
    return (lock as {enabled?: boolean}).enabled === true
  }
  return Boolean(lock)
}

function schemaTypeHasStatusField(schemaType: unknown): boolean {
  return Boolean(
    schemaType &&
    typeof schemaType === 'object' &&
    'fields' in schemaType &&
    Array.isArray(schemaType.fields) &&
    schemaType.fields.some((field: {name: string}) => field.name === 'status'),
  )
}

function kebabToPascal(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function resolveWorkflowLucideIcon(iconName?: string) {
  if (!iconName) return undefined

  return LucideIcons[kebabToPascal(iconName) as keyof typeof LucideIcons] as
    | ComponentType<SVGProps<SVGSVGElement>>
    | undefined
}

function workflowDocumentActionIconAt1em(
  Icon: ComponentType<SVGProps<SVGSVGElement>>,
): ComponentType<SVGProps<SVGSVGElement>> {
  function WorkflowDocumentActionIconAt1em(props: SVGProps<SVGSVGElement>) {
    return <Icon {...props} style={{width: '1em', height: '1em', flexShrink: 0, ...props.style}} />
  }

  WorkflowDocumentActionIconAt1em.displayName = `WorkflowDocumentActionIcon(${Icon.displayName ?? Icon.name ?? 'Icon'})`
  return WorkflowDocumentActionIconAt1em
}

function getOffRampActionLabel(offRamp: WorkflowTransitionStage): string {
  return `Move to ${offRamp.label || offRamp.slug || 'Off-ramp'}`
}

function insertAfterLeadingCustomActions(
  prev: DocumentActionComponent[],
  insertedActions: DocumentActionComponent[],
): DocumentActionComponent[] {
  if (insertedActions.length === 0) return prev

  const [firstAction, ...rest] = prev
  if (!firstAction) {
    return [...insertedActions, ...prev]
  }

  let leadingCustomActionCount = 0
  while (leadingCustomActionCount < rest.length && !rest[leadingCustomActionCount]?.action) {
    leadingCustomActionCount += 1
  }

  return [
    firstAction,
    ...rest.slice(0, leadingCustomActionCount),
    ...insertedActions,
    ...rest.slice(leadingCustomActionCount),
  ]
}

async function unpublishDocumentIfNeeded({
  client,
  draftDocumentId,
  logPrefix,
  publishedId,
  shouldUnpublish,
}: {
  client: ReturnType<typeof useClient>
  draftDocumentId: string
  logPrefix: string
  publishedId: string
  shouldUnpublish: boolean
}) {
  if (!shouldUnpublish) return

  try {
    const publishedDocument = await client.fetch<{_id: string} | null>(
      `*[_id == $publishedId][0]{_id}`,
      {publishedId},
    )
    if (!publishedDocument) return

    await client.action({
      actionType: 'sanity.action.document.unpublish',
      draftId: draftDocumentId,
      publishedId,
    })
  } catch (error) {
    console.error(`${logPrefix} Failed to unpublish off-ramped document:`, error)
  }
}

/** @public */
export function createWorkflowOffRampSlotAction(
  documentType: string,
  slotIndex: number,
): DocumentActionComponent {
  const WorkflowOffRampSlotAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const {draft, id, onComplete, published, ready, transactionSyncLock} = props
    const client = useClient({apiVersion: getWorkflowsApiVersion()})
    const currentUser = useCurrentUser()
    const schema = useSchema()
    const toast = useToast()
    const {aclData, loaded: workflowUsersLoaded, projectUsers} = useWorkflowProjectUsers(client)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [workflowDefinition, setWorkflowDefinition] = useState<
      null | undefined | WorkflowDefinition
    >(undefined)

    const schemaType = schema.get(documentType)
    const hasStatusField = schemaTypeHasStatusField(schemaType)
    const docSnapshot = (draft ?? published) as null | WorkflowStatusDocument
    const patchDocumentId = docSnapshot?._id
    const currentStatus = typeof docSnapshot?.status === 'string' ? docSnapshot.status : undefined
    const publishedId = id
      ? stripDraftsPrefix(id)
      : patchDocumentId
        ? stripDraftsPrefix(patchDocumentId)
        : undefined
    const draftDocumentId = publishedId ? `drafts.${publishedId}` : undefined

    useEffect(() => {
      let cancelled = false

      if (!hasStatusField) {
        setWorkflowDefinition(null)
        return
      }

      setWorkflowDefinition(undefined)

      void getCachedWorkflowDefinition(client, documentType)
        .then((definition) => {
          if (!cancelled) {
            setWorkflowDefinition(definition ?? null)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setWorkflowDefinition(null)
          }
        })

      return () => {
        cancelled = true
      }
    }, [client, hasStatusField])

    const offRamp = workflowDefinition?.offRamps?.[slotIndex]
    const stageTitle = offRamp?.label || offRamp?.slug || 'Off-ramp'
    const requiresRoleCheck = Boolean(offRamp?.allowedRoles?.length)
    const isCheckingPermissions = requiresRoleCheck && !workflowUsersLoaded
    const canUseOffRamp = offRamp
      ? canUseOffRampStage({
          aclData,
          allowedRoles: offRamp.allowedRoles,
          currentUserEmail: (currentUser as {email?: string} | null | undefined)?.email,
          currentUserSanityId: currentUser?.id,
          projectUsers,
          workflowRoles: workflowDefinition?.roles,
        })
      : false
    const isAlreadyInOffRamp = Boolean(offRamp?.slug && currentStatus === offRamp.slug)

    const closeDialog = useCallback(() => {
      setDialogOpen(false)
    }, [])

    const handleConfirm = useCallback(
      async (reason: string) => {
        if (
          !currentUser?.id ||
          !docSnapshot ||
          !patchDocumentId ||
          !publishedId ||
          !draftDocumentId ||
          !offRamp?.slug
        ) {
          return
        }

        setIsTransitioning(true)

        try {
          await performWorkflowTransition({
            client,
            currentUserId: currentUser.id,
            document: docSnapshot,
            documentId: patchDocumentId,
            documentType,
            logPrefix: '[workflowOffRampDocumentAction]',
            reason,
            targetStatusSlug: offRamp.slug,
            workflowDefinition,
          })

          await unpublishDocumentIfNeeded({
            client,
            draftDocumentId,
            logPrefix: '[workflowOffRampDocumentAction]',
            publishedId,
            shouldUnpublish: Boolean(offRamp.unpublishOnEntry),
          })

          toast.push({
            description: offRamp.unpublishOnEntry
              ? 'The document was moved to the selected off-ramp and unpublished from live surfaces.'
              : 'The document was moved to the selected off-ramp.',
            status: 'success',
            title: `Moved to ${stageTitle}`,
          })
          closeDialog()
          onComplete()
        } catch (error) {
          console.error(
            '[workflowOffRampDocumentAction] Failed to move document to off-ramp:',
            error,
          )
          toast.push({
            description:
              error instanceof Error
                ? error.message
                : 'Could not move this document to the selected off-ramp.',
            status: 'error',
            title: 'Off-ramp transition failed',
          })
        } finally {
          setIsTransitioning(false)
        }
      },
      [
        client,
        closeDialog,
        currentUser?.id,
        docSnapshot,
        draftDocumentId,
        offRamp,
        onComplete,
        patchDocumentId,
        publishedId,
        stageTitle,
        toast,
        workflowDefinition,
      ],
    )

    const actionTitle = useMemo(() => {
      if (!offRamp) {
        return ''
      }

      if (isTransitioning) {
        return offRamp.unpublishOnEntry
          ? `Moving to ${stageTitle} and unpublishing...`
          : `Moving to ${stageTitle}...`
      }

      if (isCheckingPermissions) {
        return 'Checking workflow permissions...'
      }

      if (!canUseOffRamp) {
        return getOffRampDisabledTitle({
          allowedRoles: offRamp.allowedRoles,
          workflowRoles: workflowDefinition?.roles,
        })
      }

      if (isAlreadyInOffRamp) {
        return `This document is already in ${stageTitle}.`
      }

      if (!ready || isTransactionSyncLockActive(transactionSyncLock)) {
        return 'Wait for the current document transaction to finish.'
      }

      return offRamp.unpublishOnEntry
        ? `Move this document to ${stageTitle} and unpublish it from live surfaces.`
        : `Move this document to ${stageTitle}.`
    }, [
      canUseOffRamp,
      isAlreadyInOffRamp,
      isCheckingPermissions,
      isTransitioning,
      offRamp,
      ready,
      stageTitle,
      transactionSyncLock,
      workflowDefinition?.roles,
    ])

    const actionIcon = useMemo(() => {
      const Lucide = resolveWorkflowLucideIcon(offRamp?.icon)
      const Base = Lucide ?? ArrowRightIcon
      return workflowDocumentActionIconAt1em(Base as ComponentType<SVGProps<SVGSVGElement>>)
    }, [offRamp?.icon])

    if (
      !hasStatusField ||
      workflowDefinition === undefined ||
      !docSnapshot ||
      !patchDocumentId ||
      !publishedId ||
      !draftDocumentId ||
      !offRamp?.slug
    ) {
      return null
    }

    const disabled =
      isTransitioning ||
      isCheckingPermissions ||
      !canUseOffRamp ||
      isAlreadyInOffRamp ||
      !ready ||
      isTransactionSyncLockActive(transactionSyncLock)

    return {
      dialog: dialogOpen
        ? {
            content: (
              <WorkflowTransitionOffRampDialogContent
                criteria={offRamp.stageCriteria}
                isSubmitting={isTransitioning}
                onCancel={closeDialog}
                onConfirm={handleConfirm}
                stageTitle={stageTitle}
                unpublishOnEntry={Boolean(offRamp.unpublishOnEntry)}
              />
            ),
            header: stageTitle,
            onClose: closeDialog,
            type: 'dialog' as const,
          }
        : null,
      disabled,
      icon: actionIcon,
      label: getOffRampActionLabel(offRamp),
      onHandle: () => {
        setDialogOpen(true)
      },
      title: actionTitle,
    }
  }

  WorkflowOffRampSlotAction.action =
    `workflowOffRamp.${slotIndex}` as DocumentActionComponent['action']

  return WorkflowOffRampSlotAction
}

/** @public */
export function workflowOffRampDocumentActionsResolver(
  prev: DocumentActionComponent[],
  context: {schemaType: string},
): DocumentActionComponent[] {
  return insertAfterLeadingCustomActions(
    prev,
    Array.from({length: MAX_WORKFLOW_OFF_RAMP_ACTIONS}, (_, slotIndex) =>
      createWorkflowOffRampSlotAction(context.schemaType, slotIndex),
    ),
  )
}
