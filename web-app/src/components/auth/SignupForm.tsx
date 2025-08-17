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
import { signupSchema, type SignupFormData } from '@/lib/auth';
import { useAuth } from '@/components/providers/AuthProvider';
import { GoogleAuthButton } from './GoogleAuthButton';
import { FirebaseError } from 'firebase/app';

export const SignupForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.displayName);
      toast({
        title: 'Welcome to Habii!',
        description: 'Your account has been created successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
    } catch (error) {
      console.error('Signup error:', error);

      let errorMessage = 'An error occurred during sign up.';

      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage =
            'Password is too weak. Please choose a stronger password.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage =
            'Email sign-up is not enabled. Please contact support.';
        }
      }

      toast({
        title: 'Sign Up Failed',
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
          <FormControl isInvalid={!!errors.displayName}>
            <FormLabel>Display Name</FormLabel>
            <Input
              type='text'
              placeholder='Enter your display name'
              {...register('displayName')}
            />
            <FormErrorMessage>{errors.displayName?.message}</FormErrorMessage>
          </FormControl>

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

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm Password</FormLabel>
            <InputGroup>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='Confirm your password'
                {...register('confirmPassword')}
              />
              <InputRightElement>
                <IconButton
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  variant='ghost'
                  size='sm'
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>
              {errors.confirmPassword?.message}
            </FormErrorMessage>
          </FormControl>

          <Button
            type='submit'
            colorScheme='brand'
            size='lg'
            isLoading={isLoading}
            loadingText='Creating account...'
          >
            Create Account
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

      <GoogleAuthButton text='Sign up with Google' />

      <Text fontSize='sm' color='gray.600' textAlign='center' pt={4}>
        Already have an account?{' '}
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
  );
};
