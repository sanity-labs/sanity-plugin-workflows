import {ClipboardIcon} from '@sanity/icons'
import {defineDocumentInspector, type DocumentInspector, type DocumentInspectorProps} from 'sanity'

import type {WorkflowAuditInspectorConfig} from './types'
import {useHasWorkflow} from './useHasWorkflow'
import {WorkflowAuditInspector} from './WorkflowAuditInspector'

/** @public */
export function createWorkflowAuditInspector(
  config?: WorkflowAuditInspectorConfig,
): DocumentInspector {
  const CustomIcon = config?.icon ?? ClipboardIcon
  const title = config?.title ?? 'Audit Trail'

  function WorkflowAuditInspectorWrapper(props: DocumentInspectorProps) {
    return (
      <WorkflowAuditInspector documentId={props.documentId} documentType={props.documentType} />
    )
  }

  WorkflowAuditInspectorWrapper.displayName = 'WorkflowAuditInspector'

  return defineDocumentInspector({
    component: WorkflowAuditInspectorWrapper,
    name: 'workflow-audit',
    useMenuItem({documentType}) {
      const hasWorkflow = useHasWorkflow(documentType)

      return {
        hidden: hasWorkflow !== true,
        icon: CustomIcon,
        showAsAction: true,
        title,
      }
    },
  })
}
