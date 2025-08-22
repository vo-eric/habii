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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Habii</h1>
            <p className="text-gray-600">Loading your digital companion...</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({
  children,
}) => {
  return (
    <ChakraProvider theme={theme}>
      <ContextErrorBoundary>
        <AuthProvider>
          <WebSocketProvider>
            <Navigation />
            {children}
          </WebSocketProvider>
        </AuthProvider>
      </ContextErrorBoundary>
    </ChakraProvider>
  );
};
