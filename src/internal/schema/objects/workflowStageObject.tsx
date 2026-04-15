import * as LucideIcons from 'lucide-react'
import {SignpostBig} from 'lucide-react'
import type {ComponentType} from 'react'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {WorkflowRoleCheckboxInput} from '../../components/inputs/WorkflowRoleInput/WorkflowRoleCheckboxInput'
import type {WorkflowListOption} from '../utils'
import {sanitySlugify} from '../utils'

const kebabToPascal = (value: string): string =>
  value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

/** @public */
export const generateWorkflowStageObject = ({
  notifyUserTypesOptions,
}: {
  notifyUserTypesOptions?: WorkflowListOption[]
}) =>
  defineType({
    name: 'workflowStage',
    title: 'Workflow Stage',
    type: 'object',
    icon: SignpostBig,
    preview: {
      prepare({color, icon, label}) {
        const background = color || '#8B8B8B'
        const IconComponent = icon
          ? (LucideIcons[kebabToPascal(icon) as keyof typeof LucideIcons] as ComponentType<{
              color?: string
              size?: number
            }>)
          : undefined

        return {
          title: label || 'Untitled Stage',
          media: () => (
            <div
              style={{
                alignItems: 'center',
                backgroundColor: background,
                borderRadius: '4px',
                display: 'flex',
                height: '100%',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {IconComponent ? <IconComponent size={18} color="white" /> : null}
            </div>
          ),
        }
      },
      select: {
        color: 'color',
        icon: 'icon',
        label: 'label',
      },
    },
    fields: [
      defineField({
        name: 'label',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'slug',
        type: 'slug',
        validation: (rule) => rule.required(),
        options: {
          slugify: sanitySlugify,
          source: (_document, context) =>
            ((context.parent as Record<string, unknown>)?.label as string) || '',
        },
      }),
      defineField({
        name: 'icon',
        type: 'lucide-icon',
      }),
      defineField({
        name: 'color',
        type: 'string',
        validation: (rule) =>
          rule.regex(/^#[0-9A-Fa-f]{6}$/).error('Must be a valid hex color (e.g. #3B82F6)'),
      }),
      defineField({
        name: 'stageCriteria',
        title: 'Stage Guidance',
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
        name: 'taskTemplates',
        title: 'Stage Tasks',
        type: 'array',
        of: [defineArrayMember({type: 'taskTemplate'})],
      }),
      defineField({
        name: 'enableCompletionGating',
        title: 'Enable Completion Gating',
        type: 'boolean',
        initialValue: false,
      }),
      defineField({
        name: 'gatingOverrideRoles',
        title: 'Gating Override Roles',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
        hidden: ({parent}) => !parent?.enableCompletionGating,
        components: {input: WorkflowRoleCheckboxInput},
      }),
      defineField({
        name: 'enablePublishing',
        title: 'Allow Publishing',
        type: 'boolean',
        initialValue: false,
      }),
      defineField({
        name: 'enableNotifications',
        title: 'Enable Notifications',
        type: 'boolean',
        initialValue: true,
      }),
      defineField({
        name: 'notifyUserTypes',
        title: 'People/Groups to Notify',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
        options: {
          layout: 'grid',
          list: notifyUserTypesOptions,
        },
        hidden: ({parent}) => !parent?.enableNotifications,
        components: {input: WorkflowRoleCheckboxInput},
      }),
    ],
  })
