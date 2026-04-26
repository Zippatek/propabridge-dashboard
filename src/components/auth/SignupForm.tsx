'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { signupSchema, type SignupFormData } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE ||
  'https://propabridge-api-gateway-480235407496.us-central1.run.app'

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      // 1. Register via the live backend
      const res = await fetch(`${BACKEND_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setServerError(body?.error || 'Registration failed. Please try again.')
        setIsLoading(false)
        return
      }

      // 2. Auto sign-in after successful registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      setIsLoading(false)

      if (signInResult?.error) {
        // Account created but auto-login failed — send them to login
        setSuccess(true)
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setServerError('Network error. Please check your connection and try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-[440px] mx-auto text-center">
        <CheckCircle2 size={48} className="text-verified mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="text-h3 text-navy">Account created!</h2>
        <p className="text-body text-subtle mt-2">Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <h2 className="text-h2 text-navy">Create your account</h2>
      <p className="text-body text-subtle mt-2">
        Get started with Propabridge — zero fees, zero fake listings
      </p>

      {serverError && (
        <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-button bg-danger-light border border-danger/20 text-danger text-body-sm">
          <AlertCircle size={16} strokeWidth={1.8} />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            type="text"
            placeholder="Aminu"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            type="text"
            placeholder="Ibrahim"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="WhatsApp number"
          type="tel"
          placeholder="08012345678"
          helperText="We'll send inspection updates via WhatsApp"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-0.5 w-5 h-5 rounded border-divider text-action focus:ring-action focus:ring-2 cursor-pointer"
            {...register('terms')}
          />
          <span className="text-body-sm text-subtle leading-snug">
            I agree to Propabridge&apos;s{' '}
            <Link href="#" className="text-action hover:text-action-hover font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-action hover:text-action-hover font-medium">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.terms && (
          <p className="text-caption text-danger -mt-3">{errors.terms.message}</p>
        )}

        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
          CREATE ACCOUNT <ChevronRight size={14} />
        </Button>
      </form>

      <p className="mt-8 text-center text-body text-subtle">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-navy hover:text-action transition-colors duration-150">
          Sign in →
        </Link>
      </p>
    </div>
  )
}
