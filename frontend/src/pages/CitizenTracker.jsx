import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { MapPin, Navigation, CheckCircle2, ShieldAlert, Phone, ArrowLeft } from 'lucide-react';

export default function CitizenTracker({ emergencyId, onResolved }) {
  const { id: paramId } = useParams();
  const id = emergencyId || paramId;
  const navigate = useNavigate();
  
  const { socket } = useContext(SocketContext);
  const [emergency, setEmergency] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  const fetchEmergency = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + `/api/emergencies/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmergency(res.data);
      if (['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(res.data.status) && onResolved) {
        onResolved();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmergency();
    if (socket) {
      socket.emit('join_emergency', id);
      socket.on('emergency_updated', fetchEmergency);
      socket.on('nearest_ambulance_emergency', fetchEmergency);
      socket.on('driver:location', (data) => {
         setDriverLocation(data);
      });
    }
    return () => {
      if (socket) {
        socket.off('emergency_updated');
        socket.off('nearest_ambulance_emergency');
        socket.off('driver:location');
      }
    };
  }, [socket, id]);

  if (!emergency) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const steps = [
    'SEARCHING_AMBULANCE',
    'AMBULANCE_ASSIGNED',
    'DRIVER_ON_THE_WAY',
    'DRIVER_ARRIVED',
    'PATIENT_PICKED_UP',
    'ARRIVED_HOSPITAL'
  ];

  const currentStepIndex = steps.indexOf(emergency.status) >= 0 ? steps.indexOf(emergency.status) : 0;
  const progressPercent = Math.max(5, (currentStepIndex / (steps.length - 1)) * 100);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      
      {!emergencyId && (
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-brand-navy-light)] border border-white/5 p-6 rounded-2xl">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mr-4">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Active Emergency</h2>
            <p className="text-sm text-gray-400">ID: #EMG-{emergency.id}</p>
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-center">
          <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-0.5">Current Status</p>
          <p className="text-sm font-bold text-white">{(emergency.status || 'UNKNOWN').replace(/_/g, ' ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Timeline */}
        <div className="md:col-span-2 bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl p-6 md:p-8">
          <h3 className="font-bold text-lg text-white mb-8">Response Timeline</h3>
          
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800"></div>
            <div 
              className="absolute left-4 top-0 w-0.5 bg-red-500 transition-all duration-1000"
              style={{ height: `${progressPercent}%` }}
            ></div>

            <div className="space-y-8 relative z-10">
              {steps.map((stepName, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isFuture = index > currentStepIndex;
                
                return (
                  <div key={stepName} className={`flex items-center ${isFuture ? 'opacity-30' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-6 shrink-0 transition-colors ${
                      isCompleted ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 
                      isCurrent ? 'bg-red-500 border-4 border-[var(--color-brand-navy-light)] shadow-[0_0_0_2px_#ef4444] animate-pulse' : 
                      'bg-gray-800'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-white' : 'bg-transparent'}`}></div>}
                    </div>
                    <div>
                      <h4 className={`font-bold ${isCurrent ? 'text-white text-lg' : 'text-gray-400 text-sm'}`}>
                        {stepName.replace(/_/g, ' ')}
                      </h4>
                      {isCurrent && <p className="text-xs text-red-400 mt-1">We are updating this status in real-time.</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Info sidebar */}
        <div className="space-y-6">
          {currentStepIndex >= 1 && (
            <div className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center">
                <Navigation className="w-4 h-4 text-blue-500 mr-2" />
                Ambulance Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Driver ID</p>
                  <p className="text-sm font-medium text-white">{emergency.ambulance_driver_id || 'Waiting...'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Live Location</p>
                  {driverLocation ? (
                    <div className="flex items-center text-sm font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
                      Tracking Active
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Connecting to GPS...</p>
                  )}
                </div>
                <div>
                   <p className="text-xs text-gray-500 mb-1">Destination Hospital</p>
                   <p className="text-sm font-medium text-white">{emergency.hospital_id ? `Hospital #${emergency.hospital_id}` : 'Pending route'}</p>
                </div>
                
                <button className="w-full mt-2 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-sm font-medium transition-colors">
                  <Phone className="w-4 h-4 mr-2" /> Call Driver
                </button>
              </div>
            </div>
          )}

          <div className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Patient Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="text-sm font-medium text-white">{emergency.patient_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Emergency Type</p>
                <p className="text-sm font-medium text-white">{emergency.type}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
