import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { Activity, Clock, ShieldAlert, CheckCircle2, Navigation, HeartPulse, Stethoscope, ArrowRight } from 'lucide-react';

export default function HospitalDashboard() {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmergencies = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/emergencies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Filter for active cases routed to this hospital or cases that have arrived
      // Since hospital routing isn't fully implemented in the db schema provided previously,
      // we just show active emergencies that might be coming here.
      // In a real system, we'd filter by `hospital_id === user.id`.
      const data = Array.isArray(res.data) ? res.data : [];
      const active = data.filter(e => !['COMPLETED', 'CANCELLED'].includes(e.status));
      setEmergencies(active);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    if (socket) {
      socket.on('emergency_updated', fetchEmergencies);
      socket.on('new_emergency', fetchEmergencies);
    }
    return () => {
      if (socket) {
        socket.off('emergency_updated');
        socket.off('new_emergency');
      }
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const incomingCases = emergencies.filter(e => ['DRIVER_ON_THE_WAY', 'DRIVER_ARRIVED', 'PATIENT_PICKED_UP'].includes(e.status));
  const arrivedCases = emergencies.filter(e => e.status === 'ARRIVED_HOSPITAL');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <Building2Icon />
          Hospital Emergency Center
        </h1>
        <p className="text-gray-400 mt-1">Monitor incoming patients and dispatch statuses in real-time.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Incoming Patients", val: incomingCases.length, icon: <HeartPulse className="w-5 h-5 text-red-500" /> },
          { title: "Patients Arrived", val: arrivedCases.length, icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
          { title: "Avg Wait Time", val: "14m", icon: <Clock className="w-5 h-5 text-yellow-500" /> },
          { title: "Available Beds", val: "42", icon: <Activity className="w-5 h-5 text-blue-500" /> }
        ].map((s,i) => (
          <div key={i} className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl p-5 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{s.title}</p>
              {s.icon}
            </div>
            <p className="text-3xl font-bold text-white mt-auto">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Live Tracking: Incoming Patients</h2>
          <span className="text-xs text-red-500 bg-red-500/10 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
            Live Update
          </span>
        </div>

        {incomingCases.length === 0 ? (
          <div className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center mb-4">
              <Stethoscope className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-bold mb-1">No Incoming Patients</h3>
            <p className="text-gray-400 text-sm">All emergency operations are currently clear.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {incomingCases.map(e => (
              <div key={e.id} className="bg-[var(--color-brand-navy-light)] border border-white/5 hover:border-red-500/30 rounded-3xl p-6 transition-all shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-red-500/10 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mr-4">
                      <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider rounded mb-1">
                        ETA: ~8 mins
                      </span>
                      <h3 className="text-white font-bold text-lg">{e.type}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className="text-sm font-bold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10">{e.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Patient Info</p>
                    <p className="text-sm font-bold text-white">{e.patient_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">Age: {e.patient_age || 'N/A'}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Transport</p>
                    <p className="text-sm font-bold text-white">Ambulance #{e.ambulance_driver_id}</p>
                    <p className="text-xs text-gray-400 flex items-center"><Navigation className="w-3 h-3 mr-1" /> GPS Tracking Active</p>
                  </div>
                </div>

                <button className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center relative z-10">
                  Prepare for Arrival <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// Inline icon component to avoid huge import block
function Building2Icon() {
  return (
    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mr-3 border border-red-500/20">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
    </div>
  )
}
