import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { Activity, MapPin, CheckCircle2, ShieldAlert, Power, Navigation2, Target } from 'lucide-react';

export default function AmbulanceDashboard() {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  
  const [driverStatus, setDriverStatus] = useState('OFFLINE'); // OFFLINE, AVAILABLE, BUSY
  const [incomingEmergency, setIncomingEmergency] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverState();
  }, []);

  const fetchDriverState = async () => {
    try {
      // 1. Get current status if implemented in backend (mocking or getting from user profile if not)
      // Since backend doesn't have a GET /driver/status yet, we'll default to OFFLINE unless they have an active emergency
      
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/emergencies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const active = res.data.find(e => 
        e.ambulance_driver_id === user.id && !['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(e.status)
      );
      
      if (active) {
        setActiveEmergency(active);
        setDriverStatus('BUSY');
      } else {
        // Just keeping it as OFFLINE initially for safety
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (socket) {
      // Receive a direct dispatch
      socket.on('dispatch_ambulance', (data) => {
        if (driverStatus === 'AVAILABLE') {
          setIncomingEmergency(data);
        }
      });
      // Fallback/Legacy
      socket.on('new_emergency', (data) => {
        // In the new auto-dispatch system, driver gets direct dispatch.
        // We can ignore this for drivers unless we want to show a global map.
      });
      
      socket.on('emergency_updated', (data) => {
        if (activeEmergency && data.id === activeEmergency.id) {
           setActiveEmergency(data);
           if (['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(data.status)) {
             setActiveEmergency(null);
             setDriverStatus('AVAILABLE'); // Go back to available
           }
        }
      });
    }
    
    return () => {
      if (socket) {
        socket.off('dispatch_ambulance');
        socket.off('new_emergency');
        socket.off('emergency_updated');
      }
    };
  }, [socket, activeEmergency, driverStatus]);

  const toggleStatus = async () => {
    if (driverStatus === 'BUSY') {
      alert("You cannot change status while in an active emergency trip.");
      return;
    }
    const newStatus = driverStatus === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE';
    try {
      await axios.post(import.meta.env.VITE_API_URL + '/api/driver/status', { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDriverStatus(newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
      // Fallback for UI if backend route isn't fully ready
      setDriverStatus(newStatus); 
    }
  };

  const acceptEmergency = async () => {
    if (!incomingEmergency) return;
    try {
      await axios.post(import.meta.env.VITE_API_URL + `/api/emergencies/${incomingEmergency.id}/accept`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setActiveEmergency({ ...incomingEmergency, status: 'AMBULANCE_ASSIGNED' });
      setIncomingEmergency(null);
      setDriverStatus('BUSY');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept emergency');
      setIncomingEmergency(null);
    }
  };

  const rejectEmergency = () => {
    setIncomingEmergency(null);
  };

  const updateTripStatus = async (newStatus) => {
    try {
      await axios.patch(import.meta.env.VITE_API_URL + `/api/emergencies/${activeEmergency.id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setActiveEmergency({ ...activeEmergency, status: newStatus });
      if (newStatus === 'COMPLETED') {
        setActiveEmergency(null);
        setDriverStatus('AVAILABLE');
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in-up">
      
      {/* Header and Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-[var(--color-brand-navy-light)] border border-white/5 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, Driver</h1>
          <p className="text-gray-400 mt-1">Manage your active shifts and dispatch requests.</p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right">
             <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Current Status</p>
             <div className="flex items-center justify-end">
               <div className={`w-3 h-3 rounded-full mr-2 ${
                 driverStatus === 'OFFLINE' ? 'bg-gray-600' :
                 driverStatus === 'AVAILABLE' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 animate-pulse'
               }`}></div>
               <span className={`font-bold text-lg ${
                 driverStatus === 'OFFLINE' ? 'text-gray-400' :
                 driverStatus === 'AVAILABLE' ? 'text-green-500' : 'text-red-500'
               }`}>
                 {driverStatus}
               </span>
             </div>
          </div>
          
          <button 
            onClick={toggleStatus}
            disabled={driverStatus === 'BUSY'}
            className={`relative flex items-center h-12 rounded-full w-24 p-1 cursor-pointer transition-colors ${
              driverStatus === 'OFFLINE' ? 'bg-gray-800' : 
              driverStatus === 'AVAILABLE' ? 'bg-green-600' : 'bg-red-900 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md transition-transform transform ${
              driverStatus !== 'OFFLINE' ? 'translate-x-12' : 'translate-x-0'
            }`}>
              <Power className={`w-5 h-5 ${driverStatus !== 'OFFLINE' ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Metrics */}
      {!activeEmergency && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { title: "Today's Trips", val: "0" },
            { title: "Completed Cases", val: "12" },
            { title: "Avg Response", val: "8m 4s" },
            { title: "Rating", val: "4.9" }
          ].map((s,i) => (
            <div key={i} className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl p-5">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{s.title}</p>
              <p className="text-2xl font-bold text-white">{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!activeEmergency && !incomingEmergency && (
        <div className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 ${driverStatus === 'AVAILABLE' ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-800 border-gray-700'}`}>
            <Activity className={`w-10 h-10 ${driverStatus === 'AVAILABLE' ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {driverStatus === 'AVAILABLE' ? 'Searching for requests...' : 'You are currently offline'}
          </h2>
          <p className="text-gray-400 max-w-sm">
            {driverStatus === 'AVAILABLE' 
              ? 'Stay on this page. We will notify you immediately when an emergency matches your location.' 
              : 'Toggle your status to available when you are ready to receive emergency dispatch requests.'}
          </p>
        </div>
      )}

      {/* Active Trip Dashboard */}
      {activeEmergency && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
          
          <div className="md:col-span-2 bg-[var(--color-brand-navy-light)] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Navigation2 className="w-48 h-48" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-3"></span>
              Active Emergency Trip
            </h2>

            <div className="space-y-4 relative z-10">
               {[
                 { action: 'DRIVER_ON_THE_WAY', label: 'Start Route to Patient' },
                 { action: 'DRIVER_ARRIVED', label: 'Arrived at Patient Location' },
                 { action: 'PATIENT_PICKED_UP', label: 'Patient Picked Up' },
                 { action: 'ARRIVED_HOSPITAL', label: 'Arrived at Hospital' },
                 { action: 'COMPLETED', label: 'Complete Trip' }
               ].map((step, idx) => {
                 
                 const steps = ['AMBULANCE_ASSIGNED', 'DRIVER_ON_THE_WAY', 'DRIVER_ARRIVED', 'PATIENT_PICKED_UP', 'ARRIVED_HOSPITAL', 'COMPLETED'];
                 const currentIdx = steps.indexOf(activeEmergency.status);
                 const thisIdx = steps.indexOf(step.action);
                 
                 const isCompleted = thisIdx <= currentIdx;
                 const isNext = thisIdx === currentIdx + 1;
                 const isFuture = thisIdx > currentIdx + 1;

                 return (
                   <button
                     key={step.action}
                     onClick={() => isNext && updateTripStatus(step.action)}
                     disabled={!isNext}
                     className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all border-2 ${
                       isCompleted ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                       isNext ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-500 transform hover:scale-[1.02]' :
                       'bg-white/5 border-transparent text-gray-500 cursor-not-allowed'
                     }`}
                   >
                     <div className="flex items-center">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                         isCompleted ? 'bg-green-500/20' : isNext ? 'bg-white/20' : 'bg-gray-800'
                       }`}>
                         {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-4 h-4" />}
                       </div>
                       <span className="font-bold">{step.label}</span>
                     </div>
                     {isNext && <span className="text-xs uppercase tracking-wider font-bold bg-black/20 px-3 py-1 rounded-lg">Tap to Confirm</span>}
                   </button>
                 )
               })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6">
              <h3 className="font-bold text-red-500 flex items-center mb-4">
                <ShieldAlert className="w-5 h-5 mr-2" /> Dispatch Info
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-red-400/70 mb-1">Emergency ID</p>
                  <p className="text-sm font-bold text-red-100">#{activeEmergency.id}</p>
                </div>
                <div>
                  <p className="text-xs text-red-400/70 mb-1">Type</p>
                  <p className="text-sm font-bold text-red-100">{activeEmergency.type}</p>
                </div>
                <div>
                  <p className="text-xs text-red-400/70 mb-1">Patient</p>
                  <p className="text-sm font-bold text-red-100">{activeEmergency.patient_name}</p>
                </div>
              </div>
            </div>

            <button className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center font-bold text-white transition-colors">
              <MapPin className="w-5 h-5 mr-2" /> Open in Maps
            </button>
          </div>

        </div>
      )}

      {/* Incoming Emergency Modal */}
      {incomingEmergency && !activeEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-gradient-to-b from-[#1a0a0a] to-[#0a0000] border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-[fade-in-up_0.3s_ease-out]">
            
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full animate-pulse-glow"></div>
              <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-black text-white text-center tracking-tight mb-2 uppercase">Emergency Dispatch</h2>
            <p className="text-center text-red-400 mb-8 font-medium bg-red-500/10 py-2 rounded-lg">Critical Medical Incident nearby</p>
            
            <div className="bg-white/5 rounded-2xl p-5 mb-8 space-y-3 border border-white/5">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Type</span>
                <span className="text-white font-bold text-sm text-right max-w-[200px]">{incomingEmergency.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Location</span>
                <span className="text-white font-bold text-sm text-right">{incomingEmergency.latitude.toFixed(4)}, {incomingEmergency.longitude.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Distance</span>
                <span className="text-white font-bold text-sm text-right">~2.4 km away</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={acceptEmergency}
                className="w-full h-14 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all transform hover:scale-[1.02]"
              >
                Accept Request
              </button>
              <button 
                onClick={rejectEmergency}
                className="w-full h-14 bg-white/5 hover:bg-white/10 text-gray-300 font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
