'use client';

import { useWebSocket } from './providers/WebSocketProvider';
import { useState, useEffect } from 'react';

export default function WebSocketStatus() {
  const { connected, socket } = useWebSocket();
  const [showDetails, setShowDetails] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (socket) {
      socket.on('connect_error', (error) => {
        setLastError(error.message);
      });

      socket.on('connect', () => {
        setLastError(null);
      });
    }
  }, [socket]);

  const getStatusColor = () => {
    if (connected) return 'bg-green-500';
    if (socket && !connected) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (connected) return 'Connected';
    if (socket && !connected) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (connected) return '🟢';
    if (socket && !connected) return '🟡';
    return '🔴';
  };

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <div
        className={`${getStatusColor()} w-3 h-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-110`}
        onClick={() => setShowDetails(!showDetails)}
        title={`WebSocket: ${getStatusText()}`}
      />
      
      {showDetails && (
        <div className='absolute bottom-6 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-64 border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
              WebSocket Status
            </span>
            <span className='text-lg'>{getStatusIcon()}</span>
          </div>
          
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-600 dark:text-gray-400'>Status:</span>
              <span className={`font-medium ${
                connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {getStatusText()}
              </span>
            </div>
            
            {lastError && (
              <div className='flex justify-between'>
                <span className='text-gray-600 dark:text-gray-400'>Error:</span>
                <span className='text-red-600 text-xs max-w-32 truncate' title={lastError}>
                  {lastError}
                </span>
              </div>
            )}
            
            <div className='flex justify-between'>
              <span className='text-gray-600 dark:text-gray-400'>Socket ID:</span>
              <span className='text-gray-900 dark:text-gray-100 text-xs'>
                {socket?.id || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
