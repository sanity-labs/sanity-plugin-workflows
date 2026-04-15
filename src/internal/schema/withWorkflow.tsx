import {
  defineArrayMember,
  defineField,
  type Rule,
  type SchemaTypeDefinition,
  type ValidationContext,
} from 'sanity'
import {StatusPathInput, type StatusPathOptions} from 'sanity-workflow-kit/studio'

import {WorkflowStatusFieldWrapper} from '../components/fields/SetStatus/WorkflowStatusFieldWrapper'
import {getWorkflowsApiVersion} from '../plugin/constants'

const DEFAULT_EXCLUDE = [
  'globalPopupModal',
  'globalSeo',
  'locale',
  'footer',
  'navbar',
  'tableView',
  'tableViewColumn',
  'workflowDefinition',
  'workflowsConfig',
]

/** @public */
export type SchemaDecorator = (types: SchemaTypeDefinition[]) => SchemaTypeDefinition[]

interface WithWorkflowOptions {
  exclude?: string[]
}

type DocumentSchemaType = Extract<SchemaTypeDefinition, {type: 'document'}> & {
  fields?: Array<{name: string; [key: string]: unknown}>
  groups?: Array<{name: string; [key: string]: unknown}>
  validation?: (rule: Rule) => Rule | Rule[]
}

/** @public */
export function withWorkflow(options: WithWorkflowOptions = {}): SchemaDecorator {
  const excludeSet = new Set([...DEFAULT_EXCLUDE, ...(options.exclude || [])])

  return (schemaTypes: SchemaTypeDefinition[]): SchemaTypeDefinition[] =>
    schemaTypes.map((schemaType) => {
      if (schemaType.type !== 'document') {
        return schemaType
      }

      const documentType = schemaType as DocumentSchemaType
      if (excludeSet.has(documentType.name)) {
        return schemaType
      }

      const existingFields = documentType.fields || []
      const existingGroups = documentType.groups || []
      const hasStatus = existingFields.some((field) => field.name === 'status')
      const hasStatuses = existingFields.some((field) => field.name === 'statuses')

      if (hasStatus || hasStatuses) {
        return schemaType
      }

      const defaultGroup =
        (existingGroups as Array<{default?: boolean; name: string}>).find((group) => group.default)
          ?.name ?? existingGroups[0]?.name

      const statusField = defineField({
        name: 'status',
        type: 'string',
        initialValue: 'draft',
        ...(defaultGroup ? {group: defaultGroup} : {}),
        options: {
          workflowDocumentType: documentType.name,
        } as StatusPathOptions,
        components: {
          field: WorkflowStatusFieldWrapper,
          input: StatusPathInput,
        },
      })

      const statusesField = defineField({
        name: 'statuses',
        title: 'Status History',
        type: 'array',
        of: [defineArrayMember({type: 'setStatus'})],
        options: {sortable: false},
        readOnly: true,
        hidden: true,
      })

      const pendingReasonField = defineField({
        name: 'pendingTransitionReason',
        type: 'text',
        hidden: true,
      })

      const publishGatingRule = (
        rule: Parameters<NonNullable<DocumentSchemaType['validation']>>[0],
      ) =>
        rule.custom(async (_value: unknown, context: ValidationContext) => {
          const {document, getClient} = context
          if (!document) return true

          const currentStatus = document.status as string | undefined
          if (!currentStatus) return true

          const client = getClient({apiVersion: getWorkflowsApiVersion()})
          const workflowDefinition = await client.fetch(
            `*[_type == "workflowDefinition" && documentType == $docType][0]{
              stages[]{ "statusSlug": slug.current, enablePublishing },
              offRamps[]{ "statusSlug": slug.current, enablePublishing }
            }`,
            {docType: document._type},
          )

          if (!workflowDefinition) return true

          const allStages = [
            ...(workflowDefinition.stages || []),
            ...(workflowDefinition.offRamps || []),
          ]
          const currentStage = allStages.find(
            (stage: {statusSlug: string}) => stage.statusSlug === currentStatus,
          )

          if (!currentStage) return true
          if (currentStage.enablePublishing) return true

          const firstPublishable = (workflowDefinition.stages || []).find(
            (stage: {enablePublishing: boolean; statusSlug: string}) => stage.enablePublishing,
          )
          return `Cannot publish - document must reach "${firstPublishable?.statusSlug || 'an approved stage'}" stage first.`
        })

      const existingValidation = documentType.validation
      const composedValidation = existingValidation
        ? (rule: Parameters<NonNullable<DocumentSchemaType['validation']>>[0]) => {
            const existing = existingValidation(rule)
            const gating = publishGatingRule(rule)
            return Array.isArray(existing) ? [...existing, gating] : [existing, gating]
          }
        : publishGatingRule

      return {
        ...documentType,
        groups: [...existingGroups],
        validation: composedValidation,
        fields: [statusField, ...existingFields, statusesField, pendingReasonField],
      } as SchemaTypeDefinition
    })
}
