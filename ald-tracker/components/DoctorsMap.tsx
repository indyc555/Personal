'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default marker icon issue in Next.js
const fixLeafletIcons = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

interface Doctor {
  id: number;
  name: string;
  practice: string;
  address: string;
  phone: string;
  specialties: string;
  reputation_notes: string;
  lat: number;
  lng: number;
}

interface DoctorsMapProps {
  doctors: Doctor[];
}

export default function DoctorsMap({ doctors }: DoctorsMapProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const validDoctors = doctors.filter(d => d.lat && d.lng);
  const center: [number, number] = [29.7100, -95.4020]; // Houston TMC

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '400px', width: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validDoctors.map(doctor => (
        <Marker key={doctor.id} position={[doctor.lat, doctor.lng]}>
          <Popup>
            <div style={{ maxWidth: '220px' }}>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>{doctor.name}</strong>
              <span style={{ fontSize: '12px', color: '#6366f1', display: 'block', marginBottom: '4px' }}>{doctor.practice}</span>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>{doctor.address}</span>
              {doctor.phone && (
                <a href={`tel:${doctor.phone}`} style={{ fontSize: '11px', color: '#2563eb' }}>{doctor.phone}</a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
