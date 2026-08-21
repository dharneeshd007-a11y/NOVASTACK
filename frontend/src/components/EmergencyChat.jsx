import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

export default function EmergencyChat({ emergencyId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const socket = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/emergencies/${emergencyId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
      } catch (err) {
        setError('Could not load messages.');
      }
    };
    fetchMessages();
  }, [emergencyId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_emergency_room', { emergency_id: emergencyId });

    socket.on('emergency_chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    socket.on('error', (err) => {
      if (err.message === 'Unauthorized to join this emergency room') {
         setError('You are not authorized to view this communication channel.');
      }
    });

    return () => {
      socket.off('emergency_chat_message');
      socket.off('error');
    };
  }, [socket, emergencyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/emergencies/${emergencyId}/messages`, {
        message: newMessage,
        message_type: 'TEXT'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded">{error}</div>;

  return (
    <div className="flex flex-col h-96 bg-gray-50 rounded border border-gray-200">
      <div className="p-3 bg-gray-100 border-b border-gray-200 font-bold text-gray-700">
        Emergency Communications
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.sender_id === user?.id ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-500 mb-1">{m.sender_name} ({m.sender_role})</span>
            <div className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md ${m.sender_id === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {m.message}
            </div>
            <span className="text-[10px] text-gray-400 mt-1">{new Date(m.created_at).toLocaleTimeString()}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 bg-white flex">
        <input 
          type="text" 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..." 
          className="flex-grow border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 cursor-pointer">Send</button>
      </form>
    </div>
  );
}
