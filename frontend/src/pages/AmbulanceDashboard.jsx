import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';

export default function AmbulanceDashboard() {
  const { socket } = useContext(SocketContext);
  const [activeIncident, setActiveIncident] = useState(null);

  useEffect(() => {
    // Fetch current assignment (mocked for this specific dashboard view)
    const fetchAssignments = async () => {
      try {
        const res = await axios.get(import.meta.env.VITE_API_URL + '/api/emergencies', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const assigned = res.data.find(e => e.status === 'RESPONDING');
        if (assigned) setActiveIncident(assigned);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAssignments();

    if (socket) {
      socket.on('emergency_created', fetchAssignments);
      socket.on('emergency_updated', fetchAssignments);
    }
    return () => {
      if (socket) {
        socket.off('emergency_created', fetchAssignments);
        socket.off('emergency_updated', fetchAssignments);
      }
    };
  }, [socket]);

  const handleStatusUpdate = async (newStatus) => {
    if (!activeIncident) return;
    try {
      await axios.patch(import.meta.env.VITE_API_URL + `/api/emergencies/${activeIncident.id}/status`, 
        { status: newStatus === 'EN_ROUTE' ? 'RESPONDING' : 'RESOLVED' }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (newStatus === 'ARRIVED') {
        if (socket) socket.emit('patient_arrived_hospital', { emergency_id: activeIncident.id });
        setActiveIncident(null);
        alert('Patient marked as arrived at hospital!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-red-500 mb-6">Ambulance Dispatch Dashboard</h1>
        
        {activeIncident ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Active Dispatch: #{activeIncident.id}</h2>
                <span className="inline-block mt-2 px-3 py-1 bg-red-900 text-red-200 rounded-full text-sm font-bold">
                  {activeIncident.severity} PRIORITY
                </span>
              </div>
              <div className="text-right">
                <p className="text-gray-400">Status</p>
                <p className="text-xl font-bold text-yellow-500 animate-pulse">{activeIncident.status}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-400">Incident Type</p>
                <p className="font-bold">{activeIncident.type}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <p className="text-sm text-gray-400">Pickup Location</p>
                <p className="font-bold">{activeIncident.address || 'GPS Coordinates Provided'}</p>
              </div>
            </div>

            <div className="mt-6 flex space-x-4">
              <button onClick={() => handleStatusUpdate('EN_ROUTE')} className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold">Mark En Route</button>
              <button onClick={() => handleStatusUpdate('ARRIVED')} className="flex-1 bg-green-600 hover:bg-green-700 p-3 rounded font-bold">Mark Arrived</button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-12 rounded-lg shadow-lg text-center border border-gray-700">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-300">Unit Available</h2>
            <p className="text-gray-500 mt-2">Waiting for central dispatch assignment...</p>
          </div>
        )}
      </div>
    </div>
  );
}
