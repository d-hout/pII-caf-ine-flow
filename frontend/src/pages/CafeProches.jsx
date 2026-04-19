import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '../components/Navbar';

import markerIconPng from "leaflet/dist/images/marker-icon.png";
const defaultIcon = new Icon({ iconUrl: markerIconPng, iconSize: [25, 41], iconAnchor: [12, 41] });

export default function CafesProches() {
  const [position, setPosition] = useState([44.8378, -0.5792]);
  const [userLocated, setUserLocated] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const searchRadius = 5000;

  // recup des données
  useEffect(() => {
    const fetchCafes = async () => {
      if (!userLocated) return;
      setLoading(true);
      setError(null);
      const [lat, lon] = position;

      try {
        const radii = [searchRadius, 2000, 1000];
        const endpoints = [
          'https://overpass-api.de/api/interpreter',
          'https://overpass.openstreetmap.fr/api/interpreter'
        ];

        let finalData = null;

        for (const radius of radii) {
          const query = `[out:json][timeout:25];
            (
              node["amenity"="cafe"](around:${radius},${lat},${lon});
              way["amenity"="cafe"](around:${radius},${lat},${lon});
              node["shop"="coffee"](around:${radius},${lat},${lon});
              way["shop"="coffee"](around:${radius},${lat},${lon});
            );
            out center;`;

          for (const ep of endpoints) {
            try {
              const res = await fetch(ep, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`
              });
              if (res.ok) {
                const data = await res.json();
                if (data?.elements?.length > 0) {
                  finalData = data;
                  break;
                }
              }
            } catch (e) { console.warn("Erreur endpoint", ep); }
          }
          if (finalData) break;
        }

        if (!finalData) throw new Error('Aucune donnée reçue');

        const processed = finalData.elements.map(el => {
          const tags = el.tags || {};
          const displayName = tags.name || tags['name:fr'] || tags.brand || tags.operator || "Café (nom inconnu)";
          const latEl = el.lat || (el.center && el.center.lat);
          const lonEl = el.lon || (el.center && el.center.lon);
          const address = `${tags['addr:housenumber'] || ''} ${tags['addr:street'] || ''}`.trim() || tags['addr:full'] || "Adresse non renseignée";

          return { 
            id: el.id, 
            lat: latEl, 
            lon: lonEl, 
            name: displayName, 
            address: address, 
            opening_hours: tags.opening_hours,
            wheelchair: tags.wheelchair,
            distance: 0 
          };
        }).filter(c => c.lat && c.lon);

        const R = 6371e3;
        const toRad = v => v * Math.PI / 180;
        const withDist = processed.map(c => {
          const dLat = toRad(c.lat - lat);
          const dLon = toRad(c.lon - lon);
          const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat)) * Math.cos(toRad(c.lat)) * Math.sin(dLon/2)**2;
          const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * R;
          return { ...c, distance: Math.round(dist) };
        }).sort((a, b) => a.distance - b.distance);

        setCafes(withDist);
      } catch (err) {
        setError('Impossible de charger les cafés.');
      } finally { setLoading(false); }
    };

    fetchCafes();
  }, [position, userLocated]);

  const requestLocation = () => {
    if (!navigator.geolocation) return setGeoError('GPS non supporté');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setUserLocated(true);
        setLocating(false);
      },
      () => { setGeoError('Localisation refusée'); setLocating(false); },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  // --- FONCTION POUR LE STATUT ACTUEL (Ouvert/Fermé) ---
  const computeOpenStatus = (oh) => {
    if (!oh) return null;
    const now = new Date();
    const dayNames = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    const today = dayNames[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const segments = oh.toLowerCase().split(';').map(s => s.trim());

    for (let seg of segments) {
      const timeMatches = Array.from(seg.matchAll(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g));
      const hasDay = /[a-z]{2}/.test(seg);
      const isToday = !hasDay || seg.includes(today) || (seg.includes('-') && checkDayInRange(seg, today));

      if (isToday) {
        for (const match of timeMatches) {
          const start = parseInt(match[1].replace(':', ''));
          const end = parseInt(match[2].replace(':', ''));
          if (currentTime >= start && currentTime <= end) {
            return { status: 'open', text: `Ouvert jusqu'à ${match[2]}` };
          }
        }
      }
    }
    return { status: 'closed', text: 'Fermé actuellement' };
  };

  // affichage horaires du jour 
  const getTodayHours = (oh) => {
    if (!oh) return "Horaires non renseignés";
    if (oh.toLowerCase().includes("24/7")) return "Ouvert 24h/24";

    const now = new Date();
    const dayNames = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    const today = dayNames[now.getDay()];

    const segments = oh.toLowerCase().split(';').map(s => s.trim());
    let hoursFound = [];

    for (let seg of segments) {
        const hasDay = /[a-z]{2}/.test(seg);
        const isToday = !hasDay || seg.includes(today) || (seg.includes('-') && checkDayInRange(seg, today));
        
        if (isToday) {
            const ranges = seg.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g);
            if (ranges) hoursFound.push(...ranges);
        }
    }

    return hoursFound.length > 0 ? hoursFound.join(' / ') : "Fermé aujourd'hui";
  };

  // Helper pour vérifier si aujourd'hui est dans une plage de jours (ex: mo-fr)
  const checkDayInRange = (seg, today) => {
    const days = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];
    const match = seg.match(/(mo|tu|we|th|fr|sa|su)\s*-\s*(mo|tu|we|th|fr|sa|su)/);
    if (!match) return false;
    const start = days.indexOf(match[1]);
    const end = days.indexOf(match[2]);
    const current = days.indexOf(today);
    return current >= start && current <= end;
  };

  return (
    <div className="page-accueil">
      <Navbar />
      <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 20px', display: 'flex', gap: 20 }}>
        
        
        <div style={{ width: 380 }}>
          <h2 style={{ marginBottom: 15 }}>☕ Cafés à proximité</h2>
          {loading && <p>Recherche en cours...</p>}
          
          <div style={{ maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 10 }}>
            {cafes.map(c => {
              const openInfo = computeOpenStatus(c.opening_hours);
              const todayHours = getTodayHours(c.opening_hours);
              
              return (
                <div key={c.id} 
                     style={{ padding: 15, border: '1px solid #eee', borderRadius: 10, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }} 
                     onClick={() => mapRef.current?.setView([c.lat, c.lon], 17)}>
                  
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{c.name}</div>
                  <div style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>{c.address}</div>

                  {/* affiche horaires du j */}
                  <div style={{ fontSize: '12px', color: '#555', marginTop: 8, padding: '4px 8px', background: '#f9f9f9', borderRadius: '5px', display: 'inline-block' }}>
                    🕒 Aujourd'hui : <span style={{fontWeight: '600'}}>{todayHours}</span>
                  </div>

                  {/* affiche si ouvert / fermé */}
                  {openInfo && (
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: openInfo.status === 'open' ? '#2e7d32' : '#d32f2f', marginTop: 8 }}>
                      ● {openInfo.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#999' }}>📍 {c.distance < 1000 ? `${c.distance} m` : `${(c.distance/1000).toFixed(1)} km`}</span>
                    {c.wheelchair === 'yes' && <span title="Accessible PMR">♿</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        
        <div style={{ flex: 1, height: '80vh' }}>
          <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%', borderRadius: 15 }} 
                        whenCreated={map => mapRef.current = map}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {userLocated && <Marker position={position} icon={defaultIcon}><Popup>Ma position</Popup></Marker>}
            {cafes.map(c => (
              <Marker key={c.id} position={[c.lat, c.lon]} icon={defaultIcon}>
                <Popup>
                  <strong>{c.name}</strong><br/>{c.address}
                </Popup>
              </Marker>
            ))}
            <Circle center={position} radius={searchRadius} pathOptions={{ color: '#1976d2', fillOpacity: 0.05 }} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
