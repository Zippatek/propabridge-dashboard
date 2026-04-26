import { z } from 'zod'

/**
 * PROPABRIDGE FORM VALIDATION SCHEMAS
 * FOUNDATION.md Section 11
 */

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    firstName: z.string().min(2, 'First name required'),
    lastName: z.string().min(2, 'Last name required'),
    email: z.string().email('Enter a valid email address'),
    phone: z
      .string()
      .regex(/^(\+234|0)[0-9]{10}$/, 'Enter a valid Nigerian number'),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type SignupFormData = z.infer<typeof signupSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
