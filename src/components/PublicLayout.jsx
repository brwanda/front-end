import React from 'react';
import './Layout.css';

const PublicLayout = ({ children }) => {
  return (
    <div className="public-layout">
      <main className="public-content">{children}</main>
    </div>
  );
};

export default PublicLayout;
