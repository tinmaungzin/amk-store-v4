'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = authSchema.extend({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
})

/**
 * Server action to handle user login.
 * @param formData - Form data containing email and password
 */
export async function login(formData: FormData) {
  const supabase = await createClient()

  // Validate input data
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validationResult = authSchema.safeParse(rawData)
  if (!validationResult.success) {
    redirect('/login?error=Invalid email or password')
  }

  const { email, password } = validationResult.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=Invalid email or password')
  }

  // Check if user needs to be redirected to a specific page
  const redirectTo = formData.get('redirectTo') as string
  revalidatePath('/', 'layout')
  
  if (redirectTo) {
    redirect(redirectTo)
  } else {
    redirect('/')
  }
}

/**
 * Server action to handle user signup.
 * @param formData - Form data containing email, password, and optional full name
 */
export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Validate input data
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
  }

  const validationResult = signupSchema.safeParse(rawData)
  if (!validationResult.success) {
    redirect('/login?error=Invalid signup data')
  }

  const { email, password, fullName } = validationResult.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      },
    },
  })

  if (error) {
    redirect('/login?error=Signup failed. Please try again.')
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to confirm your account')
}

/**
 * Server action to handle user logout.
 */
export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Server action to get the current authenticated user.
 * @returns User object or null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return user
}

/**
 * Server action to get the current user's profile including role.
 * @returns Profile object or null if not found
 */
export async function getUserProfile() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return null
  }

  return profile
} 