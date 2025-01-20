import { Button } from '@/components/ui/button'
import { IconBrandGithub, IconBrandDiscord } from '@tabler/icons-react'
import { signInWithGitHub, signInWithDiscord } from '@/lib/auth'

export interface SocialButtonsProps {
    loading: boolean
    onStateChange: (loading: boolean) => void
}

export function SocialButtons({ loading, onStateChange }: SocialButtonsProps) {
    async function handleGitHub() {
        try {
            onStateChange(true)
            await signInWithGitHub()
        } catch (error) {
            console.error('GitHub login error:', error)
            onStateChange(false)
        }
    }

    async function handleDiscord() {
        try {
            onStateChange(true)
            await signInWithDiscord()
        } catch (error) {
            console.error('Discord login error:', error)
            onStateChange(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-xs uppercase text-muted-foreground">
                    Or continue with
                </span>
                <div className="h-px flex-1 bg-border"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGitHub}
                    disabled={loading}
                >
                    <IconBrandGithub className="mr-2 h-4 w-4" />
                    {loading ? '...' : 'GitHub'}
                </Button>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDiscord}
                    disabled={loading}
                >
                    <IconBrandDiscord className="mr-2 h-4 w-4" />
                    {loading ? '...' : 'Discord'}
                </Button>
            </div>
        </div>
    )
}
