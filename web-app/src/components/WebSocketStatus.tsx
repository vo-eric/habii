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
      <div className='bg-white rounded-lg shadow-lg border p-3 max-w-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <span className='text-sm font-medium'>{getStatusText()}</span>
            <span className='text-lg'>{getStatusIcon()}</span>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className='text-gray-500 hover:text-gray-700 text-sm'
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>

        {showDetails && (
          <div className='mt-3 pt-3 border-t border-gray-200'>
            <div className='space-y-2 text-xs text-gray-600'>
              <div>
                <strong>Status:</strong> {getStatusText()}
              </div>
              <div>
                <strong>Socket ID:</strong> {socket?.id || 'Not connected'}
              </div>
              <div>
                <strong>Transport:</strong>{' '}
                {socket?.io?.engine?.transport?.name || 'Unknown'}
              </div>
              {lastError && (
                <div className='text-red-600'>
                  <strong>Last Error:</strong> {lastError}
                </div>
              )}
              <div className='text-xs text-gray-500'>
                {process.env.NODE_ENV === 'development' && (
                  <div>
                    <strong>Environment:</strong> Development
                  </div>
                )}
              </div>
            </div>

            {!connected && (
              <div className='mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs'>
                <strong>Troubleshooting:</strong>
                <ul className='mt-1 space-y-1'>
                  <li>• Check if WebSocket server is running</li>
                  <li>• Verify environment variables are set</li>
                  <li>• Check browser console for errors</li>
                  <li>• Ensure CORS is properly configured</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
