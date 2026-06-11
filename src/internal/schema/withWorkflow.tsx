import {StatusPathInput, type StatusPathOptions} from '@sanity-labs/workflow-kit/studio'
import type {ComponentType} from 'react'
import {
  defineArrayMember,
  defineField,
  type InitialValueResolverContext,
  type ObjectInputProps,
  type Rule,
  type SchemaTypeDefinition,
  type ValidationContext,
} from 'sanity'

import {WorkflowAssignmentsFieldWrapper} from '../components/fields/Assignments/WorkflowAssignmentsFieldWrapper'
import {WorkflowStatusFieldWrapper} from '../components/fields/SetStatus/WorkflowStatusFieldWrapper'
import {createWorkflowDocumentInput} from '../components/inputs/WorkflowDocumentInput'
import {getWorkflowsApiVersion} from '../plugin/constants'

const DEFAULT_EXCLUDE = ['workflow.definition']

/** @public */
export type SchemaDecorator = (types: SchemaTypeDefinition[]) => SchemaTypeDefinition[]

interface WithWorkflowOptions {
  exclude?: string[]
  injectAssignments?: boolean
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

      const resolveInitialStatus = async (
        _params: unknown,
        context: InitialValueResolverContext,
      ) => {
        const client = context.getClient({apiVersion: getWorkflowsApiVersion()})
        const firstStageSlug = await client.fetch<string | null>(
          `*[_type == "workflow.definition" && documentType == $docType][0].stages[0].slug.current`,
          {docType: documentType.name},
        )
        return firstStageSlug ?? undefined
      }

      const statusField = defineField({
        name: 'status',
        type: 'string',
        initialValue: resolveInitialStatus as (
          params: unknown,
          context: InitialValueResolverContext,
        ) => Promise<string>,
        ...(defaultGroup ? {group: defaultGroup} : {}),
        options: {
          workflowDocumentType: documentType.name,
        } as StatusPathOptions,
        components: {
          field: WorkflowStatusFieldWrapper,
          input: StatusPathInput,
        },
      })

      const hasAssignments = existingFields.some((field) => field.name === 'assignments')
      const shouldInjectAssignments = options.injectAssignments !== false && !hasAssignments

      const assignmentsField = shouldInjectAssignments
        ? defineField({
            name: 'assignments',
            title: 'Assignments',
            type: 'array',
            of: [defineArrayMember({type: 'workflow.assignment'})],
            ...(defaultGroup ? {group: defaultGroup} : {}),
            components: {
              field: WorkflowAssignmentsFieldWrapper,
            },
          })
        : null

      const statusesField = defineField({
        name: 'statuses',
        title: 'Status History',
        type: 'array',
        of: [defineArrayMember({type: 'workflow.setStatus'})],
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
            `*[_type == "workflow.definition" && documentType == $docType][0]{
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

      const existingComponents = (
        documentType as {
          components?: {input?: ComponentType<ObjectInputProps>}
        }
      ).components

      return {
        ...documentType,
        groups: [...existingGroups],
        validation: composedValidation,
        components: {
          ...existingComponents,
          input: createWorkflowDocumentInput({
            fieldNames: ['status', ...(assignmentsField ? ['assignments'] : [])],
            existingInput: existingComponents?.input,
          }),
        },
        fields: [
          statusField,
          ...(assignmentsField ? [assignmentsField] : []),
          ...existingFields,
          statusesField,
          pendingReasonField,
        ],
      } as SchemaTypeDefinition
    })
}
