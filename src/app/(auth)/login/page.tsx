import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLeftPanel } from '@/components/auth/AuthLeftPanel'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — deep navy with aerial photo */}
      <AuthLeftPanel variant="login" />

      {/* Right panel — white with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
