import {ClipboardList} from 'lucide-react'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {WorkflowRoleSelectInput} from '../../components/inputs/WorkflowRoleInput/WorkflowRoleSelectInput'
import type {WorkflowListOption} from '../utils'

/** @public */
export const generateTaskTemplateObject = ({
  assignmentTypeOptions,
}: {
  assignmentTypeOptions?: WorkflowListOption[]
}) =>
  defineType({
    name: 'workflow.taskTemplate',
    title: 'Task Template',
    type: 'object',
    icon: ClipboardList,
    preview: {
      prepare({assigneeRole, required, title}) {
        const parts = [required ? 'Required' : 'Optional', assigneeRole || 'Unassigned']
        return {
          title: title || 'Untitled Task',
          subtitle: parts.join(' · '),
        }
      },
      select: {
        assigneeRole: 'assigneeRole',
        required: 'required',
        title: 'title',
      },
    },
    fields: [
      defineField({
        name: 'title',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'description',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'block',
            marks: {},
            styles: [{title: 'Normal', value: 'normal'}],
          }),
        ],
      }),
      defineField({
        name: 'assigneeRole',
        title: 'Assignee Role',
        type: 'string',
        options: {
          list: assignmentTypeOptions,
        },
        components: {input: WorkflowRoleSelectInput},
      }),
      defineField({
        name: 'dueInDays',
        title: 'Due In (Days)',
        type: 'number',
        validation: (rule) => rule.min(0).integer(),
      }),
      defineField({
        name: 'required',
        type: 'boolean',
        initialValue: true,
      }),
    ],
  })
