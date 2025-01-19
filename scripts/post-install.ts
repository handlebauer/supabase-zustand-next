import { $ } from 'bun'
import { existsSync, writeFileSync, unlinkSync } from 'node:fs'
import { rm } from 'node:fs/promises'

const LOCK_FILE = '.setup-lock-do-not-delete'

// Exit early if lock file exists (prevents recursive postinstall)
if (existsSync(LOCK_FILE)) {
    process.exit(0)
}

console.log('🚀 Setting up your project...')

const cleanup = async () => {
    if (existsSync(LOCK_FILE)) {
        unlinkSync(LOCK_FILE)
    }
    if (existsSync('./supabase')) {
        const configExists = existsSync('./supabase/config.toml')
        if (configExists) await $`mv ./supabase/config.toml ./config.toml.tmp`

        await rm('./supabase', { recursive: true, force: true })

        if (configExists) {
            await $`mkdir -p ./supabase && mv ./config.toml.tmp ./supabase/config.toml`
        }
    }
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Setup interrupted. Cleaning up...')
    await cleanup()
    process.exit(1)
})

try {
    // Create lock file to prevent recursive runs
    writeFileSync(LOCK_FILE, 'locked')

    // Check if Docker daemon is running
    console.log('🐳 Checking Docker daemon...')
    try {
        await $`docker info`.quiet()
    } catch (error) {
        console.error(
            '\n❌ Docker daemon is not running. Please start Docker Desktop and try again.',
        )
        throw error
    }

    // Check if Supabase is already initialized
    if (!existsSync('./supabase')) {
        console.log('📦 Initializing Supabase...')
        try {
            await $`bunx supabase init`
        } catch (error) {
            console.error('\n❌ Error initializing Supabase')
            throw error
        }
    } else {
        console.log('📦 Supabase already initialized, skipping setup...')
    }

    if (!existsSync('./supabase/.gitignore')) {
        // Start local development setup
        console.log('\n🚀 Starting local Supabase development setup...')
        try {
            await $`bunx supabase start`.quiet()
        } catch (error) {
            console.error('\n❌ Error starting local Supabase:', error)
            throw error
        }

        // Generate types from local instance
        console.log('\n📐 Generating TypeScript types from local instance...')
        try {
            await $`bun run supabase:gen-types`
        } catch (error) {
            console.error('\n❌ Error generating types:', error)
            throw error
        }
    } else {
        console.log('📦 Supabase already started, skipping setup...')
    }

    // Initialize shadcn
    console.log('\n🎨 Initializing shadcn/ui...')
    try {
        await $`bunx --bun shadcn@latest init -y`
    } catch (error) {
        console.error('\n❌ Error initializing shadcn:', error)
        throw error
    }

    console.log('\n✅ Project setup completed successfully!')
} catch (error) {
    console.error('\n❌ Final error:', error)
    cleanup()
    process.exit(1)
}

// Clean up lock file on successful completion
unlinkSync(LOCK_FILE)
