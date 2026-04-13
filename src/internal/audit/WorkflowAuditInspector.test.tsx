import {screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {renderWithProviders} from '../../../../shared/studio/__tests__/fixtures/testProviders'
import {WorkflowAuditInspector} from './WorkflowAuditInspector'

const mockFetch = vi.fn()
const mockListen = vi.fn()
const mockUnsubscribe = vi.fn()
const mockUseWorkflowProjectUsers = vi.fn()

vi.mock('sanity', async () => {
  const actual = await vi.importActual<typeof import('sanity')>('sanity')

  return {
    ...actual,
    useClient: vi.fn(() => ({
      fetch: mockFetch,
      listen: mockListen,
    })),
  }
})

vi.mock('sanity-workflow-kit/studio', () => ({
  useWorkflowProjectUsers: (client: unknown) => mockUseWorkflowProjectUsers(client),
}))

const makeEntry = (overrides: Record<string, unknown> = {}) => ({
  _key: 'entry-1',
  completedAt: '2026-03-20T10:00:00Z',
  completedBy: {
    userId: 'sanity-user-1',
  },
  statusLabel: 'Draft',
  statusSlug: 'draft',
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockListen.mockReturnValue({
    subscribe: vi.fn(() => ({
      unsubscribe: mockUnsubscribe,
    })),
  })
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
})

describe('WorkflowAuditInspector', () => {
  it('renders history-style audit cards with resolved actors and UTC timestamps', async () => {
    mockFetch.mockResolvedValue([makeEntry({reason: 'Missing sources'})])

    renderWithProviders(<WorkflowAuditInspector documentId="doc-1" documentType="article" />)

    await waitFor(() => {
      expect(screen.getByText('Audit Trail')).toBeDefined()
      expect(screen.getByText('Moved to Draft')).toBeDefined()
      expect(screen.getByText('2026-03-20 10:00:00 UTC')).toBeDefined()
      expect(screen.getByTitle('Jane Editor')).toBeDefined()
    })

    expect(screen.queryByText('Missing sources')).toBeNull()
    expect(screen.queryByText('Draft')).toBeNull()
  })
})
