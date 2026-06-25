import { useState } from 'react';
import axios from 'axios';

export default function LstmPrediction() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
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
      const res = await axios.post('http://127.0.0.1:8000/api/lstm-predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Gagal memproses file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Prediksi Magnitudo (Batch CSV)</h1>
      <p className="page-subtitle">
        Simulasi model LSTM untuk memprediksi besaran magnitudo gempa bumi secara masal menggunakan data CSV mingguan.
      </p>

      {error && <div className="error-message">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#111827' }}>Upload Data Mingguan</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pilih file CSV (Harus memiliki kolom latitude, longitude, depth)</label>
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileChange} 
                className="form-input"
                required 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !file} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Memproses Data...' : 'Jalankan Batch Prediksi'}
            </button>
          </form>
        </div>

        {prediction && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <h3 style={{ color: '#1e3a8a', marginBottom: '0.5rem' }}>Rata-rata Prediksi Magnitudo</h3>
            <div style={{ fontSize: '4rem', fontWeight: '700', color: '#2563eb', lineHeight: '1' }}>
              {prediction.summary.average_magnitude}
            </div>
            <span style={{ color: '#3b82f6', fontWeight: '500', marginTop: '0.5rem' }}>Skala Richter (M)</span>
            
            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              <p>Total Data Diproses: <strong style={{ color: '#111827' }}>{prediction.summary.total_data} Baris</strong></p>
              <p>Status Umum: <strong style={{ color: prediction.summary.status_summary === 'Aman' ? '#10b981' : '#ef4444' }}>{prediction.summary.status_summary}</strong></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
