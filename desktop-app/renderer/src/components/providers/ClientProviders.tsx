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

// Error boundary for context providers
class ContextErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Context provider error:', error, errorInfo);
  }
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({
  children,
}) => {
  return (
    <ChakraProvider theme={theme}>
      <ContextErrorBoundary>
        <AuthProvider>
          <WebSocketProvider>{children}</WebSocketProvider>
        </AuthProvider>
      </ContextErrorBoundary>
    </ChakraProvider>
  );
};
