import {Text} from '@sanity/ui'
import {Activity, useMemo} from 'react'
import {type ArrayFieldProps, useFormValue} from 'sanity'

import {useHasWorkflow} from '../../../audit/useHasWorkflow'
import type {SetStatusValue} from './types'

export function SetStatusArrayContainer(props: ArrayFieldProps) {
  const {renderDefault, value} = props
  const documentType = useFormValue(['_type']) as string | undefined
  const hasWorkflow = useHasWorkflow(documentType ?? '')
  const entries = value as Array<SetStatusValue> | undefined
  const hasEntries = Array.isArray(entries) && entries.length > 0
  const shouldShow = hasWorkflow === true && hasEntries

  const mostRecentStatus = useMemo(() => {
    if (!hasEntries || !entries) return null

    let latest: SetStatusValue | null = null

    for (const item of entries) {
      if (!item?.completedAt) continue
      if (!latest || new Date(item.completedAt) > new Date(latest.completedAt || '')) {
        latest = item
      }
    }

    return latest?.statusLabel || null
  }, [entries, hasEntries])

  return (
    <Activity mode={shouldShow ? 'visible' : 'hidden'}>
      <div>
        {mostRecentStatus ? (
          <Text style={{fontWeight: 'bold', marginBottom: '0.5rem', marginTop: '1rem'}}>
            Current Status: {mostRecentStatus}
          </Text>
        ) : null}
        {renderDefault(props)}
      </div>
    </Activity>
  )
}
