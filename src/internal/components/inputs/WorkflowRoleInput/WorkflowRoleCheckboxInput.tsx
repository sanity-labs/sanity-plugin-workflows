import {Checkbox, Flex, Grid, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import type {ArrayOfPrimitivesInputProps, TitledListValue} from 'sanity'
import {set, unset, useFormValue} from 'sanity'

interface WorkflowRole {
  _type: 'workflow.role'
  label?: string
  slug?: {_type: 'slug'; current?: string}
}

export function WorkflowRoleCheckboxInput(props: ArrayOfPrimitivesInputProps) {
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

  const selectedValues = useMemo(
    () => new Set(Array.isArray(value) ? (value as string[]) : []),
    [value],
  )

  const handleToggle = useCallback(
    (roleValue: string) => {
      const current = Array.isArray(value) ? [...(value as string[])] : []
      const index = current.indexOf(roleValue)

      if (index >= 0) {
        current.splice(index, 1)
      } else {
        current.push(roleValue)
      }

      onChange(current.length > 0 ? set(current) : unset())
    },
    [onChange, value],
  )

  if (options.length === 0) {
    return (
      <Text size={1} muted>
        Add roles to this workflow definition first.
      </Text>
    )
  }

  return (
    <Grid gridTemplateColumns={[2, 3]} gap={2}>
      {options.map((option) => (
        <Flex align="center" gap={2} key={option.value}>
          <Checkbox
            checked={selectedValues.has(option.value)}
            disabled={readOnly}
            onChange={() => handleToggle(option.value)}
          />
          <Text size={1}>{option.label}</Text>
        </Flex>
      ))}
    </Grid>
  )
}
