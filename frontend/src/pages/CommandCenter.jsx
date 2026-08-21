import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import CommandCenterMap from '../components/CommandCenterMap';
import { useNavigate } from 'react-router-dom';

export default function CommandCenter() {
  const [state, setState] = useState({ emergencies: [], responders: [] });
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const fetchState = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/command-center', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setState(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => {
      fetchState();
    };

    socket.on('new_emergency', handleUpdate);
    socket.on('emergency_updated', handleUpdate);
    socket.on('responder_location_updated', handleUpdate);
    socket.on('analytics_updated', handleUpdate);

    return () => {
      socket.off('new_emergency', handleUpdate);
      socket.off('emergency_updated', handleUpdate);
      socket.off('responder_location_updated', handleUpdate);
      socket.off('analytics_updated', handleUpdate);
    };
  }, [socket]);

  const activeCount = state.emergencies.length;
  const criticalCount = state.emergencies.filter(e => e.severity === 'CRITICAL' || e.ai_priority_level === 'CRITICAL').length;
  const unassignedCount = state.emergencies.filter(e => !e.responder_id).length;
  const respondingCount = state.responders.filter(r => r.availability === 'BUSY').length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-red-500 uppercase tracking-widest flex items-center">
            <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
            Command Center
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded cursor-pointer transition">Exit to Dashboard</button>
        </div>
      </header>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-4 gap-1 bg-gray-800 border-b border-gray-700">
        <div className="p-3 text-center border-r border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Active</p>
          <p className="text-2xl font-bold text-blue-400">{activeCount}</p>
        </div>
        <div className="p-3 text-center border-r border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Critical Priority</p>
          <p className="text-2xl font-bold text-red-500 animate-pulse">{criticalCount}</p>
        </div>
        <div className="p-3 text-center border-r border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Unassigned</p>
          <p className="text-2xl font-bold text-yellow-500">{unassignedCount}</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Active Responders</p>
          <p className="text-2xl font-bold text-green-400">{respondingCount}</p>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Left: Emergency Queue */}
        <div className="w-1/4 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 bg-gray-700 border-b border-gray-600">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">Live Incident Queue</h2>
          </div>
          <div className="flex-grow overflow-y-auto p-2 space-y-2">
            {state.emergencies.map(e => (
              <div key={e.id} onClick={() => navigate(`/emergencies/${e.id}`)} className={`p-3 rounded cursor-pointer transition border-l-4 ${e.severity === 'CRITICAL' || e.ai_priority_level === 'CRITICAL' ? 'bg-red-900/20 border-red-500 hover:bg-red-900/40' : 'bg-gray-700/50 border-blue-500 hover:bg-gray-700'}`}>
                <div className="flex justify-between items-start">
                  <p className="font-bold text-sm text-gray-100">{e.type}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{e.status}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">{e.description}</p>
                <div className="mt-2 text-xs flex justify-between text-gray-500">
                  <span>#{e.id}</span>
                  <span>{e.responder_id ? `Assigned: ${e.responder_name}` : 'UNASSIGNED'}</span>
                </div>
              </div>
            ))}
            {state.emergencies.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">No active incidents.</div>
            )}
          </div>
        </div>

        {/* Center: Map */}
        <div className="w-2/4 bg-black relative">
          <CommandCenterMap emergencies={state.emergencies} responders={state.responders} />
        </div>

        {/* Right: Responders & Alerts */}
        <div className="w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-3 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">Fleet Status</h2>
          </div>
          <div className="flex-grow overflow-y-auto p-2 space-y-2">
            {state.responders.map(r => (
              <div key={r.id} className="p-2 bg-gray-700/30 rounded flex justify-between items-center border border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-200">{r.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{r.role}</p>
                </div>
                <div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    r.availability === 'AVAILABLE' ? 'text-green-400 bg-green-400/10' :
                    r.availability === 'BUSY' ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400 bg-gray-400/10'
                  }`}>
                    {r.availability}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-gray-700 border-t border-b border-gray-600">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-3">
             <button onClick={() => navigate('/admin/broadcast')} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded transition">
               Send System Broadcast
             </button>
             <button onClick={() => navigate('/admin/audit-logs')} className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded transition border border-gray-600">
               View Audit Logs
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
