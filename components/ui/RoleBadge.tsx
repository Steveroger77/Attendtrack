
import React from 'react';
import { Role } from '../../types';

interface RoleBadgeProps {
  role: Role;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const styles = {
    [Role.ADMIN]: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    [Role.LECTURER]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    [Role.STUDENT]: 'bg-green-500/20 text-green-300 border-green-500/30',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${styles[role]}`}>
      {role}
    </span>
  );
};

export default RoleBadge;
