# Create Basic Store Slice

## Required Input

- Feature name and state shape
- Server actions to be integrated
- Basic CRUD operations needed
- Initial state structure

## Expected Output

1. Types File

    - Location: `@/store/<slice-name>/types.ts`
    - State interface
    - Actions interface
    - Data types

2. Store Slice

    - Location: `@/store/<slice-name>/slice.ts`
    - Basic CRUD operations
    - Loading states
    - Error handling

3. Store Composition (if needed)
    - Location: `@/store/index.ts`
    - Slice integration

## Dependencies

- Server actions from `@/lib/actions/<feature-name>.ts`
- Zod schemas from `@/lib/schemas/<feature-name>.ts`
- Service types from `@/services/<feature-name>.ts`
- Reference: See `@/_TEMPLATE_RELATIONSHIPS.md` for implementation flow

## Context Requirements

- Access to server action types
- Understanding of feature data shape
- Knowledge of required operations

## Implementation Steps

1. Create type definitions:

```typescript:@/store/types/<slice-name>.ts
import { type EntityRow } from '@/lib/schemas/<feature-name>'

export interface EntityState {
  data: EntityRow[]
  isLoading: boolean
  error: Error | null
}

export interface EntityActions {
  create: (input: Omit<EntityRow, 'id' | 'created_at'>) => Promise<void>
  // Additional CRUD actions (fetch, update, delete)
  reset: () => void
}

export type EntitySlice = EntityState & EntityActions
```

2. Implement basic slice:

```typescript:@/store/slices/<slice-name>.ts
import { type StateCreator } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { type EntitySlice } from '../types/<slice-name>'
import { entitySchema } from '@/lib/schemas/<feature-name>'
import { createEntity } from '@/lib/actions/<feature-name>'

export const createSlice: StateCreator<EntitySlice> = immer((set, get) => ({
  data: [],
  isLoading: false,
  error: null,

  create: async (input) => {
    set(state => { state.isLoading = true; state.error = null });

    // Validate input
    try {
      entitySchema.omit({ id: true, created_at: true }).parse(input);
    } catch (error) {
      set(state => {
        state.error = error as Error;
        state.isLoading = false;
      });
      return;
    }

    try {
      const { data: newEntity, error } = await createEntity(input);
      if (error) {
        set(state => {
          state.error = error as Error;
          state.isLoading = false;
        });
        return;
      }

      set(state => {
        if (newEntity) state.data.push(newEntity);
        state.isLoading = false;
      });
    } catch (error) {
      set(state => { state.error = error as Error });
    } finally {
      set(state => { state.isLoading = false });
    }
  },

  // Additional actions follow same pattern:
  // 1. Set loading/clear error
  // 2. Validate input (if mutation)
  // 3. Call server action
  // 4. Update state
  // 5. Handle errors
  // 6. Clear loading

  reset: () => set(state => {
    state.data = [];
    state.isLoading = false;
    state.error = null;
  })
}));
```

3. Update store composition:

```typescript:@/store/index.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createSlice } from './<slice-name>/slice.ts'

export const useStore = create<EntitySlice>()(
  immer(createSlice)
)
```

## Validation Criteria

- [ ] Types properly define state and actions
- [ ] Necessary CRUD operations implemented
- [ ] Loading states managed correctly
- [ ] Error states managed correctly
- [ ] Store composition updated
- [ ] Immer middleware configured
- [ ] Type safety with Zod validation
- [ ] Integration with server actions
- [ ] Proper use of generated types

## Common Pitfalls

- Missing type exports
- Incomplete error handling
- Not handling loading states
- Forgetting to reset error state
- Missing server action imports
- Not validating inputs with Zod
- Inconsistent error handling patterns
- Not using proper types from services layer
