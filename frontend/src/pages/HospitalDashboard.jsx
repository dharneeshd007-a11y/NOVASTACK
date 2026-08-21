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

      const emgRes = await axios.get(import.meta.env.VITE_API_URL + '/api/emergencies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Only get emergencies destined for this hospital
      // For simplified demo, assuming we just show ones where hospital_id is set
      const hospitalEmgs = emgRes.data.filter(e => e.hospital_id !== null && !['COMPLETED', 'RESOLVED'].includes(e.status));
      setEmergencies(hospitalEmgs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (socket) {
      socket.on('emergency_updated', fetchDashboardData);
    }
    return () => {
      if (socket) socket.off('emergency_updated');
    };
  }, [socket]);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(import.meta.env.VITE_API_URL + `/api/emergencies/${id}/status`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (newStatus === 'EN_ROUTE_TO_HOSPITAL' && socket) {
        socket.emit('hospital_emergency_accepted', { emergency_id: id });
      }
      fetchDashboardData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const incoming = emergencies.filter(e => e.status === 'HOSPITAL_SELECTED');
  const accepted = emergencies.filter(e => ['EN_ROUTE_TO_HOSPITAL', 'ARRIVED_AT_HOSPITAL'].includes(e.status));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-red-500 mb-6">Hospital Emergency Operations</h1>
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-yellow-500">
            <p className="text-gray-400 text-sm font-bold uppercase">Requests</p>
            <p className="text-3xl font-bold">{incoming.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-400 text-sm font-bold uppercase">En Route</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Main Feed: Incoming */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Incoming Requests</h2>
            {incoming.length === 0 ? (
               <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-500">No pending requests</div>
            ) : incoming.map(emg => (
              <div key={emg.id} className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase">{emg.severity} MEDICAL EMERGENCY</h3>
                    <p className="text-gray-400">Emergency #EMG-{emg.id}</p>
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-4">
                  <button onClick={() => updateStatus(emg.id, 'EN_ROUTE_TO_HOSPITAL')} className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-bold text-white">Accept & Prepare</button>
                  <button onClick={() => updateStatus(emg.id, 'PATIENT_PICKED_UP')} className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded font-bold text-white">Reject (No Capacity)</button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar: Active Arrivals */}
          <div className="space-y-4">
             <h2 className="text-2xl font-bold mb-4">En Route & Arrived</h2>
             {accepted.length === 0 ? (
               <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-500">No active incoming transports</div>
             ) : accepted.map(emg => (
                <div key={emg.id} className="bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex justify-between">
                     <p className="font-bold text-lg mb-1">#EMG-{emg.id}</p>
                     <p className="text-sm font-bold text-blue-400">{emg.status.replace(/_/g, ' ')}</p>
                  </div>
                  
                  {emg.status === 'ARRIVED_AT_HOSPITAL' && (
                     <button onClick={() => updateStatus(emg.id, 'COMPLETED')} className="w-full mt-4 bg-green-600 hover:bg-green-700 py-3 rounded font-bold text-white shadow">
                        Confirm Patient Arrived (Complete)
                     </button>
                  )}
                </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
}
