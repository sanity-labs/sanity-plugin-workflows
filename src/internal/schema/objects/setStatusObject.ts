import {CheckCircle2} from 'lucide-react'
import {defineField, defineType} from 'sanity'

/** @public */
export const setStatusObject = defineType({
  name: 'workflow.setStatus',
  title: 'Set Status',
  type: 'object',
  icon: CheckCircle2,
  preview: {
    select: {
      completedAt: 'completedAt',
      reason: 'reason',
      statusLabel: 'statusLabel',
      statusSlug: 'statusSlug',
      userId: 'completedBy.userId',
    },
    prepare({completedAt, reason, statusLabel, statusSlug, userId}) {
      const title = statusLabel || statusSlug || 'Status change'
      const subtitleParts = [
        userId ? `By ${userId}` : null,
        completedAt ? `At ${completedAt}` : null,
      ]

      return {
        title,
        subtitle: subtitleParts.filter(Boolean).join(' · ') || reason || undefined,
      }
    },
  },
  fields: [
    defineField({
      name: 'statusLabel',
      title: 'Status Label',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'statusSlug',
      title: 'Status Slug',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'statusIcon',
      title: 'Status Icon',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'completedAt',
      title: 'Completed At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'completedBy',
      title: 'Completed By',
      type: 'workflow.user',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'reason',
      title: 'Reason',
      type: 'text',
      rows: 2,
      readOnly: true,
    }),
  ],
})
