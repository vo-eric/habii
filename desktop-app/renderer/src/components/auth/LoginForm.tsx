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
  HStack,
  Divider,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginFormData } from '@/lib/auth';
import { useAuth } from '@/components/providers/AuthProvider';
import { GoogleAuthButton } from './GoogleAuthButton';
import { FirebaseError } from 'firebase/app';

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'An error occurred during sign in.';

      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'This account has been disabled.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed attempts. Please try again later.';
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

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your password'
                {...register('password')}
              />
              <InputRightElement>
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowPassword(!showPassword)}
                  variant='ghost'
                  size='sm'
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>

          <Button
            type='submit'
            colorScheme='brand'
            size='lg'
            isLoading={isLoading}
            loadingText='Signing in...'
          >
            Sign In
          </Button>
        </VStack>
      </form>

      <HStack>
        <Divider />
        <Text fontSize='sm' color='gray.500' whiteSpace='nowrap'>
          or continue with
        </Text>
        <Divider />
      </HStack>

      <GoogleAuthButton />

      <VStack spacing={2} pt={4}>
        <Text fontSize='sm' color='gray.600'>
          Don&apos;t have an account?{' '}
          <Link
            as={NextLink}
            href='/auth/signup'
            color='brand.500'
            fontWeight='medium'
          >
            Sign up
          </Link>
        </Text>
        <Link
          as={NextLink}
          href='/auth/reset-password'
          color='brand.500'
          fontSize='sm'
        >
          Forgot your password?
        </Link>
      </VStack>
    </VStack>
  );
};
