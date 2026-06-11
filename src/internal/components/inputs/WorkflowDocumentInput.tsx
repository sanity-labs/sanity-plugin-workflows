import type {ComponentType, FunctionComponent} from 'react'
import type {ObjectInputProps} from 'sanity'

import {useHasWorkflow} from '../../audit/useHasWorkflow'

interface WorkflowDocumentInputOptions {
  fieldNames: string[]
  existingInput?: ComponentType<ObjectInputProps>
}

export function createWorkflowDocumentInput({
  fieldNames,
  existingInput: ExistingInput,
}: WorkflowDocumentInputOptions): FunctionComponent<ObjectInputProps> {
  return function WorkflowDocumentInput(props: ObjectInputProps) {
    const hasWorkflow = useHasWorkflow(props.schemaType.name)

    const members =
      hasWorkflow === true
        ? props.members
        : props.members.filter(
            (member) => !(member.kind === 'field' && fieldNames.includes(member.name)),
          )

    const nextProps = {...props, members}
    return ExistingInput ? <ExistingInput {...nextProps} /> : props.renderDefault(nextProps)
  }
}
