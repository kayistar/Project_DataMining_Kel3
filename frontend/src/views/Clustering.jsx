import { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function Clustering() {
  const [file, setFile] = useState(null);
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/clustering', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setCluster(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Gagal memproses file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Clustering Gempa (Batch CSV)</h1>
      <p className="page-subtitle">
        Pemetaan klaster wilayah bahaya gempa secara masal menggunakan data CSV mingguan.
      </p>

      {error && <div className="error-message">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#111827' }}>Upload Data Analisis</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pilih file CSV (Harus memiliki kolom latitude, longitude, mag)</label>
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileChange} 
                className="form-input"
                required 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !file} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Menganalisis...' : 'Analisis Zona Cluster'}
            </button>
          </form>
        </div>

        {cluster && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#475569', marginBottom: '1.5rem' }}>Ringkasan Hasil Klaster</h3>
            
            <div style={{ display: 'flex', gap: '1rem', width: '100%', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 20%', padding: '1rem', borderRadius: '12px', background: '#10b981', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{cluster.summary.cluster0_count}</div>
                <div style={{ fontSize: '0.875rem' }}>Titik Cluster 0</div>
              </div>
              <div style={{ flex: '1 1 20%', padding: '1rem', borderRadius: '12px', background: '#facc15', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{cluster.summary.cluster1_count}</div>
                <div style={{ fontSize: '0.875rem' }}>Titik Cluster 1</div>
              </div>
              <div style={{ flex: '1 1 20%', padding: '1rem', borderRadius: '12px', background: '#f59e0b', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{cluster.summary.cluster2_count}</div>
                <div style={{ fontSize: '0.875rem' }}>Titik Cluster 2</div>
              </div>
              <div style={{ flex: '1 1 20%', padding: '1rem', borderRadius: '12px', background: '#ef4444', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{cluster.summary.cluster3_count}</div>
                <div style={{ fontSize: '0.875rem' }}>Titik Cluster 3</div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Total Data Diproses</span>
                <span style={{ fontWeight: '500' }}>{cluster.summary.total_data} baris</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Metode</span>
                <span style={{ fontWeight: '500' }}>K-Means Aggregation</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {cluster && cluster.details && cluster.details.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '0', overflow: 'hidden', height: '500px', borderRadius: '1rem' }}>
          <MapContainer center={[-2.5, 118]} zoom={5} style={{ height: '100%', width: '100%', background: '#e2e8f0' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {cluster.details.map((point, idx) => (
              <CircleMarker
                key={idx}
                center={[point.latitude, point.longitude]}
                radius={point.mag > 0 ? point.mag * 1.5 : 5}
                pathOptions={{
                  color: point.color,
                  fillColor: point.color,
                  fillOpacity: 0.6,
                  weight: 1
                }}
              >
                <LeafletTooltip>
                  <div>
                    <strong>Klaster: {point.cluster_name}</strong><br/>
                    Magnitudo: {point.mag}<br/>
                    Risiko: {point.risk_level}
                  </div>
                </LeafletTooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
