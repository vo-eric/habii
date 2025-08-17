'use client';

import React, { useState } from 'react';
import { Button, Icon, useToast } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';

interface GoogleAuthButtonProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  isFullWidth?: boolean;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  text = 'Continue with Google',
  size = 'md',
  isFullWidth = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: 'Success!',
        description: 'Successfully signed in with Google.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
    } catch (error) {
      console.error('Google sign-in error:', error);

      let errorMessage = 'An error occurred during sign in.';

      if (error instanceof FirebaseError) {
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign in was cancelled.';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage =
            'Pop-up was blocked. Please allow pop-ups and try again.';
        } else if (
          error.code === 'auth/account-exists-with-different-credential'
        ) {
          errorMessage =
            'An account already exists with the same email address but different sign-in credentials.';
        }
      }

      toast({
        title: 'Sign In Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      w={isFullWidth ? 'full' : undefined}
      size={size}
      variant='outline'
      onClick={handleGoogleSignIn}
      isLoading={isLoading}
      loadingText='Signing in...'
      leftIcon={<Icon as={FcGoogle} />}
      borderColor='gray.300'
      _hover={{
        borderColor: 'gray.400',
        bg: 'gray.50',
      }}
      _active={{
        bg: 'gray.100',
      }}
    >
      {text}
    </Button>
  );
};
