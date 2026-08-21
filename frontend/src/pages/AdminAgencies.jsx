import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState([]);
  const [formData, setFormData] = useState({ name: '', type: 'AMBULANCE', address: '', phone: '', email: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/api/agencies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAgencies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(import.meta.env.VITE_API_URL + '/api/agencies', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFormData({ name: '', type: 'AMBULANCE', address: '', phone: '', email: '' });
      fetchAgencies();
    } catch (err) {
      alert('Error creating agency');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-500">Agency Management</h1>
          <button onClick={() => navigate('/admin/command-center')} className="bg-gray-800 px-4 py-2 rounded">Back to Command</button>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Register New Agency</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Agency Name" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="bg-gray-700 p-2 rounded" />
            <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="bg-gray-700 p-2 rounded">
              <option value="AMBULANCE">Ambulance</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="POLICE">Police</option>
              <option value="FIRE">Fire & Rescue</option>
            </select>
            <input type="text" placeholder="Phone" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="bg-gray-700 p-2 rounded" />
            <input type="email" placeholder="Email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="bg-gray-700 p-2 rounded" />
            <button type="submit" className="bg-red-600 hover:bg-red-700 p-2 rounded col-span-1 md:col-span-2 font-bold">Register Agency</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agencies.map(agency => (
            <div key={agency.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="font-bold text-lg">{agency.name}</h3>
              <p className="text-sm text-gray-400 mb-2">{agency.type}</p>
              <p className="text-sm">Phone: {agency.phone || 'N/A'}</p>
              <p className="text-sm">Status: <span className={agency.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}>{agency.status}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
