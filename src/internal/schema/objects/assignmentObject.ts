import {UserRound} from 'lucide-react'
import {defineField, defineType} from 'sanity'

import {WorkflowAssignmentTypeInput} from '../../components/inputs/WorkflowAssignmentTypeInput'

/** @public */
export const assignmentObject = defineType({
  name: 'assignment',
  title: 'Assignment',
  type: 'object',
  icon: UserRound,
  preview: {
    prepare({assignmentType, userId}) {
      return {
        title: `${assignmentType || 'Assignment'}: ${userId || 'Unassigned'}`,
      }
    },
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
