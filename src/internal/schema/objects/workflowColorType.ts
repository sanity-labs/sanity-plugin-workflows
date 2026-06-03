import {color, hslaColor, hsvaColor, rgbaColor} from '@sanity/color-input'
import {defineType, type SchemaTypeDefinition} from 'sanity'

/**
 * Namespaced color object type for workflow stages.
 *
 * `@sanity/color-input` registers its object type under the bare name `color`,
 * which collides with host studios that already define their own `color` type
 * (for example a `color` product-attribute document). To stay collision-free we
 * reuse color-input's field structure, preview, and `ColorInput` component but
 * register it as `workflow.color` and never call `colorInput()` ourselves.
 *
 * The hsl/hsv/rgb sub-object types (`hslaColor`, `hsvaColor`, `rgbaColor`) are
 * re-registered as-is because the color object's fields reference them by name.
 * They are deduped by name in `mergeWorkflowSchemaTypes`, so studios that also
 * register `colorInput()` keep their own copies.
 */
export const workflowColorType = defineType({
  ...color,
  name: 'workflow.color',
  title: 'Workflow Color',
})

/** Sub-object types referenced by `workflow.color` fields. */
export const workflowColorSupportTypes: SchemaTypeDefinition[] = [hslaColor, hsvaColor, rgbaColor]
