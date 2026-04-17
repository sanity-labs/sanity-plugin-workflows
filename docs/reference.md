# API reference

Full public surface of `@sanity-labs/sanity-plugin-workflows`. For concepts, quickstart, and how-to guides see the [README](../README.md).

The plugin has four entrypoints:

- [`@sanity-labs/sanity-plugin-workflows`](#main-entrypoint) - the plugin itself.
- [`@sanity-labs/sanity-plugin-workflows/schema`](#schema-entrypoint) - the schema decorator, default schema types, object generators, reusable fields, and the `WorkflowListOption` type.
- [`@sanity-labs/sanity-plugin-workflows/actions`](#actions-entrypoint) - document action resolvers and direct factories.
- [`@sanity-labs/sanity-plugin-workflows/audit`](#audit-entrypoint) - the audit inspector and its helpers.

Types used across entrypoints (`WorkflowDefinition`, `WorkflowTransitionStage`, etc.) are re-exported from the underlying [`@sanity-labs/workflow-kit`](https://github.com/sanity-labs/workflow-kit/blob/main/docs/reference.md) package.

---

## Main entrypoint

```ts
import {workflowsPlugin, type WorkflowsPluginOptions} from '@sanity-labs/sanity-plugin-workflows'
```

### `workflowsPlugin(options?)`

Factory returned from `definePlugin<WorkflowsPluginOptions>`. Register it in `plugins: [...]`.

#### `WorkflowsPluginOptions`

| Field               | Type                     | Default        | Purpose                                                                                                                                      |
| ------------------- | ------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`           | `boolean`                | `true`         | When `false`, the plugin does not register `workflowAuditTrailActionResolver`. Mount your own composition via `document.actions`.            |
| `inspector`         | `boolean`                | `true`         | When `false`, the plugin does not register the audit inspector. Mount `createWorkflowAuditInspector()` yourself.                             |
| `injectAssignments` | `boolean`                | `true`         | When `false`, suppresses the auto-injection of the `assignments` array on workflow-aware documents. Documents that declare their own `assignments` field are always left alone regardless of this flag. |
| `apiVersion`        | `string`                 | `'2026-04-12'` | Sanity client API version used by every internal fetch/listen. Stored in a module-level variable via `configureWorkflowsApiVersion`.         |
| `schemaTypes`       | `SchemaTypeDefinition[]` | `[]`           | Overrides or additions to the default workflow schema types. Types are merged by `name` - yours wins over the default with the same name.    |

Behavior:

1. Calls `configureWorkflowsApiVersion(options.apiVersion)`.
2. Merges your `schemaTypes` over the built-in defaults and runs `withWorkflow()` on the whole schema list.
3. If `actions` is enabled, registers `workflowAuditTrailActionResolver` as `document.actions`.
4. If `inspector` is enabled, prepends `createWorkflowAuditInspector()` to `document.inspectors`.

---

## Schema entrypoint

```ts
import {
  withWorkflow,
  workflowDefinitionType,
  workflowsConfigType,
  setStatusObject,
  workflowRoleObject,
  assignmentObject,
  generateWorkflowStageObject,
  generateWorkflowOffRampObject,
  generateTaskTemplateObject,
  generateTableViewType,
  generateTableViewColumnType,
  generateStatusType,
  reusableStatusTrackerField,
  type SchemaDecorator,
  type WorkflowListOption,
} from '@sanity-labs/sanity-plugin-workflows/schema'
```

### `withWorkflow(options?)`

```ts
withWorkflow(options?: {
  exclude?: string[]
  injectAssignments?: boolean
}): SchemaDecorator
```

Decorator that maps over a list of schema types and, for every `type: 'document'` that isn't excluded, injects:

- `status` - `string` field with `initialValue: 'draft'`, `options.workflowDocumentType = documentType.name`, a custom `field` component (`WorkflowStatusFieldWrapper`) and the `StatusPathInput` from `@sanity-labs/workflow-kit/studio`. Placed first in the field list and attached to the document's default group if any.
- `assignments` - array of `assignment` objects, placed immediately after `status`. Visible, joins the same default group as `status`. Skipped when `options.injectAssignments === false` or when the document already declares an `assignments` field.
- `statuses` - hidden, read-only array of `setStatus` objects. The audit trail.
- `pendingTransitionReason` - hidden `text` field used to carry a transition note into side effects.
- A composed `validation` function that calls any existing validator and enforces publish-gating: the document can only be published if its current stage or off-ramp has `enablePublishing: true`.

The decorator skips the whole injection on any document that already declares a `status` or `statuses` field. This is the documented escape hatch for domain lifecycles (see `reusableStatusTrackerField` below). The `assignments` check is separate and only suppresses the `assignments` field specifically — a document that declares its own `assignments` still gets the other injected fields.

Default exclude list (always applied, plus anything you pass in `exclude`):

```
globalPopupModal, globalSeo, locale, footer, navbar,
tableView, tableViewColumn, workflowDefinition, workflowsConfig
```

#### `SchemaDecorator`

```ts
type SchemaDecorator = (types: SchemaTypeDefinition[]) => SchemaTypeDefinition[]
```

### `workflowDefinitionType`

```ts
const workflowDefinitionType: SchemaTypeDefinition
```

`document`, name `workflowDefinition`. Icon: `lucide-react/Workflow`.

Fields:

| Name           | Type                       | Notes                                                                                                            |
| -------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `title`        | `string`                   | Required.                                                                                                        |
| `slug`         | `slug`                     | Required. Source: `title`. Slugified to lowercase with non-alphanumerics collapsed to `-`, max 96 chars.         |
| `documentType` | `string`                   | Required. Rendered with `DocumentTypeSelectInput` - lists the current Studio's document types.                   |
| `description`  | `text` (2 rows)            |                                                                                                                  |
| `forwardOnly`  | `boolean`, initial `false` | When `true`, UIs should disable backwards transitions (plugin convention).                                       |
| `roles`        | `array of workflowRole`    | Required, min 1. Error: "A workflow must have at least 1 role".                                                  |
| `stages`       | `array of workflowStage`   | Required, min 2. Error: "A workflow must have at least 2 stages".                                                |
| `offRamps`     | `array of workflowOffRamp` | Optional.                                                                                                        |

### `workflowsConfigType`

```ts
const workflowsConfigType: SchemaTypeDefinition
```

`document`, name `workflowsConfig`. Icon: `lucide-react/Settings2`. One field:

- `tableViews` - `array of tableView`.

### `setStatusObject`

```ts
const setStatusObject: SchemaTypeDefinition
```

`object`, name `setStatus`. Icon: `lucide-react/CheckCircle2`. One `setStatus` is appended to `statuses` per transition.

Fields: `statusLabel` (required, read-only), `statusSlug` (required, read-only), `statusIcon` (read-only), `completedAt` (datetime, required, read-only, defaults to now), `completedBy` (`user`, required), `reason` (text, read-only).

### `workflowRoleObject`

```ts
const workflowRoleObject: SchemaTypeDefinition
```

`object`, name `workflowRole`. Icon: `lucide-react/Users`.

Fields: `label` (required), `slug` (required, sourced from `label`), `description` (text), `projectRoles` (array of `string` - Sanity project role names that count as this role).

### Generators

Each generator returns a `SchemaTypeDefinition` built with `defineType`. The schema type `name` is fixed - generators exist so you can inject Studio-specific option lists without forking the type.

#### `generateWorkflowStageObject(options)`

```ts
generateWorkflowStageObject(options: {
  notifyUserTypesOptions?: WorkflowListOption[]
}): SchemaTypeDefinition
```

Name: `workflowStage`. Icon: `lucide-react/SignpostBig`.

Fields: `label` (required), `slug` (required, sourced from `label`), `icon` (`lucide-icon`), `color` (hex, `/^#[0-9A-Fa-f]{6}$/`), `stageCriteria` (portable text, `block` only), `taskTemplates` (array of `taskTemplate`), `enableCompletionGating` (boolean, default `false`), `gatingOverrideRoles` (string array, hidden unless gating on, rendered with `WorkflowRoleCheckboxInput`), `enablePublishing` (boolean, default `false`), `enableNotifications` (boolean, default `true`), `notifyUserTypes` (string array, `options.list = notifyUserTypesOptions`, hidden unless notifications on).

#### `generateWorkflowOffRampObject(options)`

```ts
generateWorkflowOffRampObject(options: {
  notifyUserTypesOptions?: WorkflowListOption[]
}): SchemaTypeDefinition
```

Name: `workflowOffRamp`. Icon: `lucide-react/RouteOff`. Tone colors default to amber (`caution`) / red (`critical`) / gray (`neutral`).

Fields: `label`, `slug`, `icon`, `tone` (`caution` or `critical`, radio layout), `stageCriteria`, `enablePublishing`, `unpublishOnEntry` (boolean, default `false`), `allowedRoles` (string array, rendered with `WorkflowRoleCheckboxInput`), `enableNotifications`, `notifyUserTypes`.

#### `generateTaskTemplateObject(options)`

```ts
generateTaskTemplateObject(options: {
  assignmentTypeOptions?: WorkflowListOption[]
}): SchemaTypeDefinition
```

Name: `taskTemplate`. Icon: `lucide-react/ClipboardList`.

Fields: `title` (required), `description` (portable text), `assigneeRole` (`string`, `options.list = assignmentTypeOptions`, rendered with `WorkflowRoleSelectInput`), `dueInDays` (`number`, min 0, integer), `required` (boolean, default `true`).

#### `assignmentObject`

```ts
const assignmentObject: SchemaTypeDefinition
```

`object`, name `assignment`. Icon: `lucide-react/UserRound`. Fixed schema type — there is no generator.

Fields:

- `assignmentType` — `string`, rendered with a custom input that populates its dropdown from the parent document's `workflowDefinition.roles[]` at runtime. Stores the workflow role slug (e.g. `reporter`, `section_editor`). No static option list is required; no code-level customization is needed for the common case.
- `userId` — `string`. The Sanity project-user id assigned to this workflow role for this document.

Registered automatically by the plugin (and auto-injected via `withWorkflow` when `injectAssignments !== false`). Also exported for direct use — add `{type: 'assignment'}` to any array field if you're opting out of the auto-injection but still want assignments somewhere.

To carry additional fields beyond `assignmentType` and `userId` (channel, market, region, language, etc.), define your own schema type with `name: 'assignment'` and register it via `workflowsPlugin({schemaTypes: [yourAssignment]})`. The plugin merges schema types by name, so yours replaces the default.

#### `generateTableViewType(options)`

```ts
generateTableViewType(options: {
  contentTypeOptions: WorkflowListOption[]
}): SchemaTypeDefinition
```

Name: `tableView`. Icon: `lucide-react/Table2`.

Fields: `contentType` (`options.list = contentTypeOptions`), `name` (required, unique within parent `tableViews[]` array), `description` (text), `isDefault` (boolean, default `false`), `columns` (array of `tableViewColumn`, min 1, no duplicate `field` values).

#### `generateTableViewColumnType(options)`

```ts
generateTableViewColumnType(options: {
  tableColumns: WorkflowListOption[]
}): SchemaTypeDefinition
```

Name: `tableViewColumn`. Icon: `lucide-react/Columns3`.

Fields: `field` (required, `options.list = tableColumns`), `displayName`, `pinned` (`none`, `left`, or `right`, default `none`, radio layout).

#### `generateStatusType(options)`

```ts
generateStatusType(options: {
  notifyUserTypesOptions?: WorkflowListOption[]
}): SchemaTypeDefinition
```

**Not registered by the plugin by default.** An alternative lifecycle document type (`status`) for Studios that want reusable status documents instead of stage arrays embedded in a workflow definition.

Name: `status`. Fields: `label`, `slug`, `enableNotifications`, `notifyUserTypes`, `completionCriteria` (portable text).

### `reusableStatusTrackerField`

```ts
const reusableStatusTrackerField: FieldDefinition
```

A field you can drop onto any document type (typically one already managing its own `status` field) to get the audit-trail `statuses` array with the plugin's custom rendering (collapsible history via `SetStatusArrayContainer` / `SetStatusArrayInput`).

```ts
defineField({
  ...reusableStatusTrackerField,
  group: 'workflows',
})
```

### `WorkflowListOption`

```ts
interface WorkflowListOption {
  title: string
  value: string
}
```

The shape Sanity uses for `options.list`. Reused throughout the generators.

---

## Actions entrypoint

```ts
import {
  workflowAuditTrailActionResolver,
  workflowTransitionActionResolver,
  workflowOffRampDocumentActionsResolver,
  createWorkflowTransitionAction,
  createWorkflowOffRampSlotAction,
} from '@sanity-labs/sanity-plugin-workflows/actions'
```

### `workflowAuditTrailActionResolver(prev, context)`

The composite resolver the plugin mounts by default. In order:

1. Wraps the built-in `publish` action so that when publish succeeds it appends a `setStatus` entry (via `appendStatusAuditEntry`) and creates any task templates attached to the current stage (via `createTasksForWorkflowTemplates` with `skipIfTasksExist: true`). Skips if the document type has no `status` field.
2. Runs `workflowOffRampDocumentActionsResolver` to insert up to 10 off-ramp slot actions after the publish action.
3. Runs `workflowTransitionActionResolver` to replace the publish action label with "Move to _next stage_" and attach the confirm/gated dialog flow.

Use this when you want the full behavior in a single resolver.

### `workflowTransitionActionResolver(prev, context)`

The resolver responsible for turning the built-in `publish` action into the transition action. It:

- Finds the `publish` action and wraps it.
- Uses `useSchema()` to check the target document type has a `status` field - if not, returns the original action unchanged.
- Calls `createWorkflowTransitionAction(originalPublish, documentType)` for eligible types.

### `workflowOffRampDocumentActionsResolver(prev, context)`

Inserts 10 `WorkflowOffRampSlotAction` components after any leading non-`action`-typed custom actions. Slots that don't have a corresponding off-ramp in the published workflow definition render `null`, so unused slots disappear.

### `createWorkflowTransitionAction(originalPublishAction, documentType)`

```ts
function createWorkflowTransitionAction(
  originalPublishAction: DocumentActionComponent,
  documentType: string,
): DocumentActionComponent
```

Directly builds the transition action for a single document type. Lifecycle:

1. Fetches the workflow definition via `getCachedWorkflowDefinition`.
2. Computes `currentStage` (`findWorkflowTransitionTarget`) and `nextStage` (`findNextWorkflowStage`).
3. On click:
   - If the current stage has `enableCompletionGating` and `evaluateWorkflowStageGating` returns `{blocked: true}`, opens the **Gated** dialog (`WorkflowTransitionGatedDialogContent`).
   - Else if the next stage has `stageCriteria` or `taskTemplates`, opens the **Confirm** dialog (`WorkflowTransitionConfirmDialogContent`).
   - Else calls `performWorkflowTransition` immediately.
4. Action label: `Move to <label-or-slug>`. Icon: the stage's Lucide icon (kebab-case to PascalCase) or `ArrowRightIcon`.
5. While `workflowDefinition === undefined` the action is disabled with label "Loading workflow...".

Override role privileges for gating are resolved via `userHasWorkflowRoleAccess` against `useWorkflowProjectUsers(client)`.

### `createWorkflowOffRampSlotAction(documentType, slotIndex)`

```ts
function createWorkflowOffRampSlotAction(
  documentType: string,
  slotIndex: number,
): DocumentActionComponent
```

Returns a slot action that renders as "Move to _off-ramp label_" for the off-ramp at `workflowDefinition.offRamps[slotIndex]`. Returns `null` when the slot is empty or prerequisites fail (no `status` field, no document snapshot, no published definition). On confirm:

1. Calls `performWorkflowTransition`.
2. If `offRamp.unpublishOnEntry === true`, calls `client.action({actionType: 'sanity.action.document.unpublish', ...})` to take the document off live.

Enforces off-ramp role restrictions via `canUseOffRampStage`. When the role check fails, the action is disabled with the title returned by `getOffRampDisabledTitle`.

---

## Audit entrypoint

```ts
import {
  createWorkflowAuditInspector,
  WorkflowAuditInspector,
  useHasWorkflow,
  type WorkflowAuditInspectorConfig,
  type WorkflowStatusEntry,
} from '@sanity-labs/sanity-plugin-workflows/audit'
```

### `createWorkflowAuditInspector(config?)`

```ts
function createWorkflowAuditInspector(config?: WorkflowAuditInspectorConfig): DocumentInspector
```

Returns a `DocumentInspector` with `name: 'workflow-audit'` that renders `<WorkflowAuditInspector documentId documentType />`. The menu item is hidden when `useHasWorkflow(documentType) !== true`.

Default icon: `@sanity/icons/ClipboardIcon`. Default title: `'Audit Trail'`.

#### `WorkflowAuditInspectorConfig`

```ts
interface WorkflowAuditInspectorConfig {
  icon?: React.ComponentType
  title?: string
}
```

### `WorkflowAuditInspector({documentId, documentType})`

```ts
function WorkflowAuditInspector(props: {
  documentId: string
  documentType: string
}): JSX.Element
```

Standalone component. Fetches the document's `statuses` array, subscribes via `client.listen` for live updates, sorts descending by `completedAt`, and renders an `AuditEntry` per status. Use it when you need the audit UI outside a Studio inspector (e.g. embedded in a custom panel).

### `useHasWorkflow(documentType)`

```ts
function useHasWorkflow(documentType: string): boolean | null
```

React hook. Returns `null` while loading, `true` if a published `workflowDefinition` with matching `documentType` exists, `false` otherwise. Uses the plugin's configured API version.

### `WorkflowStatusEntry`

```ts
interface WorkflowStatusEntry {
  _key: string
  completedAt: string
  completedBy: {
    displayName?: string
    email?: string
    id?: string
    imageUrl?: string
    userId?: string
  }
  reason?: string
  statusIcon?: string
  statusLabel: string
  statusSlug: string
}
```

Shape of a single audit entry as rendered by the inspector. This is the denormalized version - the on-document `setStatus` entry produced by the engine uses `completedBy: {_type: 'user', userId}` and is typed as `WorkflowStatusAuditEntry` in `@sanity-labs/workflow-kit`.

---

## See also

- [README](../README.md) - concepts, quickstart, how-to guides, troubleshooting.
- [`@sanity-labs/workflow-kit` reference](https://github.com/sanity-labs/workflow-kit/blob/main/docs/reference.md) - engine, React, and Studio primitives the plugin composes.
