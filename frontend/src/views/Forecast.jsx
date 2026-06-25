import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

export default function Forecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Controls
  const [selectedCluster, setSelectedCluster] = useState("Cluster 0");
  const [metric, setMetric] = useState("frekuensi"); // frekuensi, max_mag, mean_depth

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://127.0.0.1:8000/api/forecast');
        setData(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data prediksi dari server.");
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) return <div className="loading-container">Memuat Model Prediksi...</div>;
  if (error) return <div className="error-message" style={{margin: '2rem'}}>{error}</div>;

  const chartData = data && data[selectedCluster] ? data[selectedCluster][metric] : [];

  // Find the point where future starts to draw a vertical line
  const futureStartIndex = chartData.findIndex(d => d.is_future);
  const futureStartDate = futureStartIndex !== -1 ? chartData[futureStartIndex].week : null;

  const getMetricTitle = () => {
    if (metric === "frekuensi") return "Prediksi Frekuensi Gempa (Kejadian)";
    if (metric === "max_mag") return "Prediksi Magnitudo Maksimal (Max Mag)";
    if (metric === "mean_depth") return "Prediksi Rata-rata Kedalaman (Mean Depth)";
  };

  return (
    <div>
      <div className="header" style={{ marginBottom: '0.5rem' }}>
        <h1 className="page-title">Forecast & Evaluation</h1>
      </div>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
        Evaluasi hasil prediksi (Predicted vs Actual) dari data historis aktual dan proyeksi 4 minggu ke depan.
      </p>

      {/* Controls */}
      <div className="glass-panel" style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem', background: '#f8fafc' }}>
        
        {/* Cluster Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>Pilih Zona / Cluster</label>
          <select 
            className="form-input" 
            value={selectedCluster} 
            onChange={(e) => setSelectedCluster(e.target.value)}
            style={{ width: '250px', cursor: 'pointer' }}
          >
            <option value="Cluster 0">Cluster 0</option>
            <option value="Cluster 1">Cluster 1</option>
            <option value="Cluster 2">Cluster 2</option>
            <option value="Cluster 3">Cluster 3</option>
          </select>
        </div>

        {/* Metric Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>Metrik Prediksi</label>
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '4px' }}>
            <button 
              onClick={() => setMetric("frekuensi")}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: metric === "frekuensi" ? '#ffffff' : 'transparent',
                color: metric === "frekuensi" ? '#2563eb' : '#64748b',
                fontWeight: metric === "frekuensi" ? '600' : '500',
                cursor: 'pointer',
                boxShadow: metric === "frekuensi" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Frekuensi Gempa
            </button>
            <button 
              onClick={() => setMetric("max_mag")}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: metric === "max_mag" ? '#ffffff' : 'transparent',
                color: metric === "max_mag" ? '#2563eb' : '#64748b',
                fontWeight: metric === "max_mag" ? '600' : '500',
                cursor: 'pointer',
                boxShadow: metric === "max_mag" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Max Mag
            </button>
            <button 
              onClick={() => setMetric("mean_depth")}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: metric === "mean_depth" ? '#ffffff' : 'transparent',
                color: metric === "mean_depth" ? '#2563eb' : '#64748b',
                fontWeight: metric === "mean_depth" ? '600' : '500',
                cursor: 'pointer',
                boxShadow: metric === "mean_depth" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Mean Depth
            </button>
          </div>
        </div>

      </div>

      {/* Chart */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
          {getMetricTitle()} - {selectedCluster}
        </h2>
        
        <div className="chart-container" style={{ height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="week" 
                stroke="#64748b" 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              {/* Actual Line (solid, historical only) */}
              <Line 
                name="Actual (Historis)"
                type="monotone" 
                dataKey="actual" 
                stroke="#64748b" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2 }} 
                activeDot={{ r: 6 }} 
              />
              
              {/* Predicted Line (solid for historical eval, dashed for future) */}
              <Line 
                name="Predicted (Model LSTM)"
                type="monotone" 
                dataKey="predicted" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ r: 4 }}
              />

              {/* Vertical line separating history and future */}
              {futureStartDate && (
                <ReferenceLine 
                  x={futureStartDate} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  label={{ position: 'top', value: 'Forecasting (4 Minggu)', fill: '#ef4444', fontSize: 14, fontWeight: 600 }} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
