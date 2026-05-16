import React from 'react';
import './ui.css';

const AppCard = ({ as: Tag = 'section', className = '', compact = false, children }) => {
  return <Tag className={`ui-card ${compact ? 'ui-card-compact' : ''} ${className}`.trim()}>{children}</Tag>;
};

export default AppCard;
