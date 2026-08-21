import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { Power, MapPin } from 'lucide-react';

export default function AmbulanceDashboard() {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  
  const [isOnline, setIsOnline] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [locationInterval, setLocationInterval] = useState(null);

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
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [socket]);

  // Start broadcasting location when active incident exists
  useEffect(() => {
    if (activeIncident && socket) {
      const interval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            socket.emit('driver:location', {
               emergency_id: activeIncident.id,
               driver_id: user.id,
               latitude: pos.coords.latitude,
               longitude: pos.coords.longitude
            });
          });
        }
      }, 5000);
      setLocationInterval(interval);
      return () => clearInterval(interval);
    } else if (locationInterval) {
      clearInterval(locationInterval);
      setLocationInterval(null);
    }
  }, [activeIncident, socket]);

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
    } catch (err) { }
  };

  const toggleStatus = async () => {
    try {
      const newStatus = isOnline ? 'OFFLINE' : 'ONLINE';
      
      let lat = null, lon = null;
      if (newStatus === 'ONLINE' && navigator.geolocation) {
         const pos = await new Promise((resolve) => navigator.geolocation.getCurrentPosition(resolve));
         lat = pos.coords.latitude;
         lon = pos.coords.longitude;
      }

      await axios.post(import.meta.env.VITE_API_URL + '/api/driver/status', {
        status: newStatus, latitude: lat, longitude: lon
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      
      setIsOnline(!isOnline);
    } catch (err) {
      alert('Failed to update status');
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-500">Ambulance Dashboard</h1>
          <button 
             onClick={toggleStatus}
             className={`flex items-center px-6 py-3 rounded-full font-bold shadow-lg transition-all ${isOnline ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
             <Power className="w-5 h-5 mr-2" />
             {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>

        {incomingAlert && !activeIncident && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
             <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border-t-8 border-red-600 animate-pulse">
                <h2 className="text-3xl font-black text-white text-center mb-6">🚨 EMERGENCY REQUEST</h2>
                <div className="space-y-4 mb-8 bg-gray-900 p-4 rounded-lg">
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Type</span>
                    <span className="font-bold text-red-400">{incomingAlert.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Patient</span>
                    <span className="font-bold">{incomingAlert.patient_name || 'Unknown'} (Age: {incomingAlert.patient_age || 'N/A'})</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-gray-400">Location</span>
                    <span className="font-bold flex items-center">
                       <MapPin className="w-4 h-4 mr-1 text-red-500"/> View Map
                    </span>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button onClick={handleAccept} className="flex-1 bg-green-600 hover:bg-green-700 p-4 rounded-lg font-bold text-xl shadow-lg">ACCEPT</button>
                  <button onClick={handleDecline} className="flex-1 bg-red-800 hover:bg-red-700 p-4 rounded-lg font-bold text-xl shadow-lg">REJECT</button>
                </div>
             </div>
          </div>
        )}

        {activeIncident ? (
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-6">
              <div>
                <h2 className="text-2xl font-bold">Active Trip: #EMG-{activeIncident.id}</h2>
                <p className="text-gray-400 mt-2 text-lg">Patient: {activeIncident.patient_name || 'Unknown'} (Age: {activeIncident.patient_age || 'N/A'})</p>
                <p className="text-gray-400">{activeIncident.type} - {activeIncident.severity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 uppercase font-bold tracking-widest">Status</p>
                <p className="text-xl font-bold text-blue-400 mt-1">{activeIncident.status.replace(/_/g, ' ')}</p>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              {activeIncident.status === 'AMBULANCE_ASSIGNED' && (
                <button onClick={() => updateStatus('DRIVER_ON_THE_WAY')} className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-lg font-bold text-xl shadow">Start Trip</button>
              )}
              
              {activeIncident.status === 'DRIVER_ON_THE_WAY' && (
                <button onClick={() => updateStatus('DRIVER_ARRIVED')} className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-lg font-bold text-xl shadow">Reached Patient</button>
              )}
              
              {activeIncident.status === 'DRIVER_ARRIVED' && (
                <button onClick={() => updateStatus('PATIENT_PICKED_UP')} className="w-full bg-yellow-600 hover:bg-yellow-500 p-5 rounded-lg font-bold text-xl shadow">Pick Up Patient</button>
              )}
              
              {activeIncident.status === 'PATIENT_PICKED_UP' && (
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="font-bold text-xl mb-4 text-gray-300">Select Destination Hospital</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospitals.map(h => (
                      <button 
                        key={h.id} 
                        onClick={() => updateStatus('HOSPITAL_SELECTED', h.id)}
                        className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-left transition border border-gray-600 hover:border-gray-500"
                      >
                        <p className="font-bold text-lg">{h.name}</p>
                        <p className="text-sm text-gray-400 mt-1">{h.address}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeIncident.status === 'HOSPITAL_SELECTED' && (
                <div className="w-full bg-gray-900 p-6 rounded-lg font-bold text-xl text-center text-yellow-500 animate-pulse border border-yellow-500/30">
                  Waiting for Hospital to Accept...
                </div>
              )}

              {activeIncident.status === 'EN_ROUTE_TO_HOSPITAL' && (
                <button onClick={() => updateStatus('ARRIVED_HOSPITAL')} className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-lg font-bold text-xl shadow-lg">Reached Hospital</button>
              )}
              
              {activeIncident.status === 'ARRIVED_HOSPITAL' && (
                <button onClick={() => updateStatus('COMPLETED')} className="w-full bg-green-600 hover:bg-green-500 p-5 rounded-lg font-bold text-xl shadow-lg">Complete Trip</button>
              )}
            </div>
            
          </div>
        ) : (
          <div className="bg-gray-800 p-16 rounded-xl text-center border border-gray-700">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${isOnline ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-500'}`}>
              <Power className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold text-gray-200">
               {isOnline ? 'Standing By' : 'Currently Offline'}
            </h2>
            <p className="text-gray-500 mt-3 text-lg">
               {isOnline ? 'Waiting for automated dispatch assignment.' : 'Toggle ONLINE to start receiving emergencies.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
