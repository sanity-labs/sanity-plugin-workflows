import {Settings2} from 'lucide-react'
import {defineArrayMember, defineField, defineType} from 'sanity'

/** @public */
export const workflowsConfigType = defineType({
  name: 'workflowsConfig',
  title: 'Workflows Config',
  type: 'document',
  icon: Settings2,
  preview: {
    prepare() {
      return {
        title: 'Workflows Config',
      }
    },
  },
  fields: [
    defineField({
      name: 'tableViews',
      title: 'Table Views',
      type: 'array',
      of: [defineArrayMember({type: 'tableView'})],
    }),
  ],
})
