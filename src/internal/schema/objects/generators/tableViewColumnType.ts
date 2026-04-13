import {Columns3} from 'lucide-react'
import {defineField, defineType} from 'sanity'

import type {WorkflowListOption} from '../../utils'

/** @public */
export const generateTableViewColumnType = ({tableColumns}: {tableColumns: WorkflowListOption[]}) =>
  defineType({
    name: 'tableViewColumn',
    title: 'Column',
    type: 'object',
    icon: Columns3,
    preview: {
      prepare({displayName, field, pinned}) {
        const fieldLabels = tableColumns.reduce(
          (acc, column) => {
            acc[column.value] = column.title
            return acc
          },
          {} as Record<string, string>,
        )

        const title = displayName || fieldLabels[field as keyof typeof fieldLabels] || field
        const subtitle = pinned && pinned !== 'none' ? `Pinned ${pinned}` : undefined
        return {title, subtitle}
      },
      select: {
        displayName: 'displayName',
        field: 'field',
        pinned: 'pinned',
      },
    },
    fields: [
      defineField({
        name: 'field',
        title: 'Field',
        type: 'string',
        validation: (rule) => rule.required().error('Field is required'),
        options: {
          list: tableColumns,
        },
      }),
      defineField({
        name: 'displayName',
        title: 'Display Name',
        type: 'string',
      }),
      defineField({
        name: 'pinned',
        title: 'Pin Position',
        type: 'string',
        initialValue: 'none',
        options: {
          list: [
            {title: 'None', value: 'none'},
            {title: 'Left', value: 'left'},
            {title: 'Right', value: 'right'},
          ],
          layout: 'radio',
        },
      }),
    ],
  })
