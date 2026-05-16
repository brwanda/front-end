import React from 'react';
import EaracgRealLogo from '../../assets/earacg-faceted-peak.svg';

const RealLogoBadge = ({ size = 42 }) => {
  return (
    <div
      aria-label="EARACG official logo"
      title="EARACG official logo"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.75)',
        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.2)',
        background: '#ffffff',
        flexShrink: 0,
      }}
    >
      <img
        src={EaracgRealLogo}
        alt="EARACG official logo"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
};

export default RealLogoBadge;
