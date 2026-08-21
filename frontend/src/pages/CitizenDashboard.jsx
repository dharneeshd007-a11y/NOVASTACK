import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, MapPin, Loader2 } from 'lucide-react';

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'Medical Emergency',
    patient_name: '',
    patient_age: '',
    description: '',
    severity: 'HIGH'
  });

  const handleRequestAmbulanceClick = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
        setStep(2); // Move to form
      },
      (error) => {
        alert("Please allow location access to request an ambulance.");
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
       alert("Location is required");
       return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      const res = await axios.post(import.meta.env.VITE_API_URL + '/api/emergencies', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Redirect to tracker
      navigate(`/my-emergency/${res.data.emergencyId}`);
    } catch (err) {
      alert("Failed to submit emergency request.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      
      {step === 1 && (
        <div className="text-center max-w-lg w-full">
           <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <ShieldAlert className="w-12 h-12 text-red-500" />
           </div>
           
           <h1 className="text-4xl font-black text-white mb-4">Emergency Assistance</h1>
           <p className="text-gray-400 text-lg mb-12">Press the button below to instantly request the nearest available ambulance to your GPS location.</p>
           
           <button 
             onClick={handleRequestAmbulanceClick}
             disabled={loading}
             className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-2xl py-8 rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.4)] transition-transform transform hover:-translate-y-1 active:translate-y-1 flex items-center justify-center"
           >
             {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : '🚨 REQUEST AMBULANCE'}
           </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border-t-8 border-red-600">
           <h2 className="text-2xl font-bold text-white mb-2">Patient Details</h2>
           <p className="text-gray-400 text-sm mb-6 flex items-center">
             <MapPin className="w-4 h-4 mr-1 text-green-500" /> Location Captured
           </p>

           <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-1">Emergency Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg focus:border-red-500 focus:outline-none">
                   <option>Medical Emergency</option>
                   <option>Trauma / Accident</option>
                   <option>Cardiac Arrest</option>
                   <option>Respiratory Issue</option>
                   <option>Fire / Burn</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-1">Patient Name</label>
                <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} required placeholder="Full Name" className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg focus:border-red-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-1">Patient Age</label>
                <input type="number" name="patient_age" value={formData.patient_age} onChange={handleChange} required placeholder="Age" className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg focus:border-red-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-1">Brief Description (Optional)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Any specific details..." rows="3" className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg focus:border-red-500 focus:outline-none"></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-lg shadow-lg transition-transform transform hover:-translate-y-0.5 active:translate-y-0 mt-4 flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'SUBMIT REQUEST'}
              </button>
           </form>
        </div>
      )}

    </div>
  );
}
