import {Card, Select, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import type {StringInputProps} from 'sanity'
import {set, unset, useSchema} from 'sanity'

const SYSTEM_TYPE_PREFIXES = ['sanity.']
const EXCLUDED_TYPES = new Set(['workflow.definition', 'insertMenuPreview'])

export function DocumentTypeSelectInput(props: StringInputProps) {
  const {onChange, readOnly, value} = props
  const schema = useSchema()

  const documentTypes = useMemo(() => {
    const types: Array<{name: string; title: string}> = []

    for (const typeName of schema.getTypeNames()) {
      const schemaType = schema.get(typeName)
      if (!schemaType) continue
      if (schemaType.type?.name !== 'document') continue
      if (SYSTEM_TYPE_PREFIXES.some((prefix) => typeName.startsWith(prefix))) continue
      if (EXCLUDED_TYPES.has(typeName)) continue

      types.push({
        name: typeName,
        title: schemaType.title || typeName,
      })
    }

    return types.sort((left, right) => left.title.localeCompare(right.title))
  }, [schema])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.currentTarget.value
      onChange(nextValue ? set(nextValue) : unset())
    },
    [onChange],
  )

  if (documentTypes.length === 0) {
    return (
      <Card padding={3} radius={2} tone="caution">
        <Text size={1} muted>
          No document types found in the schema.
        </Text>
      </Card>
    )
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
        <option value="">Select a document type…</option>
        {documentTypes.map((type) => (
          <option key={type.name} value={type.name}>
            {type.title} ({type.name})
          </option>
        ))}
      </Select>
    </Stack>
  )
}
