import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaFileAlt, FaTestTube, FaDashboard, FaUsers, FaChartLine } from 'react-icons/fa';

const SecretaryQuickNav = ({ user }) => {
  const navigate = useNavigate();

  // Only show for secretaries
  if (!user || user.role !== 'SECRETARY') {
    return null;
  }

  const navItems = [
    {
      title: 'Secretary Dashboard',
      description: 'Comprehensive secretary portal with all features',
      icon: FaDashboard,
      path: '/secretary/dashboard',
      color: 'bg-blue-500'
    },
    {
      title: 'Meeting Invitations',
      description: 'Send invitations to committees and subcommittees',
      icon: FaEnvelope,
      path: '/invitations/send',
      color: 'bg-green-500'
    },
    {
      title: 'Resolution Assignment',
      description: 'Assign resolutions with contribution percentages',
      icon: FaFileAlt,
      path: '/resolutions/enhanced',
      color: 'bg-purple-500'
    },
    {
      title: 'Quick Test Interface',
      description: 'Test all functionality in one place',
      icon: FaTestTube,
      path: '/test-interface',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <FaUsers className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">Secretary Tools</h3>
        </div>
        
        <div className="space-y-2">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color} text-white group-hover:scale-110 transition-transform`}>
                  <item.icon className="text-sm" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Enhanced Secretary Portal v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecretaryQuickNav;