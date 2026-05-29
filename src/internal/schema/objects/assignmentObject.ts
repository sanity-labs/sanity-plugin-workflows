import {UserRound} from 'lucide-react'
import {defineField, defineType} from 'sanity'

import {WorkflowAssignmentTypeInput} from '../../components/inputs/WorkflowAssignmentTypeInput'
import {WorkflowAssignmentPreview} from '../../components/previews/WorkflowAssignmentPreview'

/** @public */
export const assignmentObject = defineType({
  name: 'workflow.assignment',
  title: 'Assignment',
  type: 'object',
  icon: UserRound,
  components: {
    preview: WorkflowAssignmentPreview,
  },
  preview: {
    select: {
      assignmentType: 'assignmentType',
      userId: 'userId',
    },
  },
  fields: [
    defineField({
      name: 'assignmentType',
      title: 'Assignment',
      type: 'string',
      components: {input: WorkflowAssignmentTypeInput},
    }),
    defineField({
      name: 'userId',
      title: 'Team Member',
      type: 'string',
    }),
  ],
})
