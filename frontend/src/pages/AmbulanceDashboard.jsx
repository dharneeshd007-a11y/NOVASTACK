import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

export default function AmbulanceDashboard() {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  
  const [activeIncident, setActiveIncident] = useState(null);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    fetchHospitals();
    fetchCurrentAssignment();

    if (socket) {
      socket.on('nearest_ambulance_emergency', (data) => {
        setIncomingAlert(data.emergency);
      });
      socket.on('emergency_updated', fetchCurrentAssignment);
      socket.on('hospital_emergency_accepted', fetchCurrentAssignment);
    }
    return () => {
      if (socket) {
        socket.off('nearest_ambulance_emergency');
        socket.off('emergency_updated');
        socket.off('hospital_emergency_accepted');
      }
    };
  }, [socket]);

  const fetchHospitals = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/agencies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHospitals(res.data.filter(a => a.type === 'HOSPITAL'));
    } catch (e) { }
  };

  const fetchCurrentAssignment = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/emergencies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Find emergency assigned to this driver that isn't completed/resolved
      const assigned = res.data.find(e => 
        e.ambulance_driver_id === user.id && 
        !['COMPLETED', 'RESOLVED'].includes(e.status)
      );
      if (assigned) {
         setActiveIncident(assigned);
         setIncomingAlert(null);
      } else {
         setActiveIncident(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async () => {
    try {
      await axios.post(import.meta.env.VITE_API_URL + `/api/emergencies/${incomingAlert.id}/accept`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIncomingAlert(null);
      fetchCurrentAssignment();
    } catch (err) {
      alert('Failed to accept');
    }
  };

  const handleDecline = async () => {
    try {
      await axios.post(import.meta.env.VITE_API_URL + `/api/emergencies/${incomingAlert.id}/decline`, 
        { excluded_driver_ids: [user.id] }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setIncomingAlert(null);
    } catch (err) {
      alert('Failed to decline');
    }
  };

  const updateStatus = async (newStatus, hospitalId = null) => {
    try {
      const payload = { status: newStatus };
      if (hospitalId) payload.hospital_id = hospitalId;
      
      await axios.patch(import.meta.env.VITE_API_URL + `/api/emergencies/${activeIncident.id}/status`, 
        payload, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchCurrentAssignment();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-500">Ambulance Dashboard</h1>
          <div className="bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
             Status: <span className={activeIncident ? "text-yellow-500 font-bold" : "text-green-500 font-bold"}>
               {activeIncident ? 'BUSY' : 'AVAILABLE'}
             </span>
          </div>
        </div>

        {incomingAlert && !activeIncident && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
             <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md w-full border-t-8 border-red-600 animate-pulse">
                <h2 className="text-3xl font-black text-white text-center mb-4">🚨 NEW EMERGENCY</h2>
                <div className="space-y-2 mb-6">
                  <p className="text-xl text-center font-bold text-red-400">{incomingAlert.severity} PRIORITY</p>
                  <p className="text-gray-300 text-center">{incomingAlert.type}</p>
                </div>
                <div className="flex space-x-4">
                  <button onClick={handleAccept} className="flex-1 bg-green-600 hover:bg-green-700 p-4 rounded-lg font-bold text-xl shadow-lg">ACCEPT</button>
                  <button onClick={handleDecline} className="flex-1 bg-red-800 hover:bg-red-700 p-4 rounded-lg font-bold text-xl shadow-lg">DECLINE</button>
                </div>
             </div>
          </div>
        )}

        {activeIncident ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Active Run: #EMG-{activeIncident.id}</h2>
                <p className="text-gray-400 mt-1">{activeIncident.type} - {activeIncident.severity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Phase</p>
                <p className="text-xl font-bold text-blue-400">{activeIncident.status.replace(/_/g, ' ')}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {activeIncident.status === 'AMBULANCE_ASSIGNED' && (
                <button onClick={() => updateStatus('EN_ROUTE_TO_CITIZEN')} className="w-full bg-blue-600 p-4 rounded font-bold text-lg">Mark En Route to Citizen</button>
              )}
              
              {activeIncident.status === 'EN_ROUTE_TO_CITIZEN' && (
                <button onClick={() => updateStatus('ARRIVED_AT_CITIZEN')} className="w-full bg-blue-600 p-4 rounded font-bold text-lg">Mark Arrived at Citizen</button>
              )}
              
              {activeIncident.status === 'ARRIVED_AT_CITIZEN' && (
                <button onClick={() => updateStatus('PATIENT_PICKED_UP')} className="w-full bg-yellow-600 p-4 rounded font-bold text-lg">Mark Patient Picked Up</button>
              )}
              
              {activeIncident.status === 'PATIENT_PICKED_UP' && (
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="font-bold mb-4">Select Destination Hospital:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospitals.map(h => (
                      <button 
                        key={h.id} 
                        onClick={() => updateStatus('HOSPITAL_SELECTED', h.id)}
                        className="bg-gray-600 hover:bg-gray-500 p-3 rounded text-left transition"
                      >
                        <p className="font-bold">{h.name}</p>
                        <p className="text-xs text-gray-300">{h.address}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeIncident.status === 'HOSPITAL_SELECTED' && (
                <div className="w-full bg-gray-700 p-4 rounded font-bold text-lg text-center animate-pulse">
                  Waiting for Hospital to Accept...
                </div>
              )}

              {activeIncident.status === 'EN_ROUTE_TO_HOSPITAL' && (
                <button onClick={() => updateStatus('ARRIVED_AT_HOSPITAL')} className="w-full bg-green-600 hover:bg-green-700 p-4 rounded font-bold text-lg shadow-lg">Mark Arrived at Hospital</button>
              )}
              
              {activeIncident.status === 'ARRIVED_AT_HOSPITAL' && (
                <div className="w-full bg-gray-700 p-4 rounded font-bold text-lg text-center text-green-400">
                  Waiting for Hospital to Confirm Patient Handover...
                </div>
              )}
            </div>
            
          </div>
        ) : (
          <div className="bg-gray-800 p-12 rounded-lg text-center border border-gray-700">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-300">Standing By</h2>
            <p className="text-gray-500 mt-2">Waiting for automated dispatch assignment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
