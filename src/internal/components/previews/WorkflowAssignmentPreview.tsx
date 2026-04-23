import {useWorkflowProjectUsers} from '@sanity-labs/workflow-kit/studio'
import {Avatar} from '@sanity/ui'
import {useMemo} from 'react'
import type {PreviewProps} from 'sanity'
import {useClient} from 'sanity'

import {getWorkflowsApiVersion} from '../../plugin/constants'

type WorkflowAssignmentPreviewProps = PreviewProps & {
  assignmentType?: string
  userId?: string
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatAssignmentLabel(assignmentType?: string): string {
  if (!assignmentType?.trim()) return 'Assignment'

  const cleaned = assignmentType
    .trim()
    .replace(/^ed[-_]/i, '')
    .replace(/[-_]+/g, ' ')
  return cleaned.split(/\s+/).filter(Boolean).map(capitalize).join(' ')
}

function getInitials(value: string): string {
  const parts = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())

  return parts.join('') || value.slice(0, 2).toUpperCase()
}

function normalizeLookupValue(value: string): string {
  return value.trim().toLowerCase()
}

/** @public */
export function WorkflowAssignmentPreview(props: WorkflowAssignmentPreviewProps) {
  const {assignmentType, userId} = props
  const client = useClient({apiVersion: getWorkflowsApiVersion()})
  const {projectUsers} = useWorkflowProjectUsers(client)
  const assignmentLabel = formatAssignmentLabel(assignmentType)

  const projectUsersByIdentity = useMemo(() => {
    const lookup = new Map<
      string,
      {
        displayName?: string
        email?: string
        id?: string
        imageUrl?: string
        sanityUserId?: string
      }
    >()

    projectUsers.forEach((user) => {
      for (const value of [user.id, user.sanityUserId, user.email]) {
        if (typeof value === 'string' && value.trim()) {
          lookup.set(normalizeLookupValue(value), user)
        }
      }
    })

    return lookup
  }, [projectUsers])

  const resolvedUser =
    typeof userId === 'string' && userId.trim()
      ? projectUsersByIdentity.get(normalizeLookupValue(userId))
      : undefined
  const resolvedTitle = resolvedUser?.displayName?.trim() || resolvedUser?.email?.trim() || null
  const title = resolvedTitle || `${assignmentLabel}: ${userId || 'Unassigned'}`
  const subtitle = resolvedTitle ? assignmentLabel : undefined
  const media =
    resolvedTitle || resolvedUser?.imageUrl ? (
      <Avatar
        initials={getInitials(resolvedTitle || userId || assignmentLabel)}
        size={1}
        src={resolvedUser?.imageUrl}
        title={resolvedTitle || assignmentLabel}
      />
    ) : (
      props.media
    )

  return props.renderDefault({
    ...props,
    media,
    subtitle,
    title,
  })
}
