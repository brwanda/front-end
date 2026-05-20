import React from 'react';
import SimplePerformanceDashboard from '../../components/Dashboard/SimplePerformanceDashboard';
import './SimplePerformanceDashboardPage.css';

const SimplePerformanceDashboardPage = () => {
  return (
    <div className="simple-performance-dashboard-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Sub-Com Performance</h1>
          <p>Comparative diagrams for technical sub-committees based on reports and assigned resolutions</p>
        </div>
      </div>
      <SimplePerformanceDashboard />
    </div>
  );
};

export default SimplePerformanceDashboardPage;
