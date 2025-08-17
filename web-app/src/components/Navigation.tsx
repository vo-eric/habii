'use client';

import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  HStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

export const Navigation: React.FC = () => {
  const { user, userProfile, logout, loading } = useAuth();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while signing out.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box bg={bg} borderBottom='1px' borderColor={borderColor} px={6} py={4}>
      <Flex
        justify='space-between'
        align='center'
        maxW='container.xl'
        mx='auto'
      >
        <NextLink href='/' passHref>
          <Heading size='lg' color='brand.500' cursor='pointer'>
            Habii
          </Heading>
        </NextLink>

        {!loading && (
          <HStack spacing={4}>
            {user ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  variant='ghost'
                  size='sm'
                >
                  <HStack spacing={2}>
                    <Avatar
                      size='sm'
                      src={userProfile?.photoURL || undefined}
                      name={userProfile?.displayName || user.email || 'User'}
                    />
                    <Text fontSize='sm' fontWeight='medium'>
                      {userProfile?.displayName || user.email}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem>Profile</MenuItem>
                  <MenuItem>Settings</MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={handleLogout} color='red.500'>
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <HStack spacing={2}>
                <Button
                  as={NextLink}
                  href='/auth/login'
                  variant='ghost'
                  size='sm'
                >
                  Sign In
                </Button>
                <Button
                  as={NextLink}
                  href='/auth/signup'
                  colorScheme='brand'
                  size='sm'
                >
                  Sign Up
                </Button>
              </HStack>
            )}
          </HStack>
        )}
      </Flex>
    </Box>
  );
};
