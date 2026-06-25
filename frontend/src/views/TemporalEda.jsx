import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TemporalEda() {
  const [overview, setOverview] = useState(null);
  const [temporalData, setTemporalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewRes, temporalRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/overview'),
          axios.get('http://127.0.0.1:8000/api/temporal-eda')
        ]);
        
        setOverview(overviewRes.data);
        // Clean data for Recharts
        const chartData = temporalRes.data.temporal_data.map(d => ({
          name: d.time, // YYYY-MM-DD
          count: d.count
        }));
        setTemporalData(chartData);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || "Gagal mengambil data dari server. Pastikan backend FastAPI berjalan dan data.csv tersedia.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading-container">Memuat Data Analisis...</div>;

  return (
    <div>
      <div className="header">
        <h1>Overview & Temporal EDA</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}

      {overview && (
        <div className="metric-grid">
          <div className="glass-panel metric-card">
            <span className="metric-label">Total Gempa</span>
            <span className="metric-value">{overview.total_gempa.toLocaleString()}</span>
          </div>
          <div className="glass-panel metric-card">
            <span className="metric-label">Rata-rata Magnitudo</span>
            <span className="metric-value">{overview.avg_magnitude}</span>
          </div>
          <div className="glass-panel metric-card">
            <span className="metric-label">Kedalaman Rata-rata</span>
            <span className="metric-value">{overview.avg_depth} km</span>
          </div>
          <div className="glass-panel metric-card">
            <span className="metric-label">Magnitudo Maksimum</span>
            <span className="metric-value">{overview.max_magnitude}</span>
          </div>
        </div>
      )}

      {temporalData.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Frekuensi Gempa Mingguan (1 Kuartal Terakhir)</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }}
                  itemStyle={{ color: '#2563eb' }}
                />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
