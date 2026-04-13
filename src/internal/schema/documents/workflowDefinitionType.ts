import {Workflow} from 'lucide-react'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {DocumentTypeSelectInput} from '../../components/inputs/DocumentTypeSelectInput'
import {sanitySlugify} from '../utils'

/** @public */
export const workflowDefinitionType = defineType({
  name: 'workflowDefinition',
  title: 'Workflow Definition',
  type: 'document',
  icon: Workflow,
  preview: {
    prepare({documentType, stages, title}) {
      const stageCount = Array.isArray(stages) ? stages.length : 0
      return {
        title: title || 'Untitled Workflow',
        subtitle: [
          documentType || 'No document type',
          `${stageCount} stage${stageCount === 1 ? '' : 's'}`,
        ].join(' · '),
      }
    },
    select: {
      documentType: 'documentType',
      stages: 'stages',
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
      name: 'slug',
      type: 'slug',
      validation: (rule) => rule.required(),
      options: {
        slugify: sanitySlugify,
        source: 'title',
      },
    }),
    defineField({
      name: 'documentType',
      title: 'Document Type',
      type: 'string',
      validation: (rule) => rule.required(),
      components: {
        input: DocumentTypeSelectInput,
      },
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'forwardOnly',
      title: 'Forward Only',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'roles',
      title: 'Workflow Roles',
      type: 'array',
      of: [defineArrayMember({type: 'workflowRole'})],
      validation: (rule) => rule.required().min(1).error('A workflow must have at least 1 role'),
    }),
    defineField({
      name: 'stages',
      title: 'Workflow Stages',
      type: 'array',
      of: [defineArrayMember({type: 'workflowStage'})],
      validation: (rule) => rule.required().min(2).error('A workflow must have at least 2 stages'),
    }),
    defineField({
      name: 'offRamps',
      title: 'Off-Ramps',
      type: 'array',
      of: [defineArrayMember({type: 'workflowOffRamp'})],
    }),
  ],
})
