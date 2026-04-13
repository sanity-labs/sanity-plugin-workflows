import {Table2} from 'lucide-react'
import {defineArrayMember, defineField, defineType} from 'sanity'

import type {WorkflowListOption} from '../../utils'

/** @public */
export const generateTableViewType = ({
  contentTypeOptions,
}: {
  contentTypeOptions: WorkflowListOption[]
}) =>
  defineType({
    name: 'tableView',
    title: 'Table View',
    type: 'object',
    icon: Table2,
    preview: {
      prepare({columns, description, isDefault, name}) {
        return {
          title: name,
          subtitle: `${columns?.length || 0} columns${isDefault ? ' (Default)' : ''}${description ? ` • ${description}` : ''}`,
        }
      },
      select: {
        columns: 'columns',
        description: 'description',
        isDefault: 'isDefault',
        name: 'name',
      },
    },
    fields: [
      defineField({
        name: 'contentType',
        title: 'Content Type',
        type: 'string',
        options: {
          list: contentTypeOptions,
        },
      }),
      defineField({
        name: 'name',
        title: 'View Name',
        type: 'string',
        validation: (rule) =>
          rule
            .required()
            .error('View name is required')
            .custom((name, context) => {
              const document = context.document as {tableViews?: Array<{name?: string}>} | undefined
              const tableViews = document?.tableViews || []
              if (!Array.isArray(tableViews) || !name) return true

              const namesCount = tableViews.filter((view) => view?.name === name).length
              if (namesCount > 1) {
                return 'View names must be unique within a parent document'
              }

              return true
            }),
      }),
      defineField({
        name: 'description',
        title: 'Description',
        type: 'text',
        rows: 2,
      }),
      defineField({
        name: 'isDefault',
        title: 'Default View',
        type: 'boolean',
        initialValue: false,
      }),
      defineField({
        name: 'columns',
        title: 'Columns',
        type: 'array',
        of: [defineArrayMember({type: 'tableViewColumn'})],
        validation: (rule) =>
          rule
            .min(1)
            .error('At least one column is required')
            .custom((columns) => {
              if (!Array.isArray(columns)) return true

              const fields = columns
                .map((column) => (column as {field?: string})?.field)
                .filter((field): field is string => Boolean(field))
              const uniqueFields = new Set(fields)

              if (fields.length !== uniqueFields.size) {
                return 'Duplicate columns are not allowed'
              }

              return true
            }),
      }),
    ],
  })
