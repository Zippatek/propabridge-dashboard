'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight } from 'lucide-react'
import { signupSchema, type SignupFormData } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/**
 * SignupForm — Right panel form for the signup page
 * FOUNDATION.md Section 6.2
 */
export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    // TODO: Integrate with NextAuth / API
    console.log('Signup data:', data)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <h2 className="text-h2 text-navy">Create your account</h2>
      <p className="text-body text-subtle mt-2">
        Get started with Propabridge — zero fees, zero fake listings
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {/* Name row */}
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

        {/* Terms checkbox */}
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

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full"
        >
          CREATE ACCOUNT <ChevronRight size={14} />
        </Button>
      </form>

      {/* Sign in link */}
      <p className="mt-8 text-center text-body text-subtle">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-navy hover:text-action transition-colors duration-150"
        >
          Sign in →
        </Link>
      </p>
    </div>
  )
}
