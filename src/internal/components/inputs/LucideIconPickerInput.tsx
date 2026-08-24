import {TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import * as LucideIcons from 'lucide-react'
import {useCallback, useId, useMemo, useState, type ComponentType, type SVGProps} from 'react'
import {set, unset, type StringInputProps} from 'sanity'

type LucideComponent = ComponentType<SVGProps<SVGSVGElement>>

interface LucideOption {
  icon: LucideComponent
  label: string
  searchTerms: string
  value: string
}

function pascalToKebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function isLucideComponent(value: unknown): value is LucideComponent {
  if ((typeof value !== 'function' && typeof value !== 'object') || value === null) return false
  return '$$typeof' in value || 'render' in value
}

const EXCLUDED_EXPORTS = new Set([
  'createLucideIcon',
  'default',
  'DynamicIcon',
  'dynamicIconImports',
  'Icon',
  'icons',
])

const LUCIDE_OPTIONS: LucideOption[] = Object.keys(LucideIcons)
  .filter((name) => {
    if (EXCLUDED_EXPORTS.has(name) || name.startsWith('Lucide') || name.endsWith('Icon'))
      return false
    return isLucideComponent(LucideIcons[name as keyof typeof LucideIcons])
  })
  .map((name) => {
    const value = pascalToKebab(name)
    return {
      icon: LucideIcons[name as keyof typeof LucideIcons] as LucideComponent,
      label: value,
      searchTerms: `${name} ${value} ${value.replaceAll('-', ' ')}`.toLowerCase(),
      value,
    }
  })
  .sort((left, right) => left.label.localeCompare(right.label))

export function LucideIconPickerInput(props: StringInputProps) {
  const {onChange, readOnly, schemaType, value} = props
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const allowedIcons = (schemaType.options as {allowedIcons?: string[]} | undefined)?.allowedIcons

  const availableOptions = useMemo(() => {
    const allowed = allowedIcons?.length ? new Set(allowedIcons) : null
    return allowed ? LUCIDE_OPTIONS.filter((option) => allowed.has(option.value)) : LUCIDE_OPTIONS
  }, [allowedIcons])

  const selectedOption = useMemo(
    () => availableOptions.find((option) => option.value === value),
    [availableOptions, value],
  )

  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return availableOptions.slice(0, 80)
    return availableOptions
      .filter((option) => option.searchTerms.includes(normalizedQuery))
      .slice(0, 100)
  }, [availableOptions, query])

  const handleChange = useCallback(
    (nextValue: string) => {
      onChange(nextValue ? set(nextValue) : unset())
      setQuery('')
      setIsOpen(false)
    },
    [onChange],
  )

  const handleClear = useCallback(() => {
    onChange(unset())
    setQuery('')
  }, [onChange])

  return (
    <Stack gap={2}>
      {value ? (
        <Card border padding={2} radius={2} tone={selectedOption ? 'default' : 'caution'}>
          <Flex align="center" gap={2} justify="space-between">
            <Flex align="center" gap={2}>
              <Box>
                {selectedOption
                  ? (() => {
                      const SelectedIcon = selectedOption.icon
                      return <SelectedIcon aria-hidden="true" height={16} width={16} />
                    })()
                  : null}
              </Box>
              <Text size={1} weight="medium">
                {selectedOption?.label ?? `${value} (not found)`}
              </Text>
            </Flex>
            {!readOnly ? (
              <Button
                aria-label="Clear icon"
                icon={TrashIcon}
                mode="bleed"
                onClick={handleClear}
                padding={2}
                tone="critical"
                type="button"
              />
            ) : null}
          </Flex>
        </Card>
      ) : null}

      {!readOnly ? (
        <TextInput
          id={`workflow-lucide-icon-${inputId}`}
          aria-label="Search for a Lucide icon"
          name="workflow-lucide-icon-search"
          onBlur={() => setIsOpen(false)}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={value ? 'Replace icon…' : 'Search for an icon…'}
          value={query}
        />
      ) : null}

      {!readOnly && isOpen ? (
        <Card
          border
          padding={1}
          radius={2}
          style={{maxHeight: 280, overflowY: 'auto'}}
          tone="default"
        >
          <Stack gap={1}>
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    mode="bleed"
                    onClick={() => handleChange(option.value)}
                    onMouseDown={(event) => event.preventDefault()}
                    padding={2}
                    selected={option.value === value}
                    text={
                      <Flex align="center" gap={2}>
                        <Icon aria-hidden="true" height={16} width={16} />
                        <Text size={1}>{option.label}</Text>
                      </Flex>
                    }
                    type="button"
                  />
                )
              })
            ) : (
              <Text muted size={1}>
                No matching icons
              </Text>
            )}
          </Stack>
        </Card>
      ) : null}
    </Stack>
  )
}
