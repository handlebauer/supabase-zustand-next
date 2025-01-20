import { $ } from 'bun'
import { existsSync, writeFileSync, unlinkSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'

const LOCK_FILE = '.template/.setup-lock'

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

async function promptForEnvVars() {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    console.log('\n📝 Please provide the following environment variables:')
    console.log('(Press Enter to skip optional variables)\n')

    const vars: Record<string, string> = {}

    // Optional: OpenAI API Key for Supabase Studio AI features
    vars.OPENAI_API_KEY = await rl.question('OpenAI API Key (optional): ')

    // GitHub OAuth
    console.log('\nGitHub OAuth (Required for GitHub authentication):')
    vars.SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID =
        await rl.question('GitHub Client ID: ')
    vars.SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET = await rl.question(
        'GitHub Client Secret: ',
    )

    // Discord OAuth
    console.log('\nDiscord OAuth (Required for Discord authentication):')
    vars.SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID = await rl.question(
        'Discord Client ID: ',
    )
    vars.SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET = await rl.question(
        'Discord Client Secret: ',
    )

    rl.close()
    return vars
}

async function writeEnvFile(vars: Record<string, string>) {
    const envContent = Object.entries(vars)
        .filter(([_, value]) => value) // Only include non-empty values
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')

    await Bun.write('.env.local', envContent)
    console.log('\n✅ Environment variables written to .env.local')
}

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

    // Collect and write environment variables
    const envVars = await promptForEnvVars()
    await writeEnvFile(envVars)

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

    // Remove template section from .gitignore
    console.log('\n🧹 Cleaning up .gitignore...')
    try {
        const gitignore = await Bun.file('.gitignore').text()
        const cleanedGitignore = gitignore
            .split('\n')
            .filter(
                line =>
                    !line.includes('# template') &&
                    !line.includes('src/lib/supabase/types.ts') &&
                    !line.includes('supabase/.temp') &&
                    !line.includes('src/lib/utils.ts') &&
                    !line.includes('components.json') &&
                    !line.includes('.template') &&
                    !line.includes('!.template/install.ts') &&
                    !line.includes('tests/.auth/') &&
                    !line.includes('supabase/.branches'),
            )
            .join('\n')
        await Bun.write('.gitignore', cleanedGitignore)
    } catch (error) {
        console.error('\n❌ Error cleaning up .gitignore:', error)
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
