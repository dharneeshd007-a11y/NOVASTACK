import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

export default function HospitalDashboard() {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [capacity, setCapacity] = useState({ emergency_beds: 0, icu_available: 0, general_beds: 0, capacity_status: 'AVAILABLE' });
  const [emergencies, setEmergencies] = useState([]);
  
  const fetchDashboardData = async () => {
    try {
      const capRes = await axios.get(import.meta.env.VITE_API_URL + '/api/hospitals/capacity', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (capRes.data.length > 0) setCapacity(capRes.data[0]);

      const emgRes = await axios.get(import.meta.env.VITE_API_URL + '/api/hospitals/emergencies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmergencies(emgRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (socket) {
      socket.on('hospital_emergency_accepted', fetchDashboardData);
      socket.on('patient_arrived_hospital', fetchDashboardData);
    }
    return () => {
      if (socket) {
        socket.off('hospital_emergency_accepted');
        socket.off('patient_arrived_hospital');
      }
    };
  }, [socket]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'reject') {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        await axios.post(import.meta.env.VITE_API_URL + `/api/hospitals/emergencies/${id}/reject`, { hospital_id: 1, reason }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(import.meta.env.VITE_API_URL + `/api/hospitals/emergencies/${id}/accept`, { hospital_id: 1 }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      fetchDashboardData();
    } catch (err) {
      alert(`Error trying to ${action} emergency`);
    }
  };

  const incoming = emergencies.filter(e => e.hospital_status !== 'ACCEPTED' && e.hospital_status !== 'REJECTED');
  const accepted = emergencies.filter(e => e.hospital_status === 'ACCEPTED');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-red-500 mb-6">Hospital Emergency Operations</h1>
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-yellow-500">
            <p className="text-gray-400 text-sm font-bold uppercase">Incoming</p>
            <p className="text-3xl font-bold">{incoming.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-400 text-sm font-bold uppercase">Accepted</p>
            <p className="text-3xl font-bold">{accepted.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-red-500">
            <p className="text-gray-400 text-sm font-bold uppercase">ICU Beds Available</p>
            <p className="text-3xl font-bold">{capacity.icu_available}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
            <p className="text-gray-400 text-sm font-bold uppercase">ER Status</p>
            <p className="text-2xl font-bold mt-1">{capacity.capacity_status}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed: Incoming */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold mb-4">Incoming Emergency Queue</h2>
            {incoming.length === 0 ? (
               <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-500">No pending emergencies</div>
            ) : incoming.map(emg => (
              <div key={emg.id} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase">{emg.severity} MEDICAL EMERGENCY</h3>
                    <p className="text-gray-400">Emergency #EMG-{emg.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${emg.severity === 'CRITICAL' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>
                    PRIORITY: {emg.severity}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-4">{emg.description || 'No description provided.'}</p>
                
                <div className="flex space-x-4">
                  <button onClick={() => handleAction(emg.id, 'accept')} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-bold text-white transition">Accept</button>
                  <button onClick={() => handleAction(emg.id, 'reject')} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded font-bold text-white transition">Reject</button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar: Active Arrivals */}
          <div className="space-y-4">
             <h2 className="text-2xl font-bold mb-4">Accepted / En Route</h2>
             {accepted.length === 0 ? (
               <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-500">No incoming arrivals</div>
             ) : accepted.map(emg => (
                <div key={emg.id} className="bg-gray-800 p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <p className="font-bold text-lg mb-1">#EMG-{emg.id}</p>
                  <p className="text-sm text-gray-400 mb-2">Ambulance assigned. ETA: Calculating...</p>
                  
                  <div className="bg-gray-900 p-3 rounded text-sm">
                    <p className="mb-1">✓ Emergency dept notified</p>
                    <p className="mb-1">✓ Bed preparation requested</p>
                    <p className="text-gray-600">◯ Waiting for ambulance arrival</p>
                  </div>
                </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
}
