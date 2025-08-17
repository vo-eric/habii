'use client';

import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Flex
      minH='100vh'
      align='center'
      justify='center'
      bg={bgColor}
      py={12}
      px={6}
    >
      <Container maxW='md'>
        <VStack spacing={8} align='stretch'>
          <VStack spacing={4} textAlign='center'>
            <Heading
              fontSize='3xl'
              fontWeight='bold'
              color={useColorModeValue('gray.900', 'white')}
            >
              {title}
            </Heading>
            <Text
              fontSize='lg'
              color={useColorModeValue('gray.600', 'gray.400')}
            >
              {subtitle}
            </Text>
          </VStack>

          <Box bg={cardBg} boxShadow='lg' borderRadius='xl' p={8}>
            {children}
          </Box>
        </VStack>
      </Container>
    </Flex>
  );
};
