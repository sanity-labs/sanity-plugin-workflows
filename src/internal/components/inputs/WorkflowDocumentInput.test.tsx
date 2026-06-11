import {isValidElement} from 'react'
import type {ObjectInputProps} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

const mockUseHasWorkflow = vi.fn()

vi.mock('../../audit/useHasWorkflow', () => ({
  useHasWorkflow: (documentType: string) => mockUseHasWorkflow(documentType),
}))

import {createWorkflowDocumentInput} from './WorkflowDocumentInput'

type AnyMember = {kind: string; name?: string}

function makeProps(members: AnyMember[]) {
  const renderDefault = vi.fn((renderProps: ObjectInputProps) => renderProps)
  const props = {
    schemaType: {name: 'article'},
    members,
    renderDefault,
  } as unknown as ObjectInputProps
  return {props, renderDefault}
}

const members: AnyMember[] = [
  {kind: 'field', name: 'status'},
  {kind: 'field', name: 'assignments'},
  {kind: 'field', name: 'title'},
  {kind: 'error', name: 'status'},
]

describe('createWorkflowDocumentInput', () => {
  it('passes all members through when the document type has a workflow', () => {
    mockUseHasWorkflow.mockReturnValue(true)
    const Input = createWorkflowDocumentInput({fieldNames: ['status', 'assignments']})
    const {props, renderDefault} = makeProps(members)

    Input(props)

    expect(mockUseHasWorkflow).toHaveBeenCalledWith('article')
    expect(renderDefault.mock.calls[0][0].members).toEqual(members)
  })

  it('filters the named field members out while the workflow check is loading (null)', () => {
    mockUseHasWorkflow.mockReturnValue(null)
    const Input = createWorkflowDocumentInput({fieldNames: ['status', 'assignments']})
    const {props, renderDefault} = makeProps(members)

    Input(props)

    expect(renderDefault.mock.calls[0][0].members).toEqual([
      {kind: 'field', name: 'title'},
      {kind: 'error', name: 'status'},
    ])
  })

  it('filters the named field members out when no workflow exists (false)', () => {
    mockUseHasWorkflow.mockReturnValue(false)
    const Input = createWorkflowDocumentInput({fieldNames: ['status', 'assignments']})
    const {props, renderDefault} = makeProps(members)

    Input(props)

    expect(renderDefault.mock.calls[0][0].members).toEqual([
      {kind: 'field', name: 'title'},
      {kind: 'error', name: 'status'},
    ])
  })

  it('only filters field members, not equally-named members of other kinds', () => {
    mockUseHasWorkflow.mockReturnValue(false)
    const Input = createWorkflowDocumentInput({fieldNames: ['status']})
    const {props, renderDefault} = makeProps(members)

    Input(props)

    const passed = renderDefault.mock.calls[0][0].members as AnyMember[]
    expect(passed.some((m) => m.kind === 'field' && m.name === 'status')).toBe(false)
    expect(passed.some((m) => m.kind === 'error' && m.name === 'status')).toBe(true)
  })

  it('delegates to a provided existing input component with filtered members', () => {
    mockUseHasWorkflow.mockReturnValue(false)
    const existingInput = vi.fn(() => null)
    const Input = createWorkflowDocumentInput({fieldNames: ['status'], existingInput})
    const {props, renderDefault} = makeProps(members)

    const result = Input(props)

    expect(renderDefault).not.toHaveBeenCalled()
    expect(isValidElement(result)).toBe(true)
    const element = result as React.ReactElement<ObjectInputProps>
    expect(element.type).toBe(existingInput)
    expect(
      (element.props.members as AnyMember[]).some((m) => m.kind === 'field' && m.name === 'status'),
    ).toBe(false)
  })
})
