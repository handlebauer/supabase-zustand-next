# Create UI Component

## Required Input

- Entity name and its store slice/hook implementation
- UI/UX requirements and design specifications
- Component interaction patterns
- Loading/error/empty state requirements

## Expected Output

1. Component File(s)

    - Location: `@/components/<feature-name>/<client/server>/<component-name>.tsx`
    - Presentation logic
    - State consumption
    - Event handlers
    - Loading/error/empty states

2. Types File

    - Location: `@/components/<feature-name>/<client/server>/types.ts`
    - Component props interface
    - Event handler types
    - Shared type definitions

3. Test File
    - Location: `@/components/<feature-name>/<client/server>/<component-name>.test.tsx`
    - Unit tests for all states
    - Integration tests with hooks/store
    - Accessibility tests
    - Event handler tests

## Dependencies

- Store slice or custom hooks must be implemented
- shadcn/ui must be installed

## Context Requirements

- Understanding of store/hooks implementation
- Knowledge of UI/UX requirements
- Accessibility guidelines (WCAG)
- Component library patterns

## Implementation Steps

1. Install shadcn/ui components if needed

```bash
bun run shadcn:add [component-name]
```

2. Create component with store usage:

```typescript:@/components/<feature-name>/<client/server>/<component-name>.tsx
import { useShallow } from 'zustand/react'
import { useStore } from '@/app/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import type { EntityComponentProps } from './types'
import type { EntityRow } from '@/lib/schemas/<feature-name>'

export interface EntityComponentProps {
  onItemSelect?: (item: EntityRow) => void
}

export type EntityCardProps = {
  item: EntityRow
  onAction: (id: string) => void
}

export function EntityComponent({
  initialFilters,
  onItemSelect,
}: EntityComponentProps) {
  const { data, isLoading, error } = useStore(useShallow(state => ({
    data: state.data,
    isLoading: state.isLoading,
    error: state.error
  })))

  if (isLoading) return // return loading state
  if (error) return // return error state
  if (!data?.length) return // return empty state

  return (
    <div>
      {/* UI using data */}
    </div>
  )
}
```

3. Create component with custom hook:

```typescript:@/components/<feature-name>/<client/server>/<component-name>-complex.tsx
import { useEntity } from '@/hooks/use-entity'
import type { EntityComponentProps } from './types'

export function EntityComplexComponent({
  initialFilters,
}: EntityComponentProps) {
  const {
    items,
    isLoading,
    error,
    handleAction
  } = useEntity(initialFilters)

  // Same loading/error/empty state handling as above

  return (
    <section>
      {items.map(item => (
        <ItemComponent
          key={item.id}
          item={item}
          onAction={handleAction}
        />
      ))}
    </section>
  )
}
```

## Validation Criteria

- [ ] Component handles all state cases (loading/error/empty/data)
- [ ] Event handlers properly typed and tested
- [ ] Props interface well-defined and documented
- [ ] Performance optimized (useMemo/useCallback where needed)
- [ ] Consistent with design system patterns
- [ ] Tests cover all major use cases
- [ ] Error boundaries in place

## Common Pitfalls

- Over-fetching state from store
- Missing loading/error/empty states
- Accessibility oversights (missing ARIA, keyboard nav)
- Unnecessary re-renders
- Prop drilling instead of using context/hooks
- Complex logic in render method
- Missing error boundaries
- Inconsistent styling patterns
- Not handling edge cases
- Missing type safety
