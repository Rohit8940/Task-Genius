'use client'

import { useEffect } from 'react'

export default function SignUpPage() {
  useEffect(() => {
    window.location.href = 'https://golden-colt-97.accounts.dev/sign-up'
  }, [])

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to Golden Cult sign-up...</p>
    </div>
  )
}
