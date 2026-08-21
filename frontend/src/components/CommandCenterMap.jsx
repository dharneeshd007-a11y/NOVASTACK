import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

export default function CommandCenterMap({ emergencies, responders }) {
  // Center roughly on first emergency or default
  const centerLat = emergencies[0]?.latitude || responders[0]?.last_latitude || 0;
  const centerLon = emergencies[0]?.longitude || responders[0]?.last_longitude || 0;

  if (centerLat === 0 && centerLon === 0) {
    return <div className="h-full w-full bg-gray-800 flex items-center justify-center text-gray-500 rounded border border-gray-700">Waiting for location data...</div>;
  }

  return (
    <div className="h-full w-full rounded border border-gray-700 overflow-hidden shadow-inner z-0 relative">
      <MapContainer 
        center={[centerLat, centerLon]} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 1, backgroundColor: '#1f2937' }}
      >
        <TileLayer
          attribution='&copy; OSM'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark"
        />
        
        {emergencies.map(e => {
          if (!e.latitude || !e.longitude) return null;
          return (
            <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]} icon={redIcon}>
              <Popup>
                <div className="text-gray-900">
                  <strong>{e.type}</strong> ({e.severity})<br/>
                  Status: {e.status}<br/>
                  Reported: {new Date(e.created_at).toLocaleTimeString()}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {responders.map(r => {
          if (!r.last_latitude || !r.last_longitude) return null;
          return (
            <Marker key={`r-${r.id}`} position={[r.last_latitude, r.last_longitude]} icon={blueIcon}>
              <Popup>
                <div className="text-gray-900">
                  <strong>{r.name}</strong><br/>
                  Role: {r.role}<br/>
                  Status: {r.availability}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Quick CSS hack for dark mode tiles since we don't have a dark map provider configured */}
      <style>{`
        .map-tiles-dark {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
    </div>
  );
}
