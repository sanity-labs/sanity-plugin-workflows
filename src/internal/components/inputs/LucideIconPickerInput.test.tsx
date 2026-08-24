import {fireEvent, screen} from '@testing-library/react'
import type {StringInputProps} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {renderWithProviders} from '../../__tests__/testProviders'

vi.mock('sanity', () => ({
  set: (value: unknown) => ({type: 'set', value}),
  unset: () => ({type: 'unset'}),
}))

import {LucideIconPickerInput} from './LucideIconPickerInput'

function createProps(overrides: Partial<StringInputProps> = {}): StringInputProps {
  return {
    changed: false,
    elementProps: {
      id: 'workflow-icon',
      onBlur: vi.fn(),
      onChange: vi.fn(),
      onFocus: vi.fn(),
      ref: {current: null},
    },
    focused: false,
    id: 'workflow-icon',
    level: 0,
    members: [],
    onChange: vi.fn(),
    path: ['icon'],
    presence: [],
    readOnly: false,
    renderDefault: vi.fn(),
    schemaType: {
      jsonType: 'string',
      name: 'workflow.lucideIcon',
      type: {jsonType: 'string', name: 'string'},
    },
    validation: [],
    value: undefined,
    ...overrides,
  } as unknown as StringInputProps
}

describe('LucideIconPickerInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searches for and selects a Lucide icon', () => {
    const onChange = vi.fn()
    renderWithProviders(<LucideIconPickerInput {...createProps({onChange})} />)

    const search = screen.getByRole('textbox', {name: 'Search for a Lucide icon'})
    fireEvent.focus(search)
    fireEvent.change(search, {target: {value: 'alarm clock'}})
    fireEvent.click(screen.getByRole('button', {name: 'alarm-clock'}))

    expect(onChange).toHaveBeenCalledWith({type: 'set', value: 'alarm-clock'})
  })

  it('clears the selected icon', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <LucideIconPickerInput {...createProps({onChange, value: 'alarm-clock'})} />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Clear icon'}))

    expect(onChange).toHaveBeenCalledWith({type: 'unset'})
  })
})
