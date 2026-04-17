import type {SchemaTypeDefinition} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

vi.mock('sanity', () => ({
  defineArrayMember: (spec: unknown) => spec,
  defineField: (spec: unknown) => spec,
}))

vi.mock('@sanity-labs/workflow-kit/studio', () => ({
  StatusPathInput: () => null,
}))

vi.mock('../components/fields/SetStatus/WorkflowStatusFieldWrapper', () => ({
  WorkflowStatusFieldWrapper: () => null,
}))

import {withWorkflow} from './withWorkflow'

type AnyField = {name: string; [key: string]: unknown}

function makeDocument(
  name: string,
  fields: SchemaTypeDefinition[] | AnyField[] = [],
): SchemaTypeDefinition {
  return {
    name,
    type: 'document',
    fields: fields as SchemaTypeDefinition[],
  } as SchemaTypeDefinition
}

function fieldNames(schemaType: SchemaTypeDefinition): string[] {
  const fields = (schemaType as {fields?: AnyField[]}).fields
  return (fields || []).map((field) => field.name)
}

describe('withWorkflow', () => {
  it('injects an assignments array right after status for plain document types', () => {
    const article = makeDocument('article', [
      {name: 'title', type: 'string'},
      {name: 'body', type: 'array'},
    ])

    const [decorated] = withWorkflow()([article])

    expect(fieldNames(decorated)).toEqual([
      'status',
      'assignments',
      'title',
      'body',
      'statuses',
      'pendingTransitionReason',
    ])
  })

  it('leaves a document that already declares its own assignments field alone for that field', () => {
    const existingAssignments = {
      name: 'assignments',
      title: 'Team',
      type: 'array',
    } as AnyField

    const article = makeDocument('article', [{name: 'title', type: 'string'}, existingAssignments])

    const [decorated] = withWorkflow()([article])

    const decoratedFields = (decorated as {fields?: AnyField[]}).fields ?? []
    const injectedAssignments = decoratedFields.filter((field) => field.name === 'assignments')
    expect(injectedAssignments).toHaveLength(1)
    expect(injectedAssignments[0]).toBe(existingAssignments)
    expect(fieldNames(decorated)).toEqual([
      'status',
      'title',
      'assignments',
      'statuses',
      'pendingTransitionReason',
    ])
  })

  it('suppresses the assignments injection when injectAssignments is false', () => {
    const article = makeDocument('article', [{name: 'title', type: 'string'}])

    const [decorated] = withWorkflow({injectAssignments: false})([article])

    const names = fieldNames(decorated)
    expect(names).toContain('status')
    expect(names).toContain('statuses')
    expect(names).not.toContain('assignments')
  })

  it('does not inject into excluded document types (default or custom)', () => {
    const workflowDefinition = makeDocument('workflowDefinition', [{name: 'title', type: 'string'}])
    const siteSettings = makeDocument('siteSettings', [{name: 'title', type: 'string'}])

    const decoratedTypes = withWorkflow({exclude: ['siteSettings']})([
      workflowDefinition,
      siteSettings,
    ])

    for (const decorated of decoratedTypes) {
      expect(fieldNames(decorated)).not.toContain('status')
      expect(fieldNames(decorated)).not.toContain('assignments')
    }
  })

  it('short-circuits the whole decorator when the document already declares status', () => {
    const storyAdaptation = makeDocument('storyAdaptation', [
      {name: 'title', type: 'string'},
      {name: 'status', type: 'string'},
    ])

    const [decorated] = withWorkflow()([storyAdaptation])

    expect(fieldNames(decorated)).toEqual(['title', 'status'])
  })
})
