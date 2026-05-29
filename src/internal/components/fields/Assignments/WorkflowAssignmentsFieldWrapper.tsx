import {useEffect, useRef} from 'react'
import {type ArrayFieldProps, useFormValue} from 'sanity'

import {useHasWorkflow} from '../../../audit/useHasWorkflow'

export function WorkflowAssignmentsFieldWrapper(props: ArrayFieldProps) {
  const {renderDefault} = props
  const wrapperRef = useRef<HTMLDivElement>(null)
  const documentType = useFormValue(['_type']) as string | undefined
  const hasWorkflow = useHasWorkflow(documentType ?? '')
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
