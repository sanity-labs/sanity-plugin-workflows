import {UserIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/** @public */
export const userObject = defineType({
  name: 'workflow.user',
  title: 'User',
  type: 'object',
  icon: UserIcon,
  preview: {
    select: {
      userId: 'userId',
    },
    prepare({userId}) {
      return {
        title: userId || 'Unknown user',
      }
    },
  },
  fields: [
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
})
