import Link from 'next/link'

export function Brand({ children }: { children: React.ReactNode }) {
    return (
        <Link
            href="/dashboard"
            className="text-2xl font-bold hover:opacity-80 transition-opacity"
        >
            {children}
        </Link>
    )
}
