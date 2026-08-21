import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Bell } from 'lucide-react';

function NotificationBell() {
  const socket = useContext(SocketContext);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;
    
    const handleNotification = (notif) => {
      setNotifications(prev => [notif, ...prev]);
    };

    socket.on('notification', handleNotification);

    return () => socket.off('notification', handleNotification);
  }, [socket]);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
        <Bell size={24} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md overflow-hidden z-50 border border-gray-200">
          <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-gray-700 flex justify-between items-center">
            Notifications
            <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:underline cursor-pointer">Clear</button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No new notifications</div>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className="px-4 py-3 border-b text-sm text-gray-800 hover:bg-gray-50">
                  {n.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
