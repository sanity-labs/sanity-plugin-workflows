import {Select, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import type {StringInputProps, TitledListValue} from 'sanity'
import {set, unset, useFormValue} from 'sanity'

interface WorkflowRole {
  _type: 'workflowRole'
  label?: string
  slug?: {_type: 'slug'; current?: string}
}

export function WorkflowRoleSelectInput(props: StringInputProps) {
  const {onChange, readOnly, schemaType, value} = props
  const staticList = schemaType.options?.list as Array<string | TitledListValue<string>> | undefined
  const roles = useFormValue(['roles']) as WorkflowRole[] | undefined

  const options = useMemo(() => {
    if (roles && roles.length > 0) {
      return roles
        .filter((role) => role.label && role.slug?.current)
        .map((role) => ({label: role.label!, value: role.slug!.current!}))
    }

    if (staticList) {
      return staticList
        .map((item) =>
          typeof item === 'string'
            ? {label: item, value: item}
            : {label: item.title, value: item.value ?? ''},
        )
        .filter((item) => item.value)
    }

    return []
  }, [roles, staticList])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.currentTarget.value
      onChange(nextValue ? set(nextValue) : unset())
    },
    [onChange],
  )

  if (options.length === 0) {
    return (
      <Stack space={2}>
        <Text size={1} muted>
          Add roles to this workflow definition first.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack space={2}>
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
