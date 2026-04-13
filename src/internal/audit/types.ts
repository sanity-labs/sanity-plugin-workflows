/** @public */
export interface WorkflowStatusEntry {
  _key: string
  completedAt: string
  completedBy: {
    displayName?: string
    email?: string
    id?: string
    imageUrl?: string
    userId?: string
  }
  reason?: string
  statusIcon?: string
  statusLabel: string
  statusSlug: string
}

/** @public */
export interface WorkflowAuditInspectorConfig {
  icon?: React.ComponentType
  title?: string
}
