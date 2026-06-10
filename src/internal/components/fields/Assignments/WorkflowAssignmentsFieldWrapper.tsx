import {Activity} from 'react'
import {type ArrayFieldProps, useFormValue} from 'sanity'

import {useHasWorkflow} from '../../../audit/useHasWorkflow'

export function WorkflowAssignmentsFieldWrapper(props: ArrayFieldProps) {
  const {renderDefault} = props
  const documentType = useFormValue(['_type']) as string | undefined
  const hasWorkflow = useHasWorkflow(documentType ?? '')

  return <Activity mode={hasWorkflow ? 'visible' : 'hidden'}>{renderDefault(props)}</Activity>
}
