import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Phone, ShieldCheck, Heart, Navigation } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

// Helper to create customized SVG div icons for Leaflet markers
const createCustomMarker = (bloodGroup, isAvailable) => {
  const bgColor = isAvailable ? '#C1123F' : '#64748B';
  const pulseClass = isAvailable ? 'animate-pulse' : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${bgColor}; box-shadow: 0 4px 12px rgba(193, 18, 63, 0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; border: 2.5px solid white;">
          ${bloodGroup}
        </div>
        <div style="position: absolute; bottom: -4px; width: 8px; height: 8px; background: ${bgColor}; transform: rotate(45deg);"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 38],
    popupAnchor: [0, -38],
  });
};

// Dynamic viewport controller to keep Leaflet synchronized with donors or center changes
function MapViewController({ center, zoom, donors }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const validDonors = donors.filter(
      (d) => d.lat != null && d.lng != null && !isNaN(d.lat) && !isNaN(d.lng)
    );

    if (validDonors.length === 1) {
      map.setView([validDonors[0].lat, validDonors[0].lng], 13, { animate: true });
    } else if (validDonors.length > 1) {
      const bounds = L.latLngBounds(validDonors.map((d) => [d.lat, d.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
    } else if (center && center[0] && center[1]) {
      map.setView(center, zoom || 12, { animate: true });
    }
  }, [center, zoom, donors, map]);

  return null;
}

export default function DonorMap({
  donors = [],
  center = [19.076, 72.8777], // Default Mumbai
  zoom = 12,
  onSelectDonor,
}) {
  return (
    <div className="w-full h-[520px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <MapViewController center={center} zoom={zoom} donors={donors} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {donors.map((donor) => {
          if (!donor.lat || !donor.lng) return null;

          return (
            <Marker
              key={donor.id}
              position={[donor.lat, donor.lng]}
              icon={createCustomMarker(donor.bloodGroup, donor.isAvailable)}
            >
              <Popup className="lifora-custom-popup">
                <div className="p-2 space-y-2 min-w-[200px] text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-[#172033]">
                      {donor.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#C1123F] text-white font-bold text-xs">
                      {donor.bloodGroup}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    {donor.area}, {donor.city}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-medium">
                      ~{donor.distanceKm} km away
                    </span>
                    <StatusBadge
                      status={donor.isAvailable ? 'Available' : 'Unavailable'}
                      type="availability"
                      size="sm"
                    />
                  </div>

                  {onSelectDonor && (
                    <button
                      type="button"
                      onClick={() => onSelectDonor(donor)}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg bg-[#C1123F] text-white text-xs font-bold hover:bg-[#9E0E32] transition-colors"
                    >
                      Connect with Donor
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-md text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#C1123F]" />
          <span className="font-semibold text-slate-700">Available Donor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#64748B]" />
          <span className="text-slate-500">Currently Unavailable</span>
        </div>
      </div>
    </div>
  );
}
