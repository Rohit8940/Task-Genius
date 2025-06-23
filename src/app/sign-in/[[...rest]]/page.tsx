'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to your external sign-in page
    window.location.href = 'https://golden-colt-97.accounts.dev/sign-in'
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to Golden Cult sign-in...</p>
    </div>
  )
}
