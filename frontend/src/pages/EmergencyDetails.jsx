import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function EmergencyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmergency = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/emergencies/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmergency(res.data);
      } catch (err) {
        setError('Failed to fetch emergency details or access denied');
      } finally {
        setLoading(false);
      }
    };
    fetchEmergency();
  }, [id]);

  const handleStatusUpdate = async (status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`http://localhost:5000/api/emergencies/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmergency(res.data);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!emergency) return null;

  const isResponder = user?.role === 'driver' || user?.role === 'hospital_admin';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Emergency Details #{emergency.id}</h2>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-900 border px-3 py-1 rounded bg-white cursor-pointer">
            &larr; Back
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Type</p>
              <p className="text-lg font-bold text-red-600">{emergency.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Status</p>
              <p className="text-lg font-bold text-gray-900">{emergency.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Severity</p>
              <p className="text-lg font-bold text-gray-900">{emergency.severity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Reported By</p>
              <p className="text-lg font-bold text-gray-900">{emergency.reporter_name || 'Anonymous'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Description</p>
            <div className="bg-gray-50 p-4 rounded border text-gray-800">
              {emergency.description}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Location</p>
            <div className="bg-gray-50 p-4 rounded border text-gray-800">
              {emergency.address ? (
                <p>{emergency.address}</p>
              ) : (
                <p>No address provided.</p>
              )}
              {emergency.latitude && emergency.longitude && (
                <p className="mt-2 text-sm text-blue-600">
                  <a href={`https://maps.google.com/?q=${emergency.latitude},${emergency.longitude}`} target="_blank" rel="noreferrer">
                    View on Maps ({emergency.latitude}, {emergency.longitude})
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Created: {new Date(emergency.created_at).toLocaleString()}
          </div>
        </div>

        {isResponder && emergency.status !== 'RESOLVED' && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex space-x-3 justify-end">
            {emergency.status === 'ACTIVE' && (
              <button onClick={() => handleStatusUpdate('ACKNOWLEDGED')} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 cursor-pointer">
                Acknowledge
              </button>
            )}
            {(emergency.status === 'ACTIVE' || emergency.status === 'ACKNOWLEDGED') && (
              <button onClick={() => handleStatusUpdate('RESPONDING')} className="bg-yellow-500 text-white px-4 py-2 rounded font-medium hover:bg-yellow-600 cursor-pointer">
                Start Responding
              </button>
            )}
            {emergency.status === 'RESPONDING' && (
              <button onClick={() => handleStatusUpdate('RESOLVED')} className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 cursor-pointer">
                Mark Resolved
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmergencyDetails;
