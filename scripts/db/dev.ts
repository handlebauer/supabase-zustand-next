import { UserService } from '@/services/users'
import { ProfileService } from '@/services/profiles'

const User = new UserService()
const Profile = new ProfileService()

async function seed() {
    try {
        // Create admin user
        const admin = await User.create({
            email: 'admin@example.com',
            is_active: true,
        })

        await Profile.create({
            user_id: admin.id,
            full_name: 'Admin User',
            bio: 'System administrator',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        })

        // Create test users
        const users = await Promise.all([
            User.create({
                email: 'alice@example.com',
                is_active: true,
            }),
            User.create({
                email: 'bob@example.com',
                is_active: true,
            }),
            User.create({
                email: 'inactive@example.com',
                is_active: false,
            }),
        ])

        // Create profiles for active users
        await Promise.all([
            Profile.create({
                user_id: users[0].id,
                full_name: 'Alice Johnson',
                bio: 'Software Engineer',
                avatar_url:
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
            }),
            Profile.create({
                user_id: users[1].id,
                full_name: 'Bob Smith',
                bio: 'Product Designer',
                avatar_url:
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
            }),
        ])

        console.log('✅ Development seed data created successfully')
    } catch (error) {
        console.error('❌ Error seeding development data:', error)
        throw error
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    seed().catch(error => {
        console.error('Failed to seed development data:', error)
        process.exit(1)
    })
}
