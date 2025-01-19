import { $ } from 'bun'
import { existsSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import prompt from 'prompt-sync'

const LOCK_FILE = '.setup-lock-do-not-delete'

// Exit early if lock file exists (prevents recursive postinstall)
if (existsSync(LOCK_FILE)) {
    process.exit(0)
}

const promptUser = prompt({ sigint: true })

console.log('🚀 Setting up your project...')

try {
    // Create lock file to prevent recursive runs
    writeFileSync(LOCK_FILE, 'locked')

    // Check if Supabase is already initialized
    if (!existsSync('./supabase')) {
        console.log('📦 Initializing Supabase...')
        try {
            await $`bunx supabase init`
        } catch (error) {
            console.error('\n❌ Error initializing Supabase:', error)
            throw error
        }

        const projectRef = promptUser('Supabase Project ID: ')

        if (!projectRef) {
            throw new Error('Project ID is required')
        }

        // Link the project
        console.log('\n🔗 Linking Supabase project...')
        try {
            await $`bunx supabase link --project-ref ${projectRef}`
        } catch (error) {
            console.error('\n❌ Error linking project:', error)
            throw error
        }

        // Generate types
        console.log('\n📐 Generating TypeScript types...')
        try {
            await $`bunx supabase gen types typescript --linked > src/lib/supabase/types.ts`
        } catch (error) {
            console.error('\n❌ Error generating types:', error)
            throw error
        }
    } else {
        console.log('📦 Supabase already initialized, skipping setup...')
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
    if (existsSync('./supabase')) {
        await rm('./supabase', { recursive: true, force: true })
    }
    process.exit(1)
}
