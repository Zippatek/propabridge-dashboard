import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLeftPanel } from '@/components/auth/AuthLeftPanel'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — deep navy with aerial photo */}
      <AuthLeftPanel variant="login" />

      {/* Right panel — white with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <LoginForm />
      </div>
    </div>
  )
}
