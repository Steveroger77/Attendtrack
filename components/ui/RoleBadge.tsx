
import React from 'react';
import { Role } from '../../types';

interface RoleBadgeProps {
  role: Role;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const styles: Record<string, string> = {
    'ADMIN': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'LECTURER': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'STUDENT': 'bg-green-500/20 text-green-300 border-green-500/30',
  };

  const badgeClass = styles[String(role).toUpperCase()] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${badgeClass}`}>
      {String(role).toUpperCase()}
    </span>
  );
};

export default RoleBadge;
