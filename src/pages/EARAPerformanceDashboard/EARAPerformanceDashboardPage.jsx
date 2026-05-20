import React from 'react';
import { useNavigate } from 'react-router-dom';
import EARAPerformanceDashboard from '../../components/Dashboard/EARAPerformanceDashboard';
import './EARAPerformanceDashboardPage.css';

const EARAPerformanceDashboardPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="eara-performance-dashboard-page">
      <EARAPerformanceDashboard />
    </div>
  );
};

export default EARAPerformanceDashboardPage;
