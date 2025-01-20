'use client'

import { useState } from 'react'
import { MagicLinkForm } from './magic-link.client'
import { SocialButtons } from './social-buttons.client'

export function SignIn() {
    const [loading, setLoading] = useState(false)

    return (
        <>
            <MagicLinkForm onStateChange={setLoading} />
            <SocialButtons loading={loading} onStateChange={setLoading} />
        </>
    )
}
