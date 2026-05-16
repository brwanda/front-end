import React from 'react';
import { useNavigate } from 'react-router-dom';
import SimplePerformanceDashboard from '../../components/Dashboard/SimplePerformanceDashboard';
import './SimplePerformanceDashboardPage.css';

const SimplePerformanceDashboardPage = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="simple-performance-dashboard-page">
      <div className="page-header">
        <div className="header-content">
          <button className="back-button" onClick={handleBack}>← Back</button>
          <h1>Performance Dashboard</h1>
          <p>Database-driven comparative diagrams for countries based on reports and assigned resolutions</p>
        </div>
      </div>
      <SimplePerformanceDashboard />
    </div>
  );
};

export default SimplePerformanceDashboardPage;
