# Create Advanced Store Slice

## Required Input

- Basic store slice implementation
- Complex state update requirements
- Optimistic update needs
- Batch operation specifications
- Performance requirements

## Expected Output

1. Enhanced Store Slice

    - Location: `@/store/slices/<slice-name>.ts`
    - Optimistic updates
    - Batch operations
    - Rollback handling
    - Type-safe state management

2. Selectors
    - Location: `@/store/selectors/<slice-name>.ts`
    - Memoized selectors
    - Complex data transformations

## Dependencies

- Basic store slice must be implemented first (`@/store/slices/<slice-name>.ts` must exist)
- Reference: See `@/_TEMPLATE_RELATIONSHIPS.md` for implementation flow

## Context Requirements

- Understanding of existing store slice
- Knowledge of complex state relationships
- Performance bottlenecks to address

## Implementation Steps

1. Enhance store slice with optimistic updates:

```typescript:@/store/slices/<slice-name>.ts
import { entitySchema } from '@/lib/schemas/<feature-name>'
import { updateEntity, batchUpdateEntities } from '@/lib/actions/<feature-name>'
import { immer } from 'zustand/middleware/immer'

import { type EntityRow } from '@/lib/schemas/<feature-name>'
import { type StateCreator } from 'zustand'

interface EntitySlice {
  data: EntityRow[]
  error: Error | null
  update: (id: string, input: Omit<EntityRow, 'id' | 'created_at'>) => Promise<void>
  batchUpdate: (updates: Array<{ id: string; input: Omit<EntityRow, 'id' | 'created_at'> }>) => Promise<void>
}

export const createSlice: StateCreator<EntitySlice> = immer((set, get) => ({
  data: [],
  error: null,

  update: async (id: string, input: Omit<EntityRow, 'id' | 'created_at'>) => {
    const previousData = get().data;

    // Validate input
    try {
      entitySchema.partial().parse(input);
    } catch (error) {
      set(state => { state.error = error as Error });
      return;
    }

    // Optimistic update
    set(state => {
      const index = state.data.findIndex(item => item.id === id);
      if (index !== -1) Object.assign(state.data[index], input);
    });

    try {
      const { data: updatedData, error } = await updateEntity({ id, ...input });
      if (error) throw new Error(error);

      set(state => {
        const index = state.data.findIndex(item => item.id === id);
        if (index !== -1 && updatedData) state.data[index] = updatedData;
        state.error = null;
      });
    } catch (error) {
      // Rollback on error
      set(state => {
        state.data = previousData;
        state.error = error as Error;
      });
    }
  },

    batchUpdate: async (updates: Array<{ id: string; input: Omit<EntityRow, 'id' | 'created_at'> }>) => {
    const previousData = get().data;

    // Validate all inputs
    try {
      updates.forEach(({ input }) => {
        entitySchema.partial().parse(input);
      });
    } catch (error) {
      set(state => { state.error = error as Error });
      return;
    }

    // Optimistic updates
    set(state => {
      updates.forEach(({ id, input }) => {
        const index = state.data.findIndex(item => item.id === id);
        if (index !== -1) Object.assign(state.data[index], input);
      });
    });

    try {
      const { data: results, error } = await batchUpdateEntities(updates);
      if (error) throw new Error(error);

      set(state => {
        if (results) {
          results.forEach(item => {
            const index = state.data.findIndex(d => d.id === item.id);
            if (index !== -1) state.data[index] = item;
          });
        }
        state.error = null;
      });
    } catch (error) {
      // Rollback on error
      set(state => {
        state.data = previousData;
        state.error = error as Error;
      });
    }
  }
}));
```

2. Implement memoized selectors:

```typescript:@/store/selectors/<slice-name>.ts
import { createSelector } from 'reselect';
import type { EntityRow } from '@/lib/schemas/<feature-name>';
import type { EntitySlice } from '../slices/<slice-name>';

export interface EntityFilters {
  // Add filter types based on entity fields
  status?: string
  search?: string
}

export const selectFilteredEntities = createSelector(
  [(state: EntitySlice) => state.data, (_: EntitySlice, filters: EntityFilters) => filters],
  (data, filters): EntityRow[] => {
    return data.filter(item => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }
);

// Add additional selectors for common data transformations
```

## Validation Criteria

- [ ] Optimistic updates working with rollback
- [ ] Batch operations implemented efficiently
- [ ] Selectors properly memoized
- [ ] Error recovery functioning
- [ ] State consistency maintained
- [ ] Performance optimized
- [ ] Type safety with Zod validation
- [ ] Integration with server actions
- [ ] Proper use of immer for immutable updates

## Common Pitfalls

- Not storing previous state for rollbacks
- Missing error handling in batch operations
- Inefficient selector memoization
- Race conditions in updates
- Memory leaks in selectors
- Not validating inputs with Zod
- Inconsistent error handling patterns
- Not using proper types from services layer
