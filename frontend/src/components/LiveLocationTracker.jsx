import { useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function LiveLocationTracker() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user || (user.role !== 'driver' && user.role !== 'hospital_admin')) return;

    let watchId;
    const sendLocation = async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const token = localStorage.getItem('token');
        await axios.patch('http://localhost:5000/api/responders/location', {
          latitude, longitude
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to update location', err);
      }
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(sendLocation, (err) => {
        console.warn('Live tracking error:', err);
      }, {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 10000
      });
    }

    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user]);

  return null;
}
