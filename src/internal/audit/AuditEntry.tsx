import {Card, Stack, Text} from '@sanity/ui'

import type {WorkflowStatusEntry} from './types'

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return months === 1 ? '1 month ago' : `${months} months ago`
  }

  const years = Math.floor(diffDays / 365)
  return years === 1 ? '1 year ago' : `${years} years ago`
}

export function AuditEntry({entry}: {entry: WorkflowStatusEntry}) {
  const userName = entry.completedBy?.displayName ?? entry.completedBy?.userId ?? 'Unknown user'

  return (
    <Card padding={3} radius={2} border>
      <Stack space={2}>
        <Text weight="semibold">{entry.statusLabel}</Text>
        <Text muted size={1}>
          {userName}
        </Text>
        <Text muted size={1}>
          {formatRelativeDate(entry.completedAt)}
        </Text>
        {entry.reason ? (
          <Card padding={2} radius={2} tone="caution">
            <Text size={1}>{entry.reason}</Text>
          </Card>
        ) : null}
      </Stack>
    </Card>
  )
}
