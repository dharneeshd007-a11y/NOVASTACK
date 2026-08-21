import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';

export default function CitizenTracker() {
  const { id } = useParams();
  const { socket } = useContext(SocketContext);
  const [emergency, setEmergency] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  const fetchEmergency = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + `/api/emergencies/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmergency(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmergency();
    if (socket) {
      socket.emit('join_emergency', id);
      
      socket.on('emergency_updated', fetchEmergency);
      socket.on('nearest_ambulance_emergency', fetchEmergency);
      
      socket.on('driver:location', (data) => {
         setDriverLocation(data);
      });
    }
    return () => {
      if (socket) {
        socket.off('emergency_updated');
        socket.off('nearest_ambulance_emergency');
        socket.off('driver:location');
      }
    };
  }, [socket, id]);

  if (!emergency) return <div className="text-white text-center mt-20">Loading...</div>;

  const steps = [
    'SEARCHING_AMBULANCE',
    'AMBULANCE_ASSIGNED',
    'DRIVER_ON_THE_WAY',
    'DRIVER_ARRIVED',
    'PATIENT_PICKED_UP',
    'ARRIVED_HOSPITAL',
    'COMPLETED'
  ];

  const currentStepIndex = steps.indexOf(emergency.status) >= 0 ? steps.indexOf(emergency.status) : 0;
  const progressPercent = Math.max(5, (currentStepIndex / (steps.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Progress Card */}
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border-t-8 border-red-600">
          <h1 className="text-3xl font-bold text-center mb-1">Emergency Tracker</h1>
          <p className="text-center text-gray-400 mb-8 font-mono text-sm">#EMG-{emergency.id}</p>

          <div className="mb-8 relative">
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all duration-1000 ease-out relative" 
                style={{ width: \`\${progressPercent}%\` }}
              >
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[stripes_1s_linear_infinite]"></div>
              </div>
            </div>
            
            <p className="text-center mt-6 font-black text-xl text-red-400 uppercase tracking-widest animate-pulse">
              {emergency.status.replace(/_/g, ' ')}
            </p>
          </div>

          <div className="space-y-4">
             {steps.map((stepName, index) => {
               const isCompleted = index < currentStepIndex;
               const isCurrent = index === currentStepIndex;
               const isFuture = index > currentStepIndex;
               
               return (
                 <div key={stepName} className={\`flex items-center \${isFuture ? 'opacity-30' : ''}\`}>
                    <div className={\`w-8 h-8 rounded-full flex items-center justify-center mr-4 \${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}\`}>
                       {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <span className={\`font-bold \${isCurrent ? 'text-white text-lg' : 'text-gray-400'}\`}>
                       {stepName.replace(/_/g, ' ')}
                    </span>
                 </div>
               )
             })}
          </div>
        </div>

        {/* Driver Live Details Card */}
        {currentStepIndex >= 1 && currentStepIndex < 6 && (
          <div className="bg-gray-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center text-blue-400">
               <Navigation className="w-5 h-5 mr-2" />
               Ambulance Details
            </h2>
            <div className="space-y-3 text-sm">
               <div className="flex justify-between bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <span className="text-gray-400">Driver ID</span>
                  <span className="font-bold">{emergency.ambulance_driver_id}</span>
               </div>
               
               <div className="flex justify-between bg-gray-900 p-3 rounded-lg border border-gray-700 items-center">
                  <span className="text-gray-400 flex items-center">
                     <MapPin className="w-4 h-4 mr-1" /> Live Location
                  </span>
                  {driverLocation ? (
                    <span className="font-bold text-green-400 animate-pulse">
                      Updating... {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
                    </span>
                  ) : (
                    <span className="font-bold text-gray-500">Connecting to GPS...</span>
                  )}
               </div>
               
               <div className="flex justify-between bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <span className="text-gray-400">Destination</span>
                  <span className="font-bold">{emergency.hospital_id ? \`Hospital #\${emergency.hospital_id}\` : 'Pending Selection'}</span>
               </div>
            </div>
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: \`
        @keyframes stripes {
          0% { background-position: 1rem 0; }
          100% { background-position: 0 0; }
        }
      \`}} />
    </div>
  );
}
