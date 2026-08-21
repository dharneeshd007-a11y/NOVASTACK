import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ResponderMap from '../components/ResponderMap';
import EmergencyChat from '../components/EmergencyChat';

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
        const res = await axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/emergencies/${id}`, {
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

  const handleAction = async (action, status = null) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/emergencies/${id}/${action}`;
      let data = {};
      if (action === 'response-status') {
        data = { status };
      }
      
      const res = await action === 'response-status' || action === 'status' 
        ? axios.patch(url, data, { headers: { Authorization: `Bearer ${token}` } })
        : axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
        
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to perform action');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!emergency) return null;

  const isResponder = user?.role === 'driver' || user?.role === 'hospital_admin';
  const response = emergency.response;
  
  // Fake responder coords for map demo if not tracked yet, otherwise we'd fetch them from responder profile
  const responderLat = null; 
  const responderLon = null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Emergency Details #{emergency.id}</h2>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-900 border px-3 py-1 rounded bg-white cursor-pointer">
            &larr; Back
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Type</p>
                <p className="text-lg font-bold text-red-600">{emergency.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">System Status</p>
                <p className="text-lg font-bold text-gray-900">{emergency.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Severity</p>
                <p className="text-lg font-bold text-gray-900">{emergency.severity}</p>
              </div>
              {emergency.ai_priority_level && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">AI Priority</p>
                  <p className={`text-lg font-bold ${emergency.ai_priority_level === 'CRITICAL' ? 'text-red-600' : 'text-orange-500'}`}>
                    {emergency.ai_priority_level} (Score: {emergency.ai_priority_score})
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 font-medium">Reported By</p>
                <p className="text-lg font-bold text-gray-900">{emergency.reporter_name || 'Anonymous'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Description</p>
              <div className="bg-gray-50 p-4 rounded border text-gray-800 text-sm">
                {emergency.description}
              </div>
            </div>

            {emergency.ai_recommendation && (
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1 flex items-center">
                   <span className="mr-1 text-yellow-500">✨</span> AI Recommendation
                </p>
                <div className="bg-purple-50 p-4 rounded border border-purple-200 text-purple-900 text-sm">
                  {emergency.ai_recommendation}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Response Assignment</p>
              <div className="bg-blue-50 p-4 rounded border border-blue-100 text-blue-900 text-sm">
                {response ? (
                  <>
                    <p><strong>Responder:</strong> {response.responder_name}</p>
                    <p><strong>Status:</strong> {response.status}</p>
                    <p className="text-xs mt-1 text-blue-700">Assigned: {new Date(response.assigned_at).toLocaleString()}</p>
                  </>
                ) : (
                  <p className="italic text-gray-500">No responder assigned yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-2">Live Map</p>
              <ResponderMap emergencyLat={emergency.latitude} emergencyLon={emergency.longitude} responderLat={responderLat} responderLon={responderLon} />
              {emergency.address && <p className="text-xs text-gray-500 mt-2 text-center">{emergency.address}</p>}
            </div>
            
            <div className="mt-8">
              <EmergencyChat emergencyId={emergency.id} />
            </div>
          </div>
        </div>

        {isResponder && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex space-x-3 justify-end">
            {!response && emergency.status === 'ACTIVE' && (
              <p className="text-sm text-gray-500 italic my-auto mr-4">Go to dashboard to assign this emergency.</p>
            )}
            
            {response && response.responder_id === user.id && response.status === 'ASSIGNED' && (
              <>
                <button onClick={() => handleAction('reject')} className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded font-medium hover:bg-red-200 cursor-pointer">Reject</button>
                <button onClick={() => handleAction('accept')} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 cursor-pointer">Accept</button>
              </>
            )}

            {response && response.responder_id === user.id && response.status === 'ACCEPTED' && (
              <button onClick={() => handleAction('response-status', 'RESPONDING')} className="bg-yellow-500 text-white px-4 py-2 rounded font-medium hover:bg-yellow-600 cursor-pointer">Start Responding</button>
            )}

            {response && response.responder_id === user.id && response.status === 'RESPONDING' && (
              <button onClick={() => handleAction('response-status', 'ARRIVED')} className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 cursor-pointer">Mark Arrived</button>
            )}

            {response && response.responder_id === user.id && response.status === 'ARRIVED' && (
              <button onClick={() => handleAction('response-status', 'RESOLVED')} className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 cursor-pointer">Resolve Emergency</button>
            )}
            
            {response && response.status === 'RESOLVED' && (
              <span className="text-green-600 font-bold px-4 py-2">Emergency Resolved ✓</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmergencyDetails;
