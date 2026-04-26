import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-beige flex items-center justify-center px-6 py-12">
      {/* Mobile logo */}
      <div className="absolute top-8 left-8">
        <div className="text-h4">
          <span className="font-bold text-navy">PROPA</span>
          <span className="font-bold text-action">BRIDGE</span>
        </div>
      </div>

      <ForgotPasswordForm />
    </div>
  )
}
