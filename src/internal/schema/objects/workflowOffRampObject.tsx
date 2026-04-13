import * as LucideIcons from 'lucide-react'
import {RouteOff} from 'lucide-react'
import type {ComponentType} from 'react'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {WorkflowRoleCheckboxInput} from '../../components/inputs/WorkflowRoleInput/WorkflowRoleCheckboxInput'
import type {WorkflowListOption} from '../utils'
import {sanitySlugify} from '../utils'

const TONE_COLORS: Record<string, string> = {
  caution: '#F59E0B',
  critical: '#EF4444',
}

const kebabToPascal = (value: string): string =>
  value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

/** @public */
export const generateWorkflowOffRampObject = ({
  notifyUserTypesOptions,
}: {
  notifyUserTypesOptions?: WorkflowListOption[]
}) =>
  defineType({
    name: 'workflowOffRamp',
    title: 'Workflow Off-Ramp',
    type: 'object',
    icon: RouteOff,
    preview: {
      prepare({icon, label, tone}) {
        const background = TONE_COLORS[tone || ''] || '#6B7280'
        const toneLabel = tone || 'neutral'
        const IconComponent = icon
          ? (LucideIcons[kebabToPascal(icon) as keyof typeof LucideIcons] as ComponentType<{
              color?: string
              size?: number
            }>)
          : undefined

        return {
          title: label || 'Untitled Off-Ramp',
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
          subtitle: toneLabel,
        }
      },
      select: {
        icon: 'icon',
        label: 'label',
        tone: 'tone',
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
        name: 'tone',
        type: 'string',
        options: {
          layout: 'radio',
          list: [
            {title: 'Caution', value: 'caution'},
            {title: 'Critical', value: 'critical'},
          ],
        },
      }),
      defineField({
        name: 'stageCriteria',
        title: 'Off-Ramp Guidance',
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
        name: 'enablePublishing',
        title: 'Allow Publishing',
        type: 'boolean',
        initialValue: false,
      }),
      defineField({
        name: 'unpublishOnEntry',
        title: 'Unpublish on Entry',
        type: 'boolean',
        initialValue: false,
      }),
      defineField({
        name: 'allowedRoles',
        title: 'Allowed Roles',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
        components: {input: WorkflowRoleCheckboxInput},
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
