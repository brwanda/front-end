import React from 'react';
import './ui.css';

const AppButton = ({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}) => {
  return (
    <button type={type} className={`ui-btn ui-btn-${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
};

export default AppButton;
