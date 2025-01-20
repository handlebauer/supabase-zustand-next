'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IconUserCircle } from '@tabler/icons-react'
import { signInAsDemoUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export interface DemoButtonProps {
    onStateChange: (loading: boolean) => void
}

export function DemoButton({ onStateChange }: DemoButtonProps) {
    const [demoLoading, setDemoLoading] = useState(false)
    const router = useRouter()

    async function handleDemoSignIn() {
        try {
            setDemoLoading(true)
            onStateChange(true)
            await signInAsDemoUser()
            router.push('/dashboard')
        } catch (error) {
            console.error('Demo login error:', error)
            setDemoLoading(false)
            onStateChange(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-xs uppercase text-muted-foreground">
                    Or try demo account
                </span>
                <div className="h-px flex-1 bg-border"></div>
            </div>
            {/* DEMO USER BUTTON - Remove this component in production */}
            <Button
                variant="outline"
                className="w-full bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950 dark:hover:bg-yellow-900"
                onClick={handleDemoSignIn}
                disabled={demoLoading}
            >
                <IconUserCircle className="mr-2 h-4 w-4" />
                {demoLoading ? '...' : 'Sign in as Demo User'}
            </Button>
        </div>
    )
}
