import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const ChairDashboard = () => {
  return (
    <div className="dashboard">
      <h1>Chair Dashboard</h1>
      <p>Welcome! As a Chair, you can view and manage committees and their members.</p>
      <div className="dashboard-cards">
        <Link to="/committees" className="dashboard-card">
          <h3>Committees</h3>
          <p>View and manage committees</p>
        </Link>
        <Link to="/members" className="dashboard-card">
          <h3>Committee Members</h3>
          <p>View and manage committee members</p>
        </Link>
        <Link to="/sub-committee-members" className="dashboard-card">
          <h3>Sub-Committee Members</h3>
          <p>View and manage sub-committee members</p>
        </Link>
      </div>
    </div>
  );
};

export default ChairDashboard; 