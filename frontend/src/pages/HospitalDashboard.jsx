import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function HospitalDashboard() {
  const [capacity, setCapacity] = useState(null);
  const [formData, setFormData] = useState({ emergency_beds: 0, icu_available: 0, general_beds: 0, capacity_status: 'AVAILABLE' });

  useEffect(() => {
    fetchCapacity();
  }, []);

  const fetchCapacity = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/hospitals/capacity', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.length > 0) {
        setCapacity(res.data[0]);
        setFormData({
          emergency_beds: res.data[0].emergency_beds,
          icu_available: res.data[0].icu_available,
          general_beds: res.data[0].general_beds,
          capacity_status: res.data[0].capacity_status
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Assuming agency_id is tied to the logged-in hospital user (simplified for demo: using 1)
      const agencyId = capacity?.agency_id || 1; 
      await axios.patch(import.meta.env.VITE_API_URL + `/api/hospitals/${agencyId}/capacity`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Capacity updated successfully!');
      fetchCapacity();
    } catch (err) {
      alert('Error updating capacity');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-red-500 mb-6">Hospital Dashboard</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Update Bed Capacity</h2>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 mb-1">Emergency Beds</label>
              <input type="number" value={formData.emergency_beds} onChange={e=>setFormData({...formData, emergency_beds: parseInt(e.target.value)})} className="w-full bg-gray-700 p-2 rounded" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">ICU Availability</label>
              <input type="number" value={formData.icu_available} onChange={e=>setFormData({...formData, icu_available: parseInt(e.target.value)})} className="w-full bg-gray-700 p-2 rounded" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">General Beds</label>
              <input type="number" value={formData.general_beds} onChange={e=>setFormData({...formData, general_beds: parseInt(e.target.value)})} className="w-full bg-gray-700 p-2 rounded" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Overall Status</label>
              <select value={formData.capacity_status} onChange={e=>setFormData({...formData, capacity_status: e.target.value})} className="w-full bg-gray-700 p-2 rounded">
                <option value="AVAILABLE">Available</option>
                <option value="LIMITED">Limited</option>
                <option value="FULL">Full</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition">Update Capacity</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
