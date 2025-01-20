# Create Server Actions

## Required Input

- Entity name and its service layer implementation
- Required server-side operations (CRUD + specialized)
- Cache invalidation requirements
- Input validation requirements
- Response type requirements
- Error handling requirements
- Test scenarios to cover

## Expected Output

1. Server Action File

    - Location: `@/lib/actions/<feature-name>.ts`
    - Type-safe server actions
    - Input validation
    - Error handling
    - Cache invalidation
    - Return types

2. Test File
    - Location: `@/lib/actions/<feature-name>.test.ts`
    - Unit tests for all actions
    - Error case coverage
    - Mock service responses

## Dependencies

- Service layer from `@_SERVICES_LAYER.md`
- Zod schemas from `@_DATA_MODEL.md`
- Generated Supabase types

## Context Requirements

- Understanding of Next.js server actions
- Knowledge of cache invalidation patterns
- Access to service layer implementations
- Test environment setup

## Implementation Steps

1. Create or update server action file:

    ```typescript:@/lib/actions/<feature-name>.ts
    'use server'

    import { revalidatePath } from 'next/cache'
    import { entitySchema, EntityRow } from '@/lib/schemas/<feature-name>'
    import { EntityService } from '@/services/<feature-name>'
    import { ActionError } from '@/lib/errors'

    const service = new EntityService()

    export async function createEntity(
      input: z.infer<typeof entitySchema>
    ): Promise<{
      data: EntityRow | null
      error: string | null
    }> {
      try {
        const validated = entitySchema.parse(input)
        const data = await service.create(validated)
        revalidatePath('/<feature-name>')
        return { data, error: null }
      } catch (error) {
        console.error('[createEntity]', error)
        return {
          data: null,
          error: error instanceof ActionError
            ? error.message
            : 'Failed to create entity'
        }
      }
    }

    // Additional actions follow same pattern...
    ```

2. Implement test file:

    ```typescript:@/lib/actions/<feature-name>.test.ts
    import { describe, expect, it, mock } from 'bun:test'
    import { createEntity } from './<feature-name>'
    import { EntityService } from '@/services/<feature-name>'

    // Mock setup...

    describe('createEntity', () => {
      // Test cases...
    })
    ```

## Example Usage

```typescript
// Client Component Example
'use client'

import { deleteEntity, updateEntityStatus } from '@/lib/actions/<feature-name>'
import { useOptimistic } from 'react'

export function EntityList({ items }: { items: EntityRow[] }) {
  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    // Update function
  )

  async function handleStatusChange(id: string, status: string) {
    addOptimisticItem({ id, status })
    const { error } = await updateEntityStatus({ id, status })
    if (error) {
      // Handle error state
    }
  }

  async function handleDelete(id: string) {
    addOptimisticItem({ id, deleted: true })
    const { error } = await deleteEntity(id)
    if (error) {
      // Handle error state
    }
  }

  return (
    <ul>
      {optimisticItems.map(item => (
          {/* Display item details */}
          {/* Action buttons */}
          {/* Additional UI elements */}
      ))}
    </ul>
  )
}

// Server Component Example
import { fetchEntities } from '@/lib/actions/<feature-name>'

export default async function Page() {
  const { data: items } = await fetchEntities({ limit: 10 })
  return <EntityList items={items ?? []} />
}
```

## Common Pitfalls

- Not handling validation errors properly
- Missing input validation
- Insufficient error handling
- Not using transactions where needed
- Missing optimistic updates
- Incorrect error propagation
- Insufficient logging
- Missing type safety

NOTE: PLEASE CHECK OFF ALL THE CHECKLIST ITEMS BELOW

## Validation Criteria

- [ ] Input validation with Zod schemas
- [ ] Error handling for all cases
- [ ] Proper transaction management
- [ ] Optimistic updates implemented
- [ ] Loading states managed
- [ ] Type safety throughout
- [ ] Tests cover error cases
- [ ] Performance optimized
