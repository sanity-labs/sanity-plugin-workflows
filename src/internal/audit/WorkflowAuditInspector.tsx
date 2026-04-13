import {ClipboardIcon} from '@sanity/icons'
import {Badge, Box, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {getWorkflowsApiVersion} from '../plugin/constants'
import {AuditEntry} from './AuditEntry'
import type {WorkflowStatusEntry} from './types'

/** @public */
export function WorkflowAuditInspector({
  documentId,
  documentType: _documentType,
}: {
  documentId: string
  documentType: string
}) {
  const client = useClient({apiVersion: getWorkflowsApiVersion()})
  const [statuses, setStatuses] = useState<WorkflowStatusEntry[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const query = `*[_id == $id || _id == $draftId][0].statuses`
    const params = {id: documentId, draftId: `drafts.${documentId}`}

    client
      .fetch<WorkflowStatusEntry[] | null>(query, params)
      .then((result) => {
        setStatuses(result ?? undefined)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const subscription = client
      .listen<Record<string, unknown>>(`*[_id == $id || _id == $draftId]`, params, {
        includeResult: true,
      })
      .subscribe((update) => {
        if (update.type === 'mutation' && update.result) {
          setStatuses((update.result.statuses as WorkflowStatusEntry[]) ?? undefined)
        }
      })

    return () => subscription.unsubscribe()
  }, [client, documentId])

  const sortedStatuses = useMemo(
    () =>
      statuses
        ? [...statuses].sort(
            (left, right) =>
              new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
          )
        : [],
    [statuses],
  )

  const currentStatus = sortedStatuses[0]

  return (
    <Stack
      space={0}
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Card padding={4} borderBottom tone="neutral">
        <Flex align="center" justify="center" direction="column" gap={3}>
          <Flex align="center" gap={2}>
            <Heading size={2}>
              <ClipboardIcon />
            </Heading>
            <Heading size={2}>Audit Trail</Heading>
          </Flex>
          {currentStatus ? (
            <Badge tone="primary" fontSize={1} padding={2}>
              {currentStatus.statusLabel}
            </Badge>
          ) : null}
        </Flex>
      </Card>

      <Box
        padding={3}
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {loading ? (
          <Flex align="center" justify="center" padding={4}>
            <Spinner muted />
          </Flex>
        ) : sortedStatuses.length === 0 ? (
          <Card padding={4} radius={2} tone="transparent">
            <Flex align="center" justify="center">
              <Text muted>No status changes recorded</Text>
            </Flex>
          </Card>
        ) : (
          <Stack space={3}>
            {sortedStatuses.map((entry) => (
              <AuditEntry key={entry._key} entry={entry} />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
