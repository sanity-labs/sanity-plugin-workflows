import {
  evaluateWorkflowStageGating,
  findNextWorkflowStage,
  findWorkflowTransitionTarget,
  getCachedWorkflowDefinition,
  performWorkflowTransition,
  resolveAssigneeForTaskTemplate,
  subscribeWorkflowStageGating,
  userHasWorkflowRoleAccess,
  workflowRoleSlugMatches,
  type WorkflowDefinition,
  type WorkflowStageGatingResult,
  type WorkflowTransitionDocument,
  type WorkflowTransitionStage,
} from '@sanity-labs/workflow-kit/engine'
import {
  WorkflowTransitionConfirmDialogContent,
  WorkflowTransitionGatedDialogContent,
  type WorkflowTransitionTaskAssigneeOverride,
  type WorkflowTransitionTaskRow,
  type WorkflowTransitionTaskStatusOverride,
  type WorkflowTransitionTaskTemplatePreview,
} from '@sanity-labs/workflow-kit/react'
import {buildTaskViewPath, useWorkflowProjectUsers} from '@sanity-labs/workflow-kit/studio'
import {ArrowRightIcon} from '@sanity/icons'
import {Card, Text} from '@sanity/ui'
import * as LucideIcons from 'lucide-react'
import {useCallback, useEffect, useMemo, useState, type ComponentType, type SVGProps} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionProps,
  useClient,
  useCurrentUser,
  useSchema,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {getWorkflowsApiVersion} from '../plugin/constants'

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

/** @public */
export function workflowTransitionActionResolver(
  prev: DocumentActionComponent[],
  context: {schemaType: string},
): DocumentActionComponent[] {
  return prev.map((action) => {
    if (action.action !== 'publish') return action

    const WrappedAction: DocumentActionComponent = (props: DocumentActionProps) => {
      const schema = useSchema()
      const schemaType = schema.get(context.schemaType)

      if (!schemaTypeHasStatusField(schemaType)) {
        return action(props)
      }

      return createWorkflowTransitionAction(action, context.schemaType)(props)
    }

    WrappedAction.action = 'publish'
    return WrappedAction
  })
}

/** @public */
export function createWorkflowTransitionAction(
  originalPublishAction: DocumentActionComponent,
  documentType: string,
): DocumentActionComponent {
  const WorkflowTransitionAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const {draft, onComplete, published, ready, transactionSyncLock} = props
    const client = useClient({apiVersion: getWorkflowsApiVersion()})
    const currentUser = useCurrentUser()
    const router = useRouter()
    const {aclData, projectUsers} = useWorkflowProjectUsers(client)
    const originalResult = originalPublishAction(props)
    const hasPublishActionResult = Boolean(originalResult)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [workflowDefinition, setWorkflowDefinition] = useState<
      null | undefined | WorkflowDefinition
    >(undefined)
    const [modalType, setModalType] = useState<'confirm' | 'error' | 'gated' | null>(null)
    const [transitionError, setTransitionError] = useState<string | null>(null)
    const [pendingStage, setPendingStage] = useState<null | WorkflowTransitionStage>(null)
    const [pendingSourceStageName, setPendingSourceStageName] = useState('')
    const [gatedTasks, setGatedTasks] = useState<WorkflowTransitionTaskRow[]>([])
    const [gatingStage, setGatingStage] = useState<null | WorkflowTransitionStage>(null)

    const docSnapshot = (draft ?? published) as null | WorkflowStatusDocument
    const patchDocumentId = docSnapshot?._id
    const currentStatus = typeof docSnapshot?.status === 'string' ? docSnapshot.status : undefined

    useEffect(() => {
      let cancelled = false

      if (!hasPublishActionResult) {
        setWorkflowDefinition(undefined)
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
    }, [client, hasPublishActionResult])

    const currentStage = useMemo(
      () =>
        currentStatus ? findWorkflowTransitionTarget(workflowDefinition, currentStatus) : undefined,
      [currentStatus, workflowDefinition],
    )

    const nextStage = useMemo(
      () => findNextWorkflowStage(workflowDefinition, currentStatus),
      [currentStatus, workflowDefinition],
    )

    const transitionActionIcon = useMemo(() => {
      const Lucide = resolveWorkflowLucideIcon(nextStage?.icon)
      const Base = Lucide ?? ArrowRightIcon
      return workflowDocumentActionIconAt1em(Base as ComponentType<SVGProps<SVGSVGElement>>)
    }, [nextStage?.icon])

    const shouldShowTransitionAction = Boolean(
      originalResult && docSnapshot && patchDocumentId && currentUser && nextStage?.slug,
    )

    const currentUserCanOverride = useMemo(() => {
      if (!currentStage?.gatingOverrideRoles?.length || !currentUser?.id) return false

      return userHasWorkflowRoleAccess({
        aclData,
        currentUserEmail: (currentUser as {email?: string}).email,
        currentUserSanityId: currentUser.id,
        projectUsers,
        requestedWorkflowRoleSlugs: currentStage.gatingOverrideRoles,
        workflowRoles: workflowDefinition?.roles,
      })
    }, [aclData, currentStage, currentUser, projectUsers, workflowDefinition?.roles])

    const confirmTaskTemplates = useMemo(() => {
      if (!pendingStage?.taskTemplates?.length) return null

      return pendingStage.taskTemplates.map((template) => {
        const resolvedFromDoc = resolveAssigneeForTaskTemplate(docSnapshot, template.assigneeRole)
        const role = workflowDefinition?.roles?.find((workflowRole) =>
          workflowRoleSlugMatches(template.assigneeRole, workflowRole.slug),
        )
        const projectRoles = new Set(role?.projectRoles || [])
        const eligibleIds =
          typeof resolvedFromDoc === 'string' && resolvedFromDoc.length > 0
            ? [resolvedFromDoc]
            : aclData
                .filter((entry) => entry.roles?.some((aclRole) => projectRoles.has(aclRole.name)))
                .map((entry) => entry.projectUserId)

        return {
          assigneeRole: template.assigneeRole,
          dueInDays: template.dueInDays,
          eligibleUsers: eligibleIds
            .map((id) => projectUsers.find((user) => user.id === id))
            .filter((user): user is NonNullable<typeof user> => Boolean(user))
            .map((user) => ({
              displayName: user.displayName,
              id: user.id,
              imageUrl: user.imageUrl,
            })),
          initialAssignedTo: resolvedFromDoc,
          title: template.title,
        } satisfies WorkflowTransitionTaskTemplatePreview
      })
    }, [aclData, docSnapshot, pendingStage, projectUsers, workflowDefinition?.roles])

    const closeDialog = useCallback(() => {
      setModalType(null)
      setTransitionError(null)
      setPendingStage(null)
      setPendingSourceStageName('')
      setGatedTasks([])
      setGatingStage(null)
    }, [])

    const openConfirmDialog = useCallback((stage: WorkflowTransitionStage) => {
      setGatedTasks([])
      setGatingStage(null)
      setPendingStage(stage)
      setModalType('confirm')
    }, [])

    useEffect(() => {
      if (modalType !== 'gated' || !gatingStage || !patchDocumentId || !pendingStage) {
        return
      }

      return subscribeWorkflowStageGating({
        client,
        documentId: patchDocumentId,
        onError: (error: unknown) => {
          console.error('[workflowTransitionAction] Failed to refresh gated tasks:', error)
        },
        onResult: (result: WorkflowStageGatingResult) => {
          if (result.blocked) {
            setGatedTasks(result.tasks)
            return
          }

          openConfirmDialog(pendingStage)
        },
        stage: gatingStage,
      })
    }, [client, gatingStage, modalType, openConfirmDialog, patchDocumentId, pendingStage])

    const executeTransition = useCallback(
      async (
        targetStage: WorkflowTransitionStage,
        overrides?: Map<number, string | undefined>,
        note?: string,
      ) => {
        if (!currentUser || !docSnapshot || !patchDocumentId || !targetStage.slug) return

        setIsTransitioning(true)

        try {
          await performWorkflowTransition({
            client,
            currentUserId: currentUser.id,
            document: docSnapshot,
            documentId: patchDocumentId,
            documentType,
            logPrefix: '[workflowTransitionAction]',
            note,
            targetStatusSlug: targetStage.slug,
            taskAssigneeOverrides: overrides,
            workflowDefinition,
          })

          closeDialog()
          onComplete()
        } catch (error) {
          console.error('[workflowTransitionAction] Failed to move document to next stage:', error)
          setTransitionError(
            error instanceof Error
              ? error.message
              : 'Could not move this document to the next workflow stage.',
          )
          setModalType('error')
        } finally {
          setIsTransitioning(false)
        }
      },
      [
        client,
        closeDialog,
        currentUser,
        docSnapshot,
        patchDocumentId,
        onComplete,
        workflowDefinition,
      ],
    )

    const handleTransition = useCallback(async () => {
      if (!currentUser || !docSnapshot || !patchDocumentId || !nextStage?.slug) return

      if (currentStage?.enableCompletionGating) {
        const {blocked, tasks} = await evaluateWorkflowStageGating({
          client,
          documentId: patchDocumentId,
          stage: currentStage,
        })

        if (blocked) {
          setGatedTasks(tasks)
          setGatingStage(currentStage)
          setPendingSourceStageName(currentStage.label || currentStage.slug || 'Current stage')
          setPendingStage(nextStage)
          setModalType('gated')
          return
        }
      }

      const hasCriteria =
        Array.isArray(nextStage.stageCriteria) && nextStage.stageCriteria.length > 0
      const hasTemplates =
        Array.isArray(nextStage.taskTemplates) && nextStage.taskTemplates.length > 0

      if (hasCriteria || hasTemplates) {
        setPendingStage(nextStage)
        setModalType('confirm')
        return
      }

      await executeTransition(nextStage)
    }, [
      client,
      currentStage,
      currentUser,
      docSnapshot,
      executeTransition,
      nextStage,
      patchDocumentId,
    ])

    const handleConfirmDialogConfirm = useCallback(
      async (overrides?: WorkflowTransitionTaskAssigneeOverride[], note?: string) => {
        if (!pendingStage) return

        await executeTransition(
          pendingStage,
          overrides?.length
            ? new Map(
                overrides.map((override) => [override.templateIndex, override.assignedTo] as const),
              )
            : undefined,
          note,
        )
      },
      [executeTransition, pendingStage],
    )

    const handleGatedDialogConfirm = useCallback(
      async (overrides: WorkflowTransitionTaskStatusOverride[]) => {
        setGatingStage(null)
        const mainDataset = client.config().dataset

        if (mainDataset) {
          const addonClient = client.withConfig({
            dataset: `${mainDataset}-comments`,
          })
          const toggles = overrides.map((override) =>
            addonClient
              .patch(override.taskId)
              .set({status: override.status})
              .commit()
              .catch(() => {}),
          )
          await Promise.all(toggles)
        }

        if (pendingStage) {
          await executeTransition(pendingStage)
        }
      },
      [client, executeTransition, pendingStage],
    )

    const actionDialog =
      modalType === 'error' && transitionError
        ? {
            content: (
              <Card border padding={4} radius={2} tone="critical">
                <Text size={1}>{transitionError}</Text>
              </Card>
            ),
            header: 'Transition failed',
            onClose: closeDialog,
            type: 'dialog' as const,
          }
        : modalType === 'gated' && pendingStage
          ? {
              content: (
                <WorkflowTransitionGatedDialogContent
                  currentUserCanOverride={currentUserCanOverride}
                  isSubmitting={isTransitioning}
                  onCancel={closeDialog}
                  onConfirm={handleGatedDialogConfirm}
                  onViewTask={(taskId) => {
                    const path = buildTaskViewPath(taskId)
                    if (path) router.navigateUrl({path})
                  }}
                  sourceStageName={pendingSourceStageName}
                  targetStageTitle={pendingStage.label || pendingStage.slug || 'Next stage'}
                  tasks={gatedTasks}
                  users={projectUsers.map((user) => ({
                    displayName: user.displayName,
                    id: user.id,
                    imageUrl: user.imageUrl,
                  }))}
                />
              ),
              header: currentUserCanOverride
                ? `Move to ${pendingStage.label || pendingStage.slug}`
                : "Can't advance - open tasks remaining",
              onClose: closeDialog,
              type: 'dialog' as const,
            }
          : modalType === 'confirm' && pendingStage
            ? {
                content: (
                  <WorkflowTransitionConfirmDialogContent
                    criteria={pendingStage.stageCriteria}
                    isSubmitting={isTransitioning}
                    onCancel={closeDialog}
                    onConfirm={handleConfirmDialogConfirm}
                    stageTitle={pendingStage.label || pendingStage.slug || 'Next stage'}
                    taskTemplates={confirmTaskTemplates}
                  />
                ),
                header: `Move to ${pendingStage.label || pendingStage.slug}`,
                onClose: closeDialog,
                type: 'dialog' as const,
              }
            : null

    if (originalResult && workflowDefinition === undefined && docSnapshot && patchDocumentId) {
      return {
        ...originalResult,
        disabled: true,
        icon: ArrowRightIcon,
        label: 'Loading workflow...',
        title: 'Resolving workflow stages for this document type...',
      }
    }

    if (!originalResult || !shouldShowTransitionAction || !nextStage) {
      return originalResult
    }

    return {
      ...originalResult,
      dialog: actionDialog,
      disabled: isTransitioning || !ready || isTransactionSyncLockActive(transactionSyncLock),
      icon: transitionActionIcon,
      label: `Move to ${nextStage.label || nextStage.slug}`,
      onHandle: () => {
        void handleTransition()
      },
      tone: 'primary',
      title: isTransitioning
        ? `Moving to ${nextStage.label || nextStage.slug}...`
        : `Advance this document to ${nextStage.label || nextStage.slug}. Related stage tasks will be created automatically.`,
    }
  }

  return WorkflowTransitionAction
}
