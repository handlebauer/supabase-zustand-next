# Create Custom Hooks

## Required Input

- Entity name and its store slice implementation
- Required derived state calculations
- Complex state combination requirements
- Performance optimization needs
- Side effect patterns to abstract
- Test scenarios to cover

## Expected Output

1. Custom Hook File

    - Location: `@/hooks/use-<feature-name>.ts`
    - Derived state calculations
    - Complex state combinations
    - Memoized computations
    - Side effect management

2. Test File
    - Location: `@/hooks/use-<feature-name>.test.ts`
    - Unit tests for all computations
    - Mock store state
    - Performance testing

## Dependencies

- Store slice from `@_STORE_SLICE_BASIC.md`
- Server actions from `@_SERVER_ACTION.md`
- Service types from `@_SERVICES_LAYER.md`
- Reference: See `@/_TEMPLATE_RELATIONSHIPS.md` for implementation flow

## Context Requirements

- Understanding of store slice behavior
- Knowledge of performance bottlenecks
- Identification of repeated patterns
- Side effect requirements
- Test environment setup

## Implementation Steps

1. Create basic hook with derived state:

```typescript:@/hooks/use-<feature-name>.ts
import { useMemo, useCallback } from 'react'
import { useStore } from '@/store'
import type { EntityRow } from '@/lib/schemas/<feature-name>'
import type { EntityFilters } from '@/store/types/<feature-name>'

export function useEntity(filters?: EntityFilters) {
  const data = useStore(state => state.data)
  const isLoading = useStore(state => state.isLoading)
  const error = useStore(state => state.error)

  const filteredItems = useMemo(() => {
    if (!data || !filters) return data
    return data.filter(item => {
      // Apply filters
      return true
    })
  }, [data, filters])

  const handleAction = useCallback(async (id: string) => {
    // Handle action logic
  }, [/* dependencies */])

  return {
    items: filteredItems,
    isLoading,
    error,
    handleAction
  }
}
```

2. Create hook with combined state:

```typescript:@/hooks/use-<feature-name>-complex.ts
import { useMemo } from 'react'
import { useStore } from '@/store'
import { useOtherStore } from '@/store/other'

export function useEntityComplex() {
  const data = useStore(state => state.data)
  const otherData = useOtherStore(state => state.otherData)

  const combinedState = useMemo(() => {
    if (!data || !otherData) return []
    return data.map(item => ({
      ...item,
      extraData: otherData[item.id]
    }))
  }, [data, otherData])

  return { data: combinedState }
}
```

## Example Usage

```typescript
// Basic Hook Usage
function EntityList() {
  const { items, isLoading, error, handleAction } = useEntity({
    status: 'active'
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => handleAction(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  )
}

// Complex Hook Usage
function EntityDashboard() {
  const { data } = useEntityComplex()

  return (
    <div>
      {data.map(item => (
        <DashboardCard
          key={item.id}
          item={item}
          extraData={item.extraData}
        />
      ))}
    </div>
  )
}
```

## Validation Criteria

- [ ] Hooks properly memoize expensive computations
- [ ] Complex state combinations are efficient
- [ ] Side effects are properly managed
- [ ] Loading states correctly combined
- [ ] Error states properly handled
- [ ] Return values are stable
- [ ] Tests cover all major use cases
- [ ] Performance benchmarks pass

## Common Pitfalls

- Missing dependency arrays in useMemo/useCallback
- Unnecessary state derivations
- Inefficient state combinations
- Memory leaks in subscriptions
- Unstable return values
- Over-abstraction of simple state
- Not handling loading/error states
- Missing type safety
