import {UserRound} from 'lucide-react'
import {defineField, defineType} from 'sanity'

import type {WorkflowListOption} from '../../utils'

/** @public */
export const generateAssignmentObject = ({
  assignmentGroupLabel,
  assignmentGroupOptions,
  assignmentTypeOptions,
}: {
  assignmentGroupLabel?: string
  assignmentGroupOptions?: WorkflowListOption[]
  assignmentTypeOptions: WorkflowListOption[]
}) =>
  defineType({
    name: 'assignment',
    title: 'Assignment',
    type: 'object',
    icon: UserRound,
    preview: {
      prepare({assignmentGroup, assignmentType, userId}) {
        const groupLabel = assignmentGroup ? ` (${assignmentGroup})` : ''
        return {
          title: `${assignmentType || 'Assignment'}${groupLabel}: ${userId || 'Unassigned'}`,
        }
      },
      select: {
        assignmentGroup: 'assignmentGroup',
        assignmentType: 'assignmentType',
        userId: 'userId',
      },
    },
    fields: [
      defineField({
        name: 'assignmentType',
        title: 'Assignment',
        type: 'string',
        initialValue: assignmentTypeOptions[0]?.value,
        options: {
          list: assignmentTypeOptions,
        },
      }),
      defineField({
        name: 'userId',
        title: 'Team Member',
        type: 'string',
      }),
      ...(assignmentGroupOptions && assignmentGroupLabel
        ? [
            defineField({
              name: 'assignmentGroup',
              title: assignmentGroupLabel,
              type: 'string',
              options: {
                list: assignmentGroupOptions,
              },
            }),
          ]
        : []),
    ],
  })
