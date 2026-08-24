import {
  getCachedWorkflowDefinition,
  type WorkflowTransitionRole,
} from '@sanity-labs/workflow-kit/engine'
import {Select, Skeleton, Stack} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import type {StringInputProps} from 'sanity'
import {set, unset, useClient, useFormValue} from 'sanity'

import {getWorkflowsApiVersion} from '../../plugin/constants'

export function WorkflowAssignmentTypeInput(props: StringInputProps) {
  const {onChange, readOnly, value} = props
  const documentValue = useFormValue([]) as {_type?: string} | undefined
  const documentType = documentValue?._type
  const client = useClient({apiVersion: getWorkflowsApiVersion()})
  const [workflowRoles, setWorkflowRoles] = useState<null | WorkflowTransitionRole[]>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!documentType) {
      setWorkflowRoles(null)
      setLoaded(true)
      return
    }

    let cancelled = false
    setLoaded(false)

    void getCachedWorkflowDefinition(client, documentType)
      .then((definition) => {
        if (cancelled) return
        setWorkflowRoles(definition?.roles ?? null)
        setLoaded(true)
      })
      .catch(() => {
        if (cancelled) return
        setWorkflowRoles(null)
        setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [client, documentType])

  const options = useMemo(() => {
    if (!workflowRoles || workflowRoles.length === 0) return []

    return workflowRoles
      .filter((role) => role.label && role.slug)
      .map((role) => ({label: role.label!, value: role.slug!}))
  }, [workflowRoles])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.currentTarget.value
      onChange(nextValue ? set(nextValue) : unset())
    },
    [onChange],
  )

  if (!loaded) {
    return (
      <Stack gap={2}>
        <Skeleton animated radius={1} style={{height: 35}} />
      </Stack>
    )
  }

  if (options.length === 0) {
    return props.renderDefault(props)
  }

  return (
    <Stack gap={2}>
      <Select
        value={value || ''}
        onChange={handleChange}
        readOnly={readOnly}
        disabled={readOnly}
        fontSize={2}
        padding={3}
      >
        <option value="">Select a role…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Stack>
  )
}
