import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

export default function ConnectionStatus() {
  const socket = useContext(SocketContext);
  const [status, setStatus] = useState('connected'); // connected, reconnecting, offline

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('offline'));
    socket.on('connect_error', () => setStatus('reconnecting'));

    // Initial check
    if (!socket.connected) setStatus('offline');

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket]);

  if (status === 'connected') return null; // Hide when connected for cleaner UI

  return (
    <div className="fixed bottom-4 left-4 z-50 px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center transition-all bg-gray-900 text-white border border-gray-700">
      {status === 'reconnecting' && (
        <>
          <span className="h-3 w-3 bg-yellow-500 rounded-full animate-ping mr-2"></span>
          Reconnecting to servers...
        </>
      )}
      {status === 'offline' && (
        <>
          <span className="h-3 w-3 bg-red-500 rounded-full mr-2"></span>
          Offline - Check your connection
        </>
      )}
    </div>
  );
}
