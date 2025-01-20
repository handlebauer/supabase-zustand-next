import { chromium, request, type FullConfig } from '@playwright/test'
import { readFile } from 'fs/promises'
import { mkdir } from 'fs/promises'
import { join } from 'path'

const TEST_EMAIL_ADDRESS = 'hello@hello.com'
const MAX_RETRY_ATTEMPTS = 10
const RETRY_DELAY_MS = 100
const AUTH_STATE_DIR = './tests/.auth'
const AUTH_STATE_PATH = join(AUTH_STATE_DIR, 'state.json')

interface InBucketMessage {
    id: string
    from: string
    to: string
    subject: string
    date: string
    body: {
        text: string
        html: string
    }
}

/**
 * Retrieves the login URL from the latest email in InBucket
 */
async function getLoginUrl(username: string) {
    const requestContext = await request.newContext()
    const messagesUrl = `${process.env.SUPABASE_INBUCKET_URL}/api/v1/mailbox/${username}`
    const items = (await requestContext
        .get(messagesUrl)
        .then(res => res.json())) as InBucketMessage[]

    if (!items?.length) {
        return null
    }

    // Get the latest message by ID (InBucket IDs are sequential)
    const latestMessage = items.reduce(
        (latest: InBucketMessage | null, current: InBucketMessage) => {
            if (!latest) return current
            // InBucket message IDs are in format "timestamp-uuid"
            const latestTimestamp = parseInt(latest.id.split('-')[0])
            const currentTimestamp = parseInt(current.id.split('-')[0])
            return currentTimestamp > latestTimestamp ? current : latest
        },
        null,
    )

    if (!latestMessage?.id) return null

    const messageUrl = `${messagesUrl}/${latestMessage.id}`
    const message = (await requestContext
        .get(messageUrl)
        .then(res => res.json())) as InBucketMessage

    // Extract URL from between parentheses after "Confirm your email address"
    const match = message.body.text.match(
        /Confirm your email address \( (.*?) \)/,
    )
    if (!match?.[1]) {
        console.log('No auth URL found in email')
        return null
    }

    const url = match[1].trim()
    console.log('Using URL:', url)
    return url
}

/**
 * Setup function for Playwright authentication
 * 1. Launches browser and navigates to login page
 * 2. Fills in test email and requests magic link
 * 3. Polls InBucket for the magic link email
 * 4. Uses the magic link to authenticate
 * 5. Saves the authentication state
 */
export default async function setup(config: FullConfig) {
    // Ensure auth state directory exists
    await mkdir(AUTH_STATE_DIR, { recursive: true })

    const browser = await chromium.launch()
    const page = await browser.newPage()

    try {
        // First check if we have a valid auth state
        try {
            const authState = JSON.parse(
                await readFile(AUTH_STATE_PATH, 'utf-8'),
            )

            if (authState?.cookies?.length > 0) {
                // Load the existing auth state
                await page.context().addCookies(authState.cookies)

                // Verify the auth state is still valid
                await page.goto(`${config.webServer?.url}/dashboard`)
                const currentUrl = page.url()
                if (!currentUrl.includes('/login')) {
                    console.log('Using existing auth state')
                    return
                }
            }
        } catch (_) {
            console.log('No valid auth state, proceeding with login')
            // No valid auth state, proceed with login
        }

        // Request magic link
        await page.goto(`${config.webServer?.url}/login`)
        await page.getByPlaceholder('user@example.com').fill(TEST_EMAIL_ADDRESS)
        await page.getByRole('button', { name: 'Send Magic Link' }).click()

        // Poll for magic link with increased delay
        let loginUrl = null
        for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
            console.log(
                `Attempt ${attempt + 1} of ${MAX_RETRY_ATTEMPTS} to get magic link`,
            )
            loginUrl = await getLoginUrl(TEST_EMAIL_ADDRESS)
            if (loginUrl) break
            await new Promise(resolve =>
                setTimeout(resolve, RETRY_DELAY_MS * 2),
            )
        }

        if (!loginUrl) {
            throw new Error(
                'Failed to retrieve magic link after maximum attempts',
            )
        }

        // Complete authentication
        await page.goto(loginUrl)

        // Wait for the auth callback to complete
        await page.waitForURL(
            (url: URL) => {
                console.log('Current URL:', url.toString())
                return (
                    url.pathname.includes('/dashboard') ||
                    (url.pathname.includes('/login') &&
                        url.search.includes('error'))
                )
            },
            { timeout: 10000 },
        )

        // Check if we got an error
        const currentUrl = page.url()
        if (currentUrl.includes('error')) {
            throw new Error(`Authentication failed: ${currentUrl}`)
        }

        // Save auth state
        const authState = await page.context().storageState()
        await Bun.write(AUTH_STATE_PATH, JSON.stringify(authState, null, 2))

        // Verify the saved state
        const savedState = await Bun.file(AUTH_STATE_PATH).json()
        if (!savedState?.cookies?.length) {
            throw new Error('Failed to save authentication state')
        }

        console.log('Authentication successful')
    } finally {
        await browser.close()
    }
}
