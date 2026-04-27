import {defineType} from 'sanity'

/** @public */
export const lucideIconType = defineType({
  name: 'lucide-icon',
  title: 'Lucide Icon',
  type: 'string',
  description: 'Lucide icon name stored in kebab-case, e.g. "check-circle-2".',
})
