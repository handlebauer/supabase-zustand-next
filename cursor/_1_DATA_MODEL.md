# Create New Data Model

## Required Input

- Feature name and description
- Entity relationships and their cardinality
- Required fields and their types
- Access control requirements
- Any unique constraints or indexes needed

## Expected Output

1. Database Migration File

    - Location: `./supabase/migrations/<timestamp>_<name>.sql`
    - Tables, indexes, foreign keys
    - RLS policies

2. Generated Types

    - Run: `bun run supabase:gen-types`
    - Provides: `Tables` and `TablesInsert` and `TablesUpdate` types
    - Used by: Services layer and Zod schemas

3. Zod Schemas (derived from Supabase types)
    - Location: `@/lib/schemas/<entity>.ts`
    - Base schema matching database types
    - Insert/Update schemas
    - Additional runtime validations

## Dependencies

- None (this is typically the first step in feature implementation)
- Reference: See `./cursor/_TEMPLATE_RELATIONSHIPS.md` for full implementation flow

## Context Requirements

- Access to Supabase project configuration
- Understanding of existing data models (if any)
- Knowledge of authentication setup

## Implementation Steps

1. Create migration:

```sql:./supabase/migrations/<timestamp>_<name>.sql
CREATE TABLE public.{table_name} (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Add fields here
);

-- Add any RLS necessary
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "{policy_name}" ON public.{table_name} FOR {operation}
-- ... any policy definitions based on requirements
```

2. Generate Supabase types:

```bash
bun run supabase:gen-types # ALWAYS RUN THIS AFTER CREATING MIGRATION
```

3. Create Zod schemas from generated types:

```typescript
import { type Tables, TablesInsert } from '@/lib/supabase/types'
import { z } from 'zod'

// Extract types from Database type
export type EntityRow = Tables<'entity'>
export type EntityInsert = TablesInsert<'entity'>

// Create base schema matching database exactly
export const entitySchema = z.object({
    id: z.string().uuid(),
    created_at: z.string().datetime(),
    // Add entity-specific fields here
}) satisfies z.ZodType<EntityRow>

// Create insert schema (omitting generated fields)
export const entityInsertSchema = entitySchema.omit({
    id: true,
    created_at: true,
}) satisfies z.ZodType<EntityInsert>

// Add any additional runtime validations
export const entityWithValidationsSchema = entitySchema.extend({
    // Add entity-specific validations here
})
```

## Integration Guide

Provides for services layer:

```typescript
// 1. Database types (from Supabase)
import { type Tables } from '@/lib/supabase/types'
type EntityRow = Tables<'entity'>

// 2. Zod schemas (with runtime validation)
import { entitySchema, entityInsertSchema } from '@/lib/validations/entity'

// 3. RLS policies to consider
// - Users can view entities they have access to
// - Only authorized users can modify entities
// - Access control based on user permissions
```

## Example Usage

```typescript
// Generated from provided user spec
const featureSpec = {
    name: 'entity',
    fields: [
        { name: 'id', type: 'uuid' },
        // Add entity-specific fields here
    ],
    constraints: [{ type: 'unique', fields: ['id'] }],
}
```

## Common Pitfalls

- Not running `bun run supabase:gen-types` after schema changes
- Zod schemas not matching Supabase types
- Missing `satisfies` type checks
- Forgetting to create Insert/Update variants
- Not handling nullable fields correctly

## Validation Checklist

- [ ] Migration creates all tables/relationships
- [ ] RLS policies match access requirements
- [ ] `bun run supabase:gen-types` runs successfully
- [ ] Types are complete and exported
- [ ] Zod schemas match Supabase types (use `satisfies`)
- [ ] Runtime validations added where needed
- [ ] Insert/Update variants created
- [ ] Integration outputs are documented

NOTE: PLEASE CHECK OFF ALL THE CHECKLIST ITEMS ABOVE
