import {fireEvent, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {renderWithProviders} from '../../__tests__/testProviders'
import {WorkflowAssignmentTypeInput} from './WorkflowAssignmentTypeInput'

const mockGetCachedWorkflowDefinition = vi.fn()
const mockUseFormValue = vi.fn()
const mockOnChange = vi.fn()

vi.mock('sanity', () => ({
  useClient: vi.fn(() => ({})),
  useFormValue: (path: unknown) => mockUseFormValue(path),
  set: (value: unknown) => ({type: 'set', value}),
  unset: () => ({type: 'unset'}),
}))

vi.mock('@sanity-labs/workflow-kit/engine', () => ({
  getCachedWorkflowDefinition: (...args: unknown[]) => mockGetCachedWorkflowDefinition(...args),
}))

const renderDefault = vi.fn((renderProps: {value?: unknown}) => (
  <div data-testid="default-input">Default input: {String(renderProps.value ?? 'unset')}</div>
)) as any

function renderInput() {
  const schemaType = {
    name: 'assignmentType',
    type: 'string',
  }

  return renderWithProviders(
    <WorkflowAssignmentTypeInput
      // @ts-expect-error — partial StringInputProps is enough for the component's use of schemaType, onChange, value
      schemaType={schemaType}
      onChange={mockOnChange}
      renderDefault={renderDefault}
      value={undefined}
    />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseFormValue.mockImplementation((path) => {
    if (Array.isArray(path) && path.length === 0) return {_type: 'article'}
    return undefined
  })
})

describe('WorkflowAssignmentTypeInput', () => {
  it('populates options from the fetched workflow definition when roles exist', async () => {
    mockGetCachedWorkflowDefinition.mockResolvedValue({
      roles: [
        {label: 'Reporter', slug: 'reporter'},
        {label: 'Section Editor', slug: 'section_editor'},
      ],
    })

    renderInput()

    await waitFor(() => {
      expect(screen.getByRole('option', {name: 'Reporter'})).toBeDefined()
      expect(screen.getByRole('option', {name: 'Section Editor'})).toBeDefined()
    })
  })

  it('falls back to the default input when the fetched definition has no roles', async () => {
    mockGetCachedWorkflowDefinition.mockResolvedValue(null)

    renderInput()

    await waitFor(() => {
      expect(screen.getByTestId('default-input').textContent).toBe('Default input: unset')
    })
  })

  it('suppresses the combobox and the empty-state hint until the workflow definition resolves', async () => {
    let resolveFetch: (value: unknown) => void = () => {}
    mockGetCachedWorkflowDefinition.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )

    renderInput()

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByTestId('default-input')).toBeNull()

    resolveFetch({roles: [{label: 'Reporter', slug: 'reporter'}]})

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeDefined()
    })
  })

  it('calls onChange with a set patch when the user picks a role', async () => {
    mockGetCachedWorkflowDefinition.mockResolvedValue({
      roles: [{label: 'Reporter', slug: 'reporter'}],
    })

    renderInput()

    const select = await screen.findByRole('combobox')
    fireEvent.change(select, {target: {value: 'reporter'}})

    expect(mockOnChange).toHaveBeenCalledWith({type: 'set', value: 'reporter'})
  })

  it('falls back to the default input when the root document type is unavailable', async () => {
    mockUseFormValue.mockReturnValue(undefined)

    renderInput()

    expect(screen.getByTestId('default-input').textContent).toBe('Default input: unset')
    expect(mockGetCachedWorkflowDefinition).not.toHaveBeenCalled()
  })
})
