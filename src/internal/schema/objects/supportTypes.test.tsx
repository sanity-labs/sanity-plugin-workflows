import {describe, expect, it, vi} from 'vitest'

vi.mock('sanity', () => ({
  defineField: (spec: unknown) => spec,
  defineType: (spec: unknown) => spec,
}))

vi.mock('@sanity/icons', () => ({
  UserIcon: () => null,
}))

import {lucideIconType} from './lucideIconType'
import {userObject} from './userObject'

type SchemaField = {
  name: string
  title?: string
  type: string
}

describe('workflow support schema types', () => {
  it('defines a fallback user object for audit entries', () => {
    const userIdField = (userObject.fields as SchemaField[]).find(
      (field) => field.name === 'userId',
    )

    expect(userObject.name).toBe('workflow.user')
    expect(userObject.type).toBe('object')
    expect(userIdField).toMatchObject({
      name: 'userId',
      title: 'User ID',
      type: 'string',
    })
  })

  it('defines a lucide icon string type with a picker input', () => {
    expect(lucideIconType).toMatchObject({
      name: 'workflow.lucideIcon',
      title: 'Lucide Icon',
      type: 'string',
    })
    expect(lucideIconType.components?.input).toBeDefined()
  })
})
