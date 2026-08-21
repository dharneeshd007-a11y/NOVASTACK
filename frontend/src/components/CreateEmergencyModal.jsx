import React, { useState } from 'react';
import axios from 'axios';

function CreateEmergencyModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    type: 'Medical',
    severity: 'MEDIUM',
    description: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let latitude = null;
    let longitude = null;

    try {
      if (navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }
    } catch (err) {
      console.warn("Geolocation denied or failed", err);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/emergencies', {
        ...formData,
        latitude,
        longitude
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create emergency');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Report Emergency</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-red-500 focus:border-red-500">
              <option>Medical</option>
              <option>Accident</option>
              <option>Fire</option>
              <option>Crime</option>
              <option>Natural Disaster</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Severity</label>
            <select name="severity" value={formData.severity} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-red-500 focus:border-red-500">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-red-500 focus:border-red-500" rows="3" required></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location/Address (Optional)</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="If GPS fails, enter here" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-red-500 focus:border-red-500" />
            <p className="text-xs text-gray-500 mt-1">Your exact GPS coordinates will be sent automatically if allowed.</p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer flex items-center justify-center min-w-[120px]">
              {loading ? 'Submitting...' : 'Submit Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEmergencyModal;
