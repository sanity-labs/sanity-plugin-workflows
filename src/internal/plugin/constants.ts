export const DEFAULT_WORKFLOWS_API_VERSION = '2026-04-12'

let workflowsApiVersion = DEFAULT_WORKFLOWS_API_VERSION

export function configureWorkflowsApiVersion(apiVersion?: string) {
  workflowsApiVersion = apiVersion || DEFAULT_WORKFLOWS_API_VERSION
}

export function getWorkflowsApiVersion(): string {
  return workflowsApiVersion
}
