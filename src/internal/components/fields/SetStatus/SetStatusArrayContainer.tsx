import {Text} from '@sanity/ui'
import {useEffect, useMemo, useRef} from 'react'
import {type ArrayFieldProps, useFormValue} from 'sanity'

import {useHasWorkflow} from '../../../audit/useHasWorkflow'
import type {SetStatusValue} from './types'

export function SetStatusArrayContainer(props: ArrayFieldProps) {
  const {renderDefault, value} = props
  const wrapperRef = useRef<HTMLDivElement>(null)
  const documentType = useFormValue(['_type']) as string | undefined
  const hasWorkflow = useHasWorkflow(documentType ?? '')
  const entries = value as Array<SetStatusValue> | undefined
  const hasEntries = Array.isArray(entries) && entries.length > 0
  const shouldShow = hasWorkflow !== false && hasEntries

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

  useEffect(() => {
    if (!wrapperRef.current) return

    const fieldWrapper = wrapperRef.current.parentElement
    if (fieldWrapper instanceof HTMLElement) {
      fieldWrapper.style.display = shouldShow ? '' : 'none'
    }
  }, [shouldShow])

  return (
    <div ref={wrapperRef}>
      {shouldShow ? (
        <div>
          {mostRecentStatus ? (
            <Text style={{fontWeight: 'bold', marginBottom: '0.5rem', marginTop: '1rem'}}>
              Current Status: {mostRecentStatus}
            </Text>
          ) : null}
          {renderDefault(props)}
        </div>
      ) : null}
    </div>
  )
}
