import React from 'react';
import Sidebar from './Sidebar/Sidebar';
import SessionTimeoutWarning from './SessionTimeoutWarning';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout app-layout-shell">
      <SessionTimeoutWarning />
      <Sidebar />
      <main className="main-content">
        <div className="main-content-body app-content-shell">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;