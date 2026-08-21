import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { ShieldAlert, Activity, Navigation, Building2, CheckCircle, Search, MapPin, Check, X } from 'lucide-react';

export default function CommandCenter() {
  const { socket } = useContext(SocketContext);
  const [emergencies, setEmergencies] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [emRes, usersRes] = await Promise.all([
        axios.get(import.meta.env.VITE_API_URL + '/api/emergencies', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        // Assuming we fetch users to find drivers. If not, we just use a mock or standard endpoint
        axios.get(import.meta.env.VITE_API_URL + '/api/agencies/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).catch(() => ({ data: [] }))
      ]);
      
      setEmergencies(Array.isArray(emRes.data) ? emRes.data : []);
      const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];
      setDrivers(usersData.filter(u => u.role === 'ambulance_driver'));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('emergency_updated', fetchData);
      socket.on('new_emergency', fetchData);
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

  const activeEmergencies = emergencies.filter(e => !['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(e.status));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up">
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-gray-400 mt-1">Live monitoring and system administration.</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Active Emergencies", val: activeEmergencies.length, icon: <ShieldAlert className="w-5 h-5 text-red-500" /> },
          { title: "Available Ambulances", val: "12", icon: <Navigation className="w-5 h-5 text-green-500" /> },
          { title: "Busy Ambulances", val: "4", icon: <Navigation className="w-5 h-5 text-yellow-500" /> },
          { title: "Approved Hospitals", val: "8", icon: <Building2 className="w-5 h-5 text-blue-500" /> }
        ].map((s,i) => (
          <div key={i} className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl p-5 flex flex-col hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{s.title}</p>
              {s.icon}
            </div>
            <p className="text-3xl font-bold text-white mt-auto">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Live Operations */}
      <div className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl mb-8 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Activity className="w-5 h-5 text-red-500 mr-2 animate-pulse" />
            Live Emergency Operations
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search ID..." className="bg-white/5 border border-white/10 text-sm rounded-lg pl-9 pr-4 py-1.5 text-white focus:outline-none focus:border-red-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-xs uppercase tracking-wider text-gray-400 font-bold">
                <th className="p-4 pl-6">ID / Type</th>
                <th className="p-4">Citizen</th>
                <th className="p-4">Ambulance</th>
                <th className="p-4">Hospital</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeEmergencies.length > 0 ? activeEmergencies.map(e => (
                <tr key={e.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="font-bold text-white text-sm">#{e.id}</div>
                    <div className="text-xs text-gray-400">{e.type}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-300">{e.patient_name || 'Unknown'}</td>
                  <td className="p-4 text-sm text-gray-300">{e.ambulance_driver_id || <span className="text-gray-600">Pending</span>}</td>
                  <td className="p-4 text-sm text-gray-300">{e.hospital_id || <span className="text-gray-600">Pending</span>}</td>
                  <td className="p-4">
                    <span className="inline-block px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
                      {e.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-sm text-gray-500">
                    No active emergencies. System is clear.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Management */}
      <div className="bg-[var(--color-brand-navy-light)] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Ambulance Fleet Management</h2>
          <button className="text-sm font-bold text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 transition-colors">
            View All Drivers
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-xs uppercase tracking-wider text-gray-400 font-bold">
                <th className="p-4 pl-6">Driver Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Approval</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {drivers.length > 0 ? drivers.slice(0, 5).map(d => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                        <Navigation className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{d.name}</div>
                        <div className="text-xs text-gray-400">{d.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center text-xs font-bold text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-gray-600 mr-2"></div>
                      OFFLINE
                    </span>
                  </td>
                  <td className="p-4">
                     <span className="inline-block px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
                      Approved
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-sm text-gray-500">
                    No drivers found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
