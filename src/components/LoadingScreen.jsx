import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import EaracgRealLogo from '../assets/earacg-faceted-peak.png';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'radial-gradient(1100px 540px at 80% -10%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(900px 460px at -10% 110%, rgba(14,165,233,0.14), transparent 64%), linear-gradient(180deg, var(--bg-primary) 0%, #0a1020 55%, #0f172a 100%)'
    }}>
      <div className="text-center">
        {/* Animated Logo/Icon */}
        <div className="mb-8">
          <div className="relative">
            <div 
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%)',
                boxShadow: 'var(--shadow-xl)',
                animation: 'pulse 2s infinite'
              }}
            >
              <img
                src={EaracgRealLogo}
                alt="EARACG official logo"
                className="w-14 h-14 rounded-xl"
                style={{ objectFit: 'cover', border: '2px solid rgba(148,163,184,0.35)' }}
              />
            </div>
            <div 
              className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-4 border-transparent"
              style={{
                borderTopColor: 'var(--primary-400)',
                animation: 'spin 1.5s linear infinite'
              }}
            ></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #93c5fd 0%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            EARA Connect
          </h2>
          <p className="text-lg" style={{color: 'var(--text-secondary)'}}>
            {message}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: '#60a5fa',
                animation: `bounce 1.4s infinite ${index * 0.2}s`
              }}
            ></div>
          ))}
        </div>

        {/* Subtle Footer */}
        <div className="mt-12">
          <p className="text-sm" style={{color: 'var(--text-muted)'}}>
            East African Regional Administrative Committee on Governance
          </p>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: translateY(0);
            opacity: 0.4;
          }
          40% { 
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;