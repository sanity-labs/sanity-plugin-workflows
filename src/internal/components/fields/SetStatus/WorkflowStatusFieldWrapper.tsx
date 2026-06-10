import {Activity} from 'react'
import type {StringFieldProps} from 'sanity'

import {useHasWorkflow} from '../../../audit/useHasWorkflow'

export function WorkflowStatusFieldWrapper(props: StringFieldProps) {
  const {renderDefault, schemaType} = props
  const options = schemaType.options as Record<string, unknown> | undefined
  const workflowDocumentType = options?.workflowDocumentType as string | undefined
  const hasWorkflow = useHasWorkflow(workflowDocumentType ?? '')

  return <Activity mode={hasWorkflow ? 'visible' : 'hidden'}>{renderDefault(props)}</Activity>
}
