import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function SpatialEda() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://127.0.0.1:8000/api/spatial-eda?limit=500');
        setPoints(res.data.points);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || "Gagal memuat data spasial.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading-container">Memuat Peta...</div>;

  return (
    <div>
      <div className="header" style={{ marginBottom: '1rem' }}>
        <h1 className="page-title">Peta Spasial Geografis</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', height: '600px', borderRadius: '1rem' }}>
        <MapContainer center={[-2.5, 118]} zoom={5} style={{ height: '100%', width: '100%', background: '#e2e8f0' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {points.map((pt, idx) => (
            <CircleMarker 
              key={idx}
              center={[pt.latitude, pt.longitude]}
              radius={pt.mag ? Math.max(pt.mag, 2) : 2}
              fillOpacity={0.6}
              color="#ef4444"
              fillColor="#ef4444"
              stroke={false}
            >
              <Popup>
                <div style={{ color: '#0f172a' }}>
                  <strong>Magnitudo:</strong> {pt.mag}<br/>
                  <strong>Kedalaman:</strong> {pt.depth} km<br/>
                  <strong>Lokasi:</strong> {pt.place}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
