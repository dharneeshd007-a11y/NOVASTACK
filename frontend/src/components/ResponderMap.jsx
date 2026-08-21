import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ResponderMap({ emergencyLat, emergencyLon, responderLat, responderLon }) {
  const centerLat = emergencyLat || responderLat || 0;
  const centerLon = emergencyLon || responderLon || 0;

  if (!centerLat || !centerLon) {
    return <div className="bg-gray-100 p-8 text-center text-gray-500 rounded border">Map coordinates unavailable</div>;
  }

  const bounds = [];
  if (emergencyLat && emergencyLon) bounds.push([emergencyLat, emergencyLon]);
  if (responderLat && responderLon) bounds.push([responderLat, responderLon]);

  return (
    <div className="h-64 w-full rounded border overflow-hidden shadow-inner z-0 relative">
      <MapContainer 
        center={[centerLat, centerLon]} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        bounds={bounds.length > 1 ? bounds : undefined}
        boundsOptions={{ padding: [50, 50] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {emergencyLat && emergencyLon && (
          <Marker position={[emergencyLat, emergencyLon]} icon={redIcon}>
            <Popup>Emergency Location</Popup>
          </Marker>
        )}
        
        {responderLat && responderLon && (
          <Marker position={[responderLat, responderLon]}>
            <Popup>Responder Location</Popup>
          </Marker>
        )}

        {bounds.length === 2 && (
          <Polyline positions={bounds} color="blue" dashArray="5, 10" />
        )}
      </MapContainer>
    </div>
  );
}
