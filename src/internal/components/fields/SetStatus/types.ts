import type {User} from 'sanity'

export type SetStatusValue = {
  _key: string
  completedAt: string
  completedBy: User
  statusIcon?: string
  statusLabel: string
  statusSlug: string
}
