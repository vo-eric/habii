'use client';

import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupForm } from '@/components/auth/SignupForm';
import { useRedirectIfAuthenticated } from '@/lib/auth';

export default function SignupPage() {
  // Redirect to home if already authenticated
  useRedirectIfAuthenticated();

  return (
    <AuthLayout
      title='Join Habii'
      subtitle='Create your account and start your journey with digital creatures'
    >
      <SignupForm />
    </AuthLayout>
  );
}
