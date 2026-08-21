import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import CreateEmergencyModal from '../components/CreateEmergencyModal';
import NotificationBell from '../components/NotificationBell';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [emergencies, setEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availability, setAvailability] = useState('OFFLINE');

  const isAdmin = user?.role === 'hospital_admin';
  const isDriver = user?.role === 'driver';
  const isResponder = isAdmin || isDriver;

  const fetchEmergencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/emergencies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmergencies(res.data);
    } catch (err) {
      console.error("Failed to fetch emergencies", err);
    }
  };

  const fetchResponders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/responders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResponders(res.data);
    } catch (err) {
      console.error("Failed to fetch responders", err);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    if (isAdmin) {
      fetchResponders();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('new_emergency', (emergency) => {
      setEmergencies(prev => [emergency, ...prev]);
    });
    
    socket.on('emergency_updated', (updated) => {
      setEmergencies(prev => prev.map(e => e.id === updated.id ? updated : e));
    });

    socket.on('responder_availability_changed', ({ responder_id, availability }) => {
      if (isAdmin) {
        setResponders(prev => prev.map(r => r.id === responder_id ? { ...r, availability } : r));
      }
    });
    
    socket.on('responder_location_updated', ({ responder_id, latitude, longitude }) => {
      if (isAdmin) {
        setResponders(prev => prev.map(r => r.id === responder_id ? { ...r, last_latitude: latitude, last_longitude: longitude } : r));
      }
    });

    socket.on('emergency_assigned', ({ emergency }) => {
       fetchEmergencies();
    });

    return () => {
      socket.off('new_emergency');
      socket.off('emergency_updated');
      socket.off('responder_availability_changed');
      socket.off('responder_location_updated');
      socket.off('emergency_assigned');
    };
  }, [socket, isAdmin]);

  const toggleAvailability = async (status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:5000/api/responders/status', { availability: status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailability(status);
    } catch (err) {
      console.error(err);
    }
  };

  const assignResponder = async (emergencyId, responderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/emergencies/${emergencyId}/assign`, { responder_id: responderId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Assigned successfully');
      fetchEmergencies();
      fetchResponders();
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getSeverityColor = (sev) => {
    switch(sev) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: emergencies.length,
    active: emergencies.filter(e => e.status !== 'RESOLVED').length,
    critical: emergencies.filter(e => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length,
    resolved: emergencies.filter(e => e.status === 'RESOLVED').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center space-x-6">
          <div className="text-xl font-bold text-red-600">EmergencyLink</div>
          {isAdmin && (
            <>
              <Link to="/history" className="text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer">
                Response History
              </Link>
              <Link to="/analytics" className="text-sm font-medium text-purple-600 hover:text-purple-900 cursor-pointer flex items-center">
                <span className="mr-1">✨</span> AI Analytics
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center space-x-6">
          {isResponder && (
             <div className="flex space-x-2 text-sm">
                <button onClick={() => toggleAvailability('AVAILABLE')} className={`px-2 py-1 rounded border ${availability === 'AVAILABLE' ? 'bg-green-500 text-white' : 'bg-white'}`}>Available</button>
                <button onClick={() => toggleAvailability('OFFLINE')} className={`px-2 py-1 rounded border ${availability === 'OFFLINE' ? 'bg-gray-500 text-white' : 'bg-white'}`}>Offline</button>
             </div>
          )}
          <NotificationBell />
          <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer border border-gray-300 px-3 py-1.5 rounded-md">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name} ({user?.role})</p>
          </div>
          <div>
            {user?.role === 'citizen' && (
              <button onClick={() => setIsModalOpen(true)} className="bg-red-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-red-700 cursor-pointer shadow-sm">
                + Report Emergency
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Active</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-red-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Critical</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.critical}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Resolved</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.resolved}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Emergency Queue</h2>
              </div>
              <ul className="divide-y divide-gray-200">
                {emergencies.map(e => (
                  <li key={e.id} className="p-6 hover:bg-gray-50 transition duration-150">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityColor(e.severity)}`}>
                            {e.severity}
                          </span>
                          <p className="text-sm font-bold text-red-600 truncate">{e.type}</p>
                          <span className="text-xs font-semibold px-2 py-1 bg-gray-200 rounded text-gray-700">{e.status}</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">{e.description}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {e.reporter_name && `Reported by ${e.reporter_name} • `}{new Date(e.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <button onClick={() => navigate(`/emergencies/${e.id}`)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium cursor-pointer px-3 py-1.5 border border-indigo-200 rounded hover:bg-indigo-50">
                          View Details
                        </button>
                        {isAdmin && e.status === 'ACTIVE' && (
                           <div className="flex space-x-2 mt-2">
                             <select id={`assign-${e.id}`} className="text-xs border rounded p-1">
                                <option value="">Assign to...</option>
                                {responders.filter(r => r.availability === 'AVAILABLE').map(r => (
                                  <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                                ))}
                             </select>
                             <button onClick={() => {
                               const select = document.getElementById(`assign-${e.id}`);
                               if(select.value) assignResponder(e.id, select.value);
                             }} className="text-xs bg-blue-600 text-white px-2 rounded hover:bg-blue-700 cursor-pointer">
                               Assign
                             </button>
                           </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
                {emergencies.length === 0 && (
                  <li className="p-8 text-center text-gray-500">No emergencies found.</li>
                )}
              </ul>
            </div>
          </div>

          {isAdmin && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-medium text-gray-900">Responders List</h2>
                </div>
                <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {responders.map(r => (
                    <li key={r.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{r.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{r.role}</p>
                      </div>
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          r.availability === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                          r.availability === 'BUSY' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {r.availability}
                        </span>
                      </div>
                    </li>
                  ))}
                  {responders.length === 0 && (
                    <li className="p-4 text-center text-gray-500 text-sm">No responders found.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <CreateEmergencyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={(newE) => setEmergencies([newE, ...emergencies])} 
      />
    </div>
  );
}

export default Dashboard;
