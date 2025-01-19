import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const PORT = process.env.PORT || 3000
const baseURL = `http://localhost:${PORT}`

// Reference: https://playwright.dev/docs/test-configuration
export default defineConfig({
    timeout: 30 * 1000, // 30 seconds
    testDir: path.join(__dirname, 'tests'), // Test directory
    retries: 2, // If a test fails, retry it additional 2 times
    outputDir: 'test-results/', // Artifacts folder where screenshots, videos, and traces are stored.
    webServer: {
        command: 'npm run dev',
        url: baseURL,
        timeout: 120 * 1000, // 120 seconds
        reuseExistingServer: !process.env.CI, // Reuse existing server
    },

    use: {
        // Use baseURL so to make navigations relative.
        baseURL,

        // Retry a test if its failing with enabled tracing. This allows you to analyze the DOM, console logs, network traffic etc.
        // More information: https://playwright.dev/docs/trace-viewer
        trace: 'retry-with-trace',

        // All available context options: https://playwright.dev/docs/api/class-browser#browser-new-context
    },

    projects: [
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        {
            name: 'Desktop Chrome',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
        {
            name: 'Mobile Safari',
            use: devices['iPhone 12'],
        },
        // {
        //   name: 'Desktop Firefox',
        //   use: {
        //     ...devices['Desktop Firefox'],
        //   },
        // },
        // {
        //   name: 'Desktop Safari',
        //   use: {
        //     ...devices['Desktop Safari'],
        //   },
        // },
        // Test against mobile viewports.
        // {
        //     name: 'Mobile Chrome',
        //     use: {
        //         ...devices['Pixel 5'],
        //     },
        // },
    ],
})
