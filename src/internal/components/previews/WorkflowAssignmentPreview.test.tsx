import {isValidElement} from 'react'
import {screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {renderWithProviders} from '../../__tests__/testProviders'
import {WorkflowAssignmentPreview} from './WorkflowAssignmentPreview'

const mockUseWorkflowProjectUsers = vi.fn()

vi.mock('sanity', () => ({
  useClient: vi.fn(() => ({})),
}))

vi.mock('@sanity-labs/workflow-kit/studio', () => ({
  useWorkflowProjectUsers: (client: unknown) => mockUseWorkflowProjectUsers(client),
}))

function renderPreview(
  props: Partial<{
    assignmentType: string
    userId: string
  }> = {},
) {
  const previewProps = {
    assignmentType: 'ed-editor',
    renderDefault: (renderProps: {media?: unknown; subtitle?: unknown; title?: unknown}) => (
      <div>
        <div data-testid="title">{String(renderProps.title ?? '')}</div>
        <div data-testid="subtitle">{String(renderProps.subtitle ?? '')}</div>
        <div data-testid="media">
          {isValidElement(renderProps.media) ? renderProps.media : null}
        </div>
      </div>
    ),
    userId: 'project-user-1',
    ...props,
  } as any

  return renderWithProviders(
    <WorkflowAssignmentPreview {...previewProps} />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseWorkflowProjectUsers.mockReturnValue({
    projectUsers: [],
  })
})

describe('WorkflowAssignmentPreview', () => {
  it('resolves project members by project user id and renders their name', () => {
    mockUseWorkflowProjectUsers.mockReturnValue({
      projectUsers: [
        {
          displayName: 'Jane Editor',
          id: 'project-user-1',
          imageUrl: 'https://example.com/avatar.jpg',
          sanityUserId: 'sanity-user-1',
        },
      ],
    })

    renderPreview()

    expect(screen.getByTestId('title').textContent).toBe('Jane Editor')
    expect(screen.getByTestId('subtitle').textContent).toBe('Editor')
    expect(screen.getByTitle('Jane Editor')).toBeDefined()
  })

  it('falls back to the raw assignment details when no project member matches', () => {
    renderPreview({assignmentType: 'ed-fact-checker', userId: 'project-user-9'})

    expect(screen.getByTestId('title').textContent).toBe('Fact Checker: project-user-9')
    expect(screen.getByTestId('subtitle').textContent).toBe('')
  })
})
