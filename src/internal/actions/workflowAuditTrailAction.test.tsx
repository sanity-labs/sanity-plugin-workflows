import type {DocumentActionComponent} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@sanity-labs/workflow-kit/react', () => ({
  WorkflowTransitionConfirmDialogContent: () => null,
  WorkflowTransitionGatedDialogContent: () => null,
  WorkflowTransitionOffRampDialogContent: () => null,
}))

vi.mock('@sanity-labs/workflow-kit/studio', () => ({
  buildTaskViewPath: () => null,
  useWorkflowProjectUsers: () => ({aclData: [], loaded: true, projectUsers: []}),
}))

import {workflowAuditTrailActionResolver} from './workflowAuditTrailAction'

function createAction(action?: DocumentActionComponent['action']): DocumentActionComponent {
  const component: DocumentActionComponent = () => null
  component.action = action
  return component
}

describe('workflowAuditTrailActionResolver', () => {
  it('preserves leading custom actions and inserts workflow actions before publish', () => {
    const firstCustom = createAction()
    const secondCustom = createAction()
    const publish = createAction('publish')
    const discardChanges = createAction('discardChanges')

    const resolved = workflowAuditTrailActionResolver(
      [firstCustom, secondCustom, publish, discardChanges],
      {schemaType: 'article'},
    )

    expect(resolved.slice(0, 2)).toEqual([firstCustom, secondCustom])
    expect(resolved.slice(2, 12).map((action) => action.action)).toEqual(
      Array.from({length: 10}, (_, index) => `workflowOffRamp.${index}`),
    )
    expect(resolved[12]?.action).toBe('publish')
    expect(resolved[12]).not.toBe(publish)
    expect(resolved[13]).toBe(discardChanges)
  })
})
