# Create Services Layer

## Required Input

- Entity name and its data model
- Required CRUD operations
- Specialized query requirements
- Performance requirements (pagination, etc.)
- Error handling requirements
- Test scenarios to cover

## Expected Output

1. Service Class File

    - Location: `@/services/<feature-name>.ts`
    - Base CRUD operations
    - Specialized queries
    - Error handling
    - Type-safe methods

2. Test File

    - Location: `@/services/<feature-name>.test.ts`
    - Unit tests for all methods
    - Error case coverage
    - Mock data setup

3. Seed Data
    - Development data: `./scripts/db/dev.ts`
    - Representative sample/test data

## Dependencies

- Data model from `@_2_NEW_DATA_MODEL.md`
- Generated Supabase types
- Zod schemas for validation

## Context Requirements

- Access to Supabase client configuration
- Understanding of RLS policies
- Knowledge of existing service patterns
- Test database access

## Implementation Steps

1. Create service class:

    ```typescript:@/services/<feature-name>.ts
    import { createClient } from '@/lib/supabase/server'
    import { DatabaseError } from '@/lib/errors'
    import { entitySchema, EntityRow } from '@/lib/schemas/<entity>'

    export class EntityService {
      private db = createClient()

      async findMany(params: {
        limit?: number
        offset?: number
        // ... other filters
      }): Promise<EntityRow[]> {
        try {
          const query = this.db
            .from('<table_name>')
            .select('*')

          if (params.limit) query.limit(params.limit)
          if (params.offset) query.range(params.offset, params.offset + params.limit - 1)

          const { data, error } = await query
          if (error) throw new DatabaseError(error.message)
          return data.map(row => entitySchema.parse(row))
        } catch (error) {
          console.error('[{Entity}Service.findMany]', error)
          throw error
        }
      }

      // ... other methods
    }
    ```

2. Implement test file:

    ```typescript:@/services/<feature-name>.test.ts
    import { describe, expect, it, beforeEach } from 'bun:test'
    import { EntityService } from './<feature-name>'
    import { generateMockEntity } from '@/test/factories/<feature-name>'

    describe('EntityService', () => {
      let service: EntityService

      beforeEach(async () => {
        service = new EntityService()
        // Setup test data
      })

      describe('findMany', () => {
        it('returns validated results', async () => {
          const result = await service.findMany({ limit: 10 })
          expect(result).toHaveLength(10)
          // Schema validation happens automatically
        })

        it('handles validation errors', async () => {
          // Test invalid data cases
        })
      })
    })
    ```

3. Create seed data:
    ```typescript:./scripts/db/dev.ts
    // Add seed data here
    ```

## Example Usage

```typescript
const entityService = new EntityService()

// Finds many entities with validation
// Throws ZodError if validation fails
const entities = await entityService.findMany({
    limit: 20,
    offset: 0,
})
```

## Common Pitfalls

- Not handling validation errors properly
- Missing schema validations on mutations
- Inefficient query patterns (N+1 problems)
- Incomplete type coverage
- Missing error logging
- Not respecting RLS in queries
- Insufficient validation test coverage

NOTE: PLEASE CHECK OFF ALL THE CHECKLIST ITEMS BELOW

## Validation Criteria

- [ ] All CRUD operations implemented with proper types
- [ ] Zod validation on all database operations
- [ ] Error handling includes validation errors
- [ ] Tests cover schema validation cases
- [ ] RLS policies are respected
- [ ] Performance is optimized for common queries
- [ ] Transactions used where necessary
- [ ] Seed data covers key scenarios
