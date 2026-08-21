import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Broadcasts() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('GENERAL');
  const [target, setTarget] = useState('ALL_USERS');
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/broadcasts', 
        { title, message, priority, target }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Broadcast sent successfully!');
      navigate('/admin/command-center');
    } catch (err) {
      alert('Failed to send broadcast');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-red-500">Send System Broadcast</h1>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Broadcast Title</label>
            <input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Message Body</label>
            <textarea required value={message} onChange={e=>setMessage(e.target.value)} rows="4" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Priority</label>
              <select value={priority} onChange={e=>setPriority(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                <option value="GENERAL">GENERAL</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="SAFETY">SAFETY</option>
                <option value="WEATHER">WEATHER</option>
                <option value="SYSTEM">SYSTEM</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Target Audience</label>
              <select value={target} onChange={e=>setTarget(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                <option value="ALL_USERS">All Users</option>
                <option value="RESPONDERS">Responders Only</option>
                <option value="ADMINS">Admins Only</option>
                <option value="ACTIVE_RESPONDERS">Active Responders Only</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={()=>navigate('/admin/command-center')} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 font-bold shadow-lg">Broadcast Now</button>
          </div>
        </form>
      </div>
    </div>
  );
}
