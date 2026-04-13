import {useMemo} from 'react'
import type {ArrayOfObjectsInputProps, ArrayOfObjectsMember} from 'sanity'

import type {SetStatusValue} from './types'

export function SetStatusArrayInput(props: ArrayOfObjectsInputProps) {
  const {renderDefault} = props

  const sortedStatusKeys = useMemo(() => {
    const value = props.value as Array<SetStatusValue>
    if (!Array.isArray(value) || value.length === 0) {
      return []
    }

    return [...value]
      .sort((left, right) => {
        const leftDate = new Date(left.completedAt || '')
        const rightDate = new Date(right.completedAt || '')
        return rightDate.getTime() - leftDate.getTime()
      })
      .map((status) => status._key)
  }, [props.value])

  const members = props.members || []
  const membersByKey = members.reduce(
    (acc, member) => {
      acc[member.key] = member
      return acc
    },
    {} as Record<string, ArrayOfObjectsMember>,
  )

  const sortedMembers = sortedStatusKeys
    .filter(Boolean)
    .map((key) => membersByKey[key]) as ArrayOfObjectsMember[]

  return <div>{renderDefault({...props, members: sortedMembers || []})}</div>
}
