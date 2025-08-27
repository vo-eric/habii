'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
} from '@chakra-ui/react';
import { useAuth } from '@/components/providers/AuthProvider';
import CreatureDisplay from '@/components/CreatureDisplay';

export default function Home() {
  const { user, userProfile, loading } = useAuth();

  // Temporarily bypass loading state for debugging
  if (loading) {
    console.log('Auth is loading, but showing content anyway for debugging');
    // return (
    //   <Box
    //     minH='calc(100vh - 80px)'
    //     display='flex'
    //     alignItems='center'
    //     justifyContent='center'
    //   >
    //     <Text>Loading...</Text>
    //   </Box>
    // );
  }

  if (!user) {
    console.log('No user, showing welcome screen');
    return (
      <Box
        h='100vh'
        w='100vw'
        display='flex'
        alignItems='center'
        justifyContent='center'
        overflow='hidden'
      >
        <Container maxW='container.md' textAlign='center'>
          <VStack spacing={8}>
            <VStack spacing={4}>
              <Heading size='2xl' color='brand.500'>
                Welcome to Habii
              </Heading>
              <Text fontSize='lg' color='gray.600'>
                Create and care for your digital creature companion
              </Text>
            </VStack>
            <VStack spacing={4}>
              <Button as='a' href='/auth/signup' colorScheme='brand' size='lg'>
                Get Started
              </Button>
              <Text fontSize='sm' color='gray.500'>
                Already have an account?{' '}
                <Button as='a' href='/auth/login' variant='ghost' size='sm'>
                  Sign in
                </Button>
              </Text>
            </VStack>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <main className='flex h-screen w-screen flex-col items-center justify-center overflow-hidden'>
      <CreatureDisplay />
    </main>
  );
}
