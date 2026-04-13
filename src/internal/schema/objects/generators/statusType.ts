import {CheckCircle2} from 'lucide-react'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {SetStatusArrayContainer} from '../../../components/fields/SetStatus/SetStatusArrayContainer'
import {SetStatusArrayInput} from '../../../components/fields/SetStatus/SetStatusArrayInput'
import type {WorkflowListOption} from '../../utils'
import {sanitySlugify} from '../../utils'

/** @public */
export const reusableStatusTrackerField = defineField({
  name: 'statuses',
  title: 'Statuses Tracker',
  type: 'array',
  of: [defineArrayMember({type: 'setStatus'})],
  options: {
    sortable: false,
  },
  components: {
    field: SetStatusArrayContainer,
    input: SetStatusArrayInput,
  },
})

/** @public */
export const generateStatusType = ({
  notifyUserTypesOptions,
}: {
  notifyUserTypesOptions?: WorkflowListOption[]
}) =>
  defineType({
    name: 'status',
    title: 'Lifecycle Status',
    type: 'document',
    icon: CheckCircle2,
    orderings: [
      {
        by: [{direction: 'asc', field: 'label'}],
        name: 'labelAsc',
        title: 'Label',
      },
    ],
    fields: [
      defineField({
        name: 'label',
        title: 'Label',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        validation: (rule) => rule.required(),
        options: {
          slugify: sanitySlugify,
          source: 'label',
        },
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
      }),
      defineField({
        name: 'completionCriteria',
        title: 'Completion Criteria',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'block',
            marks: {},
            styles: [{title: 'Normal', value: 'normal'}],
          }),
        ],
      }),
    ],
  })
