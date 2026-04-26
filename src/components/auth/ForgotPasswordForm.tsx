'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, ChevronRight, ArrowLeft } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/**
 * ForgotPasswordForm — Centered card form
 * FOUNDATION.md Section 6.3
 */
export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    // TODO: Integrate with password reset API
    console.log('Reset email:', data)
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 1500)
  }

  return (
    <div className="w-full max-w-auth-card mx-auto bg-white rounded-card p-12 shadow-card">
      {/* Lock icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gold-light flex items-center justify-center">
          <Lock size={28} className="text-gold" strokeWidth={1.5} />
        </div>
      </div>

      {isSubmitted ? (
        /* Success state */
        <div className="text-center">
          <h2 className="text-h2 text-navy">Check your email</h2>
          <p className="text-body text-subtle mt-3">
            We&apos;ve sent a password reset link to{' '}
            <span className="font-semibold text-navy">{getValues('email')}</span>.
            Check your inbox and follow the instructions.
          </p>
          <Link href="/login" className="block mt-8">
            <Button variant="primary" className="w-full">
              Back to Sign In <ChevronRight size={14} />
            </Button>
          </Link>
        </div>
      ) : (
        /* Form state */
        <>
          <h2 className="text-h2 text-navy text-center">Reset your password</h2>
          <p className="text-body text-subtle text-center mt-3">
            Enter the email on your account. We&apos;ll send a reset link.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
            >
              SEND RESET LINK <ChevronRight size={14} />
            </Button>
          </form>
        </>
      )}

      {/* Back link */}
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 mt-6 text-body-sm font-medium text-subtle hover:text-navy transition-colors duration-150"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </Link>
    </div>
  )
}
