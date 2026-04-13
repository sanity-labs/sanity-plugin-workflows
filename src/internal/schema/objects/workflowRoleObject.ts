import {Users} from 'lucide-react'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {sanitySlugify} from '../utils'

/** @public */
export const workflowRoleObject = defineType({
  name: 'workflowRole',
  title: 'Workflow Role',
  type: 'object',
  icon: Users,
  preview: {
    prepare({label, projectRoles}) {
      const roleCount = Array.isArray(projectRoles) ? projectRoles.length : 0
      return {
        title: label || 'Untitled Role',
        subtitle:
          roleCount > 0
            ? `Maps to ${roleCount} project role${roleCount === 1 ? '' : 's'}`
            : 'No project role mapping',
      }
    },
    select: {
      label: 'label',
      projectRoles: 'projectRoles',
    },
  },
  fields: [
    defineField({
      name: 'label',
      type: 'string',
      description: 'Display name for this role.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Unique identifier used in assignments and task templates.',
      validation: (rule) => rule.required(),
      options: {
        slugify: sanitySlugify,
        source: (_document, context) =>
          ((context.parent as Record<string, unknown>)?.label as string) || '',
      },
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'projectRoles',
      title: 'Sanity Project Roles',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
  ],
})
