import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, Map, PieChart, TrendingUp } from 'lucide-react';
import './index.css';

// Views
import TemporalEda from './views/TemporalEda';
import SpatialEda from './views/SpatialEda';
import Clustering from './views/Clustering';
import LstmPrediction from './views/LstmPrediction';
import Forecast from './views/Forecast';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Top Navigation */}
        <nav className="navbar">
          <div className="nav-brand">
            <Activity size={24} color="#2563eb" />
            Dashboard Gempa
          </div>

          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                Overview
              </NavLink>
            </li>
            <li>
              <NavLink to="/spatial" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                Peta Spasial Geografis
              </NavLink>
            </li>
            <li>
              <NavLink to="/clustering" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                Clustering
              </NavLink>
            </li>
            <li>
              <NavLink to="/lstm" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                LSTM Predict
              </NavLink>
            </li>
            <li>
              <NavLink to="/forecast" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                Forecast Evaluation
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<TemporalEda />} />
            <Route path="/spatial" element={<SpatialEda />} />
            <Route path="/clustering" element={<Clustering />} />
            <Route path="/lstm" element={<LstmPrediction />} />
            <Route path="/forecast" element={<Forecast />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
