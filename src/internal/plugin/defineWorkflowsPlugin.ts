import {definePlugin, type SchemaTypeDefinition} from 'sanity'

import {workflowAuditTrailActionResolver} from '../actions/workflowAuditTrailAction'
import {createWorkflowAuditInspector} from '../audit/createWorkflowAuditInspector'
import {workflowDefinitionType} from '../schema/documents/workflowDefinitionType'
import {assignmentObject} from '../schema/objects/assignmentObject'
import {lucideIconType} from '../schema/objects/lucideIconType'
import {setStatusObject} from '../schema/objects/setStatusObject'
import {generateTaskTemplateObject} from '../schema/objects/taskTemplateObject'
import {userObject} from '../schema/objects/userObject'
import {generateWorkflowOffRampObject} from '../schema/objects/workflowOffRampObject'
import {workflowRoleObject} from '../schema/objects/workflowRoleObject'
import {generateWorkflowStageObject} from '../schema/objects/workflowStageObject'
import {withWorkflow} from '../schema/withWorkflow'
import {configureWorkflowsApiVersion} from './constants'

/** @public */
export interface WorkflowsPluginOptions {
  actions?: boolean
  apiVersion?: string
  injectAssignments?: boolean
  inspector?: boolean
  schemaTypes?: SchemaTypeDefinition[]
}

function getDefaultWorkflowSchemaTypes(): SchemaTypeDefinition[] {
  return [
    userObject,
    lucideIconType,
    setStatusObject,
    workflowRoleObject,
    generateTaskTemplateObject({}),
    generateWorkflowStageObject({}),
    generateWorkflowOffRampObject({}),
    assignmentObject,
    workflowDefinitionType,
  ]
}

function mergeWorkflowSchemaTypes(
  prev: SchemaTypeDefinition[],
  overrides: SchemaTypeDefinition[] = [],
  options: {injectAssignments?: boolean} = {},
): SchemaTypeDefinition[] {
  const byName = new Map<string, SchemaTypeDefinition>()

  for (const schemaType of [...getDefaultWorkflowSchemaTypes(), ...overrides, ...prev]) {
    byName.set(schemaType.name, schemaType)
  }

  return withWorkflow({injectAssignments: options.injectAssignments})(Array.from(byName.values()))
}

/** @public */
export const workflowsPlugin = definePlugin<void | WorkflowsPluginOptions>((config) => {
  const resolvedConfig: WorkflowsPluginOptions = config ?? {}
  configureWorkflowsApiVersion(resolvedConfig.apiVersion)

  const actionsEnabled = resolvedConfig.actions !== false
  const inspectorEnabled = resolvedConfig.inspector !== false

  return {
    name: 'sanity-plugin-workflows',
    schema: {
      types: (prev) =>
        mergeWorkflowSchemaTypes(prev, resolvedConfig.schemaTypes, {
          injectAssignments: resolvedConfig.injectAssignments,
        }),
    },
    ...(actionsEnabled || inspectorEnabled
      ? {
          document: {
            ...(actionsEnabled ? {actions: workflowAuditTrailActionResolver} : {}),
            ...(inspectorEnabled
              ? {
                  inspectors: (prev) => [createWorkflowAuditInspector(), ...prev],
                }
              : {}),
          },
        }
      : {}),
  }
})
