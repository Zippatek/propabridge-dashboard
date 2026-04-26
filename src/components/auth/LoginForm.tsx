'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/**
 * LoginForm — Right panel form for the login page
 * FOUNDATION.md Section 6.1
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    // TODO: Integrate with NextAuth signIn
    console.log('Login data:', data)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <h2 className="text-h2 text-navy">Welcome back</h2>
      <p className="text-body text-subtle mt-2">
        Sign in to your Propabridge account
      </p>

      {/* Google OAuth */}
      <button
        type="button"
        className="w-full mt-8 flex items-center justify-center gap-3 px-4 py-3 rounded-button border-[1.5px] border-divider bg-white text-navy font-medium text-body hover:bg-beige transition-all duration-150"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-divider" />
        <span className="text-caption text-placeholder">or continue with email</span>
        <div className="flex-1 h-px bg-divider" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end mt-2">
            <Link
              href="/forgot-password"
              className="text-caption font-medium text-action hover:text-action-hover transition-colors duration-150"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full mt-2"
        >
          SIGN IN <ChevronRight size={14} />
        </Button>
      </form>

      {/* Sign up link */}
      <p className="mt-8 text-center text-body text-subtle">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold text-navy hover:text-action transition-colors duration-150"
        >
          Create one →
        </Link>
      </p>
    </div>
  )
}
