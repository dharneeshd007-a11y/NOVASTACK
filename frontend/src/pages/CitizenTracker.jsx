import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';

export default function CitizenTracker() {
  const { id } = useParams();
  const { socket } = useContext(SocketContext);
  const [emergency, setEmergency] = useState(null);

  const fetchEmergency = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + `/api/emergencies/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmergency(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmergency();
    if (socket) {
      socket.on('emergency_updated', fetchEmergency);
      socket.on('nearest_ambulance_emergency', fetchEmergency);
    }
    return () => {
      if (socket) {
        socket.off('emergency_updated');
        socket.off('nearest_ambulance_emergency');
      }
    };
  }, [socket, id]);

  if (!emergency) return <div className="text-white text-center mt-20">Loading...</div>;

  const getProgressWidth = (status) => {
    switch (status) {
      case 'WAITING_FOR_AMBULANCE': return '10%';
      case 'AMBULANCE_ASSIGNED': return '25%';
      case 'EN_ROUTE_TO_CITIZEN': return '40%';
      case 'ARRIVED_AT_CITIZEN': return '55%';
      case 'PATIENT_PICKED_UP': return '70%';
      case 'HOSPITAL_SELECTED': return '80%';
      case 'EN_ROUTE_TO_HOSPITAL': return '90%';
      case 'ARRIVED_AT_HOSPITAL': return '95%';
      case 'COMPLETED': return '100%';
      default: return '5%';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-2">Emergency Tracker</h1>
        <p className="text-center text-gray-400 mb-8">ID: {emergency.id}</p>

        <div className="mb-8">
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-600 transition-all duration-1000 ease-out" 
              style={{ width: getProgressWidth(emergency.status) }}
            ></div>
          </div>
          <p className="text-center mt-4 font-bold text-lg text-red-400 uppercase tracking-widest animate-pulse">
            {emergency.status.replace(/_/g, ' ')}
          </p>
        </div>

        <div className="space-y-4 border-t border-gray-700 pt-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Severity</span>
            <span className="font-bold text-red-500">{emergency.severity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Type</span>
            <span className="font-bold">{emergency.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Assigned Driver ID</span>
            <span className="font-bold">{emergency.ambulance_driver_id || 'Searching...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Destination Hospital</span>
            <span className="font-bold">{emergency.hospital_id || 'Pending Pickup'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
