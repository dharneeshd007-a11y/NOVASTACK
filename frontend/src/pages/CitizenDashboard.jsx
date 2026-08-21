import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, ChevronRight, AlertTriangle, MapPin, Search } from 'lucide-react';
import CitizenTracker from './CitizenTracker'; // We will build/refactor this next

export default function CitizenDashboard() {
  const { user } = useContext(AuthContext);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/emergencies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const all = res.data;
      const active = all.find(e => !['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(e.status));
      setActiveEmergency(active || null);
      setHistory(all.filter(e => ['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(e.status)));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleEmergencyRequest = async () => {
    setRequesting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await axios.post(import.meta.env.VITE_API_URL + '/api/emergencies', {
              type: 'Medical Emergency',
              description: 'Requested via EmergencyLink Quick Request',
              severity: 'CRITICAL',
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              patient_name: user.name,
              patient_age: 30
            }, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShowConfirm(false);
            setActiveEmergency(res.data);
          } catch (err) {
            alert('Failed to request ambulance.');
          } finally {
            setRequesting(false);
          }
        },
        (error) => {
          alert("Location access is required to dispatch the nearest ambulance.");
          setRequesting(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If there's an active emergency, render the Tracking Interface inline
  if (activeEmergency) {
    return <CitizenTracker emergencyId={activeEmergency.id} onResolved={fetchDashboardData} />;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Good morning 👋</h1>
        <p className="text-gray-400 mt-2">How can we help you today, {user?.name.split(' ')[0]}?</p>
      </div>

      {/* Main Request Card */}
      <div className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 max-w-md w-full">
          <button 
            onClick={() => setShowConfirm(true)}
            className="w-full h-32 bg-red-600 hover:bg-red-500 text-white rounded-3xl flex flex-col items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(239,68,68,0.5)] group relative"
          >
            <div className="absolute inset-0 rounded-3xl animate-pulse-glow"></div>
            <Activity className="w-10 h-10 mb-2 group-hover:animate-bounce" />
            <span className="text-2xl font-black tracking-widest uppercase">Request Ambulance</span>
          </button>
          <p className="text-sm text-gray-400 mt-6 flex items-center justify-center">
            <MapPin className="w-4 h-4 mr-2" />
            Your location will be shared with the nearest available driver.
          </p>
        </div>
      </div>

      {/* Grid Layout for History and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* History */}
        <div className="md:col-span-2 bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-white">Recent Emergencies</h3>
            <button className="text-sm text-red-500 hover:text-red-400 font-medium">View all</button>
          </div>
          
          <div className="space-y-3">
            {history.length > 0 ? history.slice(0, 3).map(e => (
              <div key={e.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4">
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{e.type}</h4>
                    <p className="text-xs text-gray-500">{new Date(e.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {e.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500 text-sm bg-white/5 rounded-xl border border-white/5">
                No past emergencies found.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold text-lg text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {['Emergency History', 'Profile Settings', 'Help & Support'].map((action, i) => (
              <button key={i} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">{action}</span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[var(--color-brand-navy-light)] border border-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Confirm Request</h3>
            <p className="text-sm text-gray-400 text-center mb-8">
              This will instantly dispatch the nearest ambulance to your current GPS location. Are you sure?
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleEmergencyRequest}
                disabled={requesting}
                className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {requesting ? 'Dispatching...' : 'Yes, Dispatch Ambulance'}
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={requesting}
                className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
