import {useEffect, useRef} from 'react'
import type {StringFieldProps} from 'sanity'

import {useHasWorkflow} from '../../../audit/useHasWorkflow'

export function WorkflowStatusFieldWrapper(props: StringFieldProps) {
  const {renderDefault, schemaType} = props
  const wrapperRef = useRef<HTMLDivElement>(null)
  const options = schemaType.options as Record<string, unknown> | undefined
  const workflowDocumentType = options?.workflowDocumentType as string | undefined
  const hasWorkflow = useHasWorkflow(workflowDocumentType ?? '')
  const shouldShow = hasWorkflow !== false

  useEffect(() => {
    if (!wrapperRef.current) return

    const fieldWrapper = wrapperRef.current.parentElement
    if (fieldWrapper instanceof HTMLElement) {
      fieldWrapper.style.display = shouldShow ? '' : 'none'
    }
  }, [shouldShow])

  return <div ref={wrapperRef}>{shouldShow ? renderDefault(props) : null}</div>
}
