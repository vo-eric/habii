'use client';

import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useRedirectIfAuthenticated } from '@/lib/auth';

export default function LoginPage() {
  // Redirect to home if already authenticated
  useRedirectIfAuthenticated();

  return (
    <AuthLayout
      title='Welcome back'
      subtitle='Sign in to your account to continue your journey with your digital creatures'
    >
      <LoginForm />
    </AuthLayout>
  );
}
