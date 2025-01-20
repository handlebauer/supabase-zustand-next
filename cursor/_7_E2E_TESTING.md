# \_7_E2E_TESTING.md

## Required Input

- Complete feature implementation
- Test scenarios from all previous layers
- Performance requirements
- Error scenarios to test

## Expected Output

1. E2E Test Suite
    - Happy path scenarios
    - Error scenarios
    - Performance tests
    - Accessibility tests

## Playwright Setup

```typescript
// 1. Environment Configuration (playwright.config.ts)
import { PlaywrightTestConfig, devices } from '@playwright/test'

const config: PlaywrightTestConfig = {
    testDir: './e2e',
    timeout: 30000,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        video: 'on-first-retry',
    },
    projects: [
        {
            name: 'Desktop Chrome',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 13'] },
        },
    ],
}

export default config

// 2. Test Environment Setup (test-setup.ts)
import { test as base } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Custom test fixture
export const test = base.extend({
    supabase: async ({}, use) => {
        const client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )
        await use(client)
    },
    authenticatedPage: async ({ page }, use) => {
        // Setup auth state
        await page.goto('/auth')
        await page.fill('[data-test-id=email]', 'test@example.com')
        await page.fill('[data-test-id=password]', 'password123')
        await page.click('[data-test-id=submit]')
        await page.waitForURL('/')
        await use(page)
    },
})

// 3. Example Feature Test
test.describe('Entity Feature', () => {
    test.beforeEach(async ({ page }) => {
        // Reset database state
        await page.evaluate(() => window.localStorage.clear())
        await page.goto('/')
    })

    test('creates new entity', async ({ page }) => {
        await test.step('Navigate to create form', async () => {
            await page.click('[data-test-id=create-entity]')
            await page.waitForURL('/entity/new')
        })

        await test.step('Fill and submit form', async () => {
            await page.fill('[data-test-id=name]', 'Test Entity')
            await page.click('[data-test-id=submit]')
        })

        await test.step('Verify creation', async () => {
            await page.waitForURL('/entities')
            await expect(page.locator('text=Test Entity')).toBeVisible()
        })
    })

    test('handles errors gracefully', async ({ page }) => {
        test.slow() // Triple timeout for this test

        await test.step('Submit invalid data', async () => {
            await page.click('[data-test-id=create-entity]')
            await page.click('[data-test-id=submit]') // Without required fields
        })

        await test.step('Verify error message', async () => {
            await expect(page.locator('[data-test-id=error]')).toBeVisible()
            await expect(page.locator('[data-test-id=error]')).toContainText(
                'Required',
            )
        })
    })
})

// 4. Performance Testing
test('meets performance requirements', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/entities')

    // Time to interactive
    await page.waitForSelector('[data-test-id=entity-list]')
    const tti = Date.now() - startTime
    expect(tti).toBeLessThan(3000) // 3s threshold

    // Memory usage
    const metrics = await page.metrics()
    expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024) // 50MB threshold
})
```

## Test Data Management

1. Create test data factories:

```typescript
// test/factories/entity.ts
import { faker } from '@faker-js/faker'
import type { EntityRow } from '@/lib/schemas/entity'

export function generateMockEntity(override = {}): EntityRow {
    return {
        id: faker.string.uuid(),
        name: faker.company.name(),
        created_at: faker.date.recent().toISOString(),
        ...override,
    }
}
```

2. Database state management:

```typescript
// test/helpers/db.ts
import { createClient } from '@supabase/supabase-js'

export async function resetTestDatabase() {
    const supabase = createClient(
        process.env.TEST_SUPABASE_URL!,
        process.env.TEST_SUPABASE_KEY!,
    )

    await supabase.from('entities').delete().neq('id', 'test-constant')
}
```

## CI Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2
            - uses: actions/setup-node@v2
            - name: Install dependencies
              run: npm ci
            - name: Install Playwright
              run: npx playwright install --with-deps
            - name: Build app
              run: npm run build
            - name: Run tests
              run: npm run test:e2e
            - name: Upload test results
              if: always()
              uses: actions/upload-artifact@v2
              with:
                  name: playwright-report
                  path: playwright-report/
```
