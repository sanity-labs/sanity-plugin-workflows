import {definePlugin, type SchemaTypeDefinition} from 'sanity'

import {workflowAuditTrailActionResolver} from '../actions/workflowAuditTrailAction'
import {createWorkflowAuditInspector} from '../audit/createWorkflowAuditInspector'
import {workflowDefinitionType} from '../schema/documents/workflowDefinitionType'
import {workflowsConfigType} from '../schema/documents/workflowsConfigType'
import {assignmentObject} from '../schema/objects/assignmentObject'
import {generateTableViewColumnType} from '../schema/objects/generators/tableViewColumnType'
import {generateTableViewType} from '../schema/objects/generators/tableViewType'
import {setStatusObject} from '../schema/objects/setStatusObject'
import {generateTaskTemplateObject} from '../schema/objects/taskTemplateObject'
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
    setStatusObject,
    workflowRoleObject,
    generateTaskTemplateObject({}),
    generateWorkflowStageObject({}),
    generateWorkflowOffRampObject({}),
    generateTableViewColumnType({tableColumns: []}),
    generateTableViewType({contentTypeOptions: []}),
    assignmentObject,
    workflowDefinitionType,
    workflowsConfigType,
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
