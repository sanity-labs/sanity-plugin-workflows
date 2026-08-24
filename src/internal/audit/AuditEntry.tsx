import {Avatar, Card, Flex, Stack, Text} from '@sanity/ui'

import type {WorkflowStatusEntry} from './types'

function formatUtcTimestamp(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`
}

export function AuditEntry({
  entry,
  resolvedActor,
  index,
}: {
  entry: WorkflowStatusEntry
  resolvedActor?: {
    displayName?: string
    imageUrl?: string
  }
  index: number
}) {
  const userName =
    resolvedActor?.displayName ??
    entry.completedBy?.displayName ??
    entry.completedBy?.userId ??
    'Unknown user'
  const avatarUrl = resolvedActor?.imageUrl ?? entry.completedBy?.imageUrl
  const statusLabel = entry.statusLabel || entry.statusSlug || 'Unknown stage'

  return (
    <Card padding={2} radius={2} tone={index === 0 ? 'transparent' : 'default'}>
      <Flex align="center" gap={3}>
        <span aria-label={userName} title={userName} style={{display: 'flex', flexShrink: 0}}>
          <Avatar src={avatarUrl} size={2} style={{borderRadius: '9999px'}} />
        </span>
        <Stack gap={2}>
          <Text size={1} weight="medium">{`Moved to ${statusLabel}`}</Text>
          <Text muted size={1}>
            {formatUtcTimestamp(entry.completedAt)}
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}
