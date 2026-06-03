import {defineType} from 'sanity'
import {lucideIconType as lucideIconPickerType} from 'sanity-plugin-lucide-icon-picker'

/** @public */
export const lucideIconType = defineType({
  name: 'workflow.lucideIcon',
  title: 'Lucide Icon',
  type: 'string',
  description: 'Lucide icon name stored in kebab-case, e.g. "check-circle-2".',
  components: lucideIconPickerType.components,
})
