import { SignupForm } from '@/components/auth/SignupForm'
import { AuthLeftPanel } from '@/components/auth/AuthLeftPanel'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — deep navy with checklist */}
      <AuthLeftPanel variant="signup" />

      {/* Right panel — white with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <SignupForm />
      </div>
    </div>
  )
}
