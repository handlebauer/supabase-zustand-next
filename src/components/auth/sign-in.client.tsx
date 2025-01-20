'use client'

import { useState } from 'react'
import { MagicLinkForm } from './magic-link.client'
import { SocialButtons } from './social-buttons.client'

export function SignIn() {
    const [, setLoading] = useState(false)

    return (
        <>
            <MagicLinkForm onStateChange={setLoading} />
            <SocialButtons onStateChange={setLoading} />
        </>
    )
}
