'use client';

import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/styles/theme';
import { AuthProvider } from './AuthProvider';
import { WebSocketProvider } from './WebSocketProvider';
import { Navigation } from '@/components/Navigation';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({
  children,
}) => {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <WebSocketProvider>
          <Navigation />
          {children}
        </WebSocketProvider>
      </AuthProvider>
    </ChakraProvider>
  );
};
