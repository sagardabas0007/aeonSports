'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function RealtimeBadge() {
  const [isConnected, setIsConnected] = useState(true);
  const [pulseVisible, setPulseVisible] = useState(false);

  useEffect(() => {
    // Listen for connection status changes
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Pulse animation every 3 seconds when connected
    const interval = setInterval(() => {
      if (isConnected) {
        setPulseVisible(true);
        setTimeout(() => setPulseVisible(false), 1000);
      }
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isConnected]);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full
          ${isConnected ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}
          backdrop-blur-sm
        `}
      >
        <div className="relative">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          {isConnected && pulseVisible && (
            <span className="absolute inset-0 animate-ping">
              <Wifi className="w-4 h-4 text-green-400" />
            </span>
          )}
        </div>
        <span
          className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}
        >
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
