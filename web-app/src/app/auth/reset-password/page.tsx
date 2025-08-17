'use client';

import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  Text,
  Link,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/auth';
import { useAuth } from '@/components/providers/AuthProvider';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useRedirectIfAuthenticated } from '@/lib/auth';
import { FirebaseError } from 'firebase/app';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const toast = useToast();

  // Redirect to home if already authenticated
  useRedirectIfAuthenticated();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      toast({
        title: 'Reset Email Sent',
        description: 'Check your email for password reset instructions.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Reset password error:', error);

      let errorMessage = 'An error occurred while sending the reset email.';

      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Too many requests. Please try again later.';
        }
      }

      toast({
        title: 'Reset Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    const email = getValues('email');
    if (email) {
      onSubmit({ email });
    }
  };

  return (
    <AuthLayout
      title='Reset Password'
      subtitle="Enter your email address and we'll send you a link to reset your password"
    >
      {emailSent ? (
        <VStack spacing={6} align='stretch'>
          <Alert status='success' borderRadius='md'>
            <AlertIcon />
            <AlertDescription>
              Password reset email has been sent to your email address. Check
              your inbox and follow the instructions to reset your password.
            </AlertDescription>
          </Alert>

          <VStack spacing={4}>
            <Text fontSize='sm' color='gray.600' textAlign='center'>
              Didn&apos;t receive the email?
            </Text>
            <Button
              variant='outline'
              onClick={handleResendEmail}
              isLoading={isLoading}
              loadingText='Sending...'
            >
              Resend Email
            </Button>
          </VStack>

          <Text fontSize='sm' color='gray.600' textAlign='center'>
            Remember your password?{' '}
            <Link
              as={NextLink}
              href='/auth/login'
              color='brand.500'
              fontWeight='medium'
            >
              Sign in
            </Link>
          </Text>
        </VStack>
      ) : (
        <VStack spacing={6} align='stretch'>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4} align='stretch'>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type='email'
                  placeholder='Enter your email'
                  {...register('email')}
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <Button
                type='submit'
                colorScheme='brand'
                size='lg'
                isLoading={isLoading}
                loadingText='Sending...'
              >
                Send Reset Email
              </Button>
            </VStack>
          </form>

          <Text fontSize='sm' color='gray.600' textAlign='center'>
            Remember your password?{' '}
            <Link
              as={NextLink}
              href='/auth/login'
              color='brand.500'
              fontWeight='medium'
            >
              Sign in
            </Link>
          </Text>
        </VStack>
      )}
    </AuthLayout>
  );
}
