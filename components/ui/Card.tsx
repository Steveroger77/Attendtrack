
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const baseClasses = `
    bg-black/30 backdrop-blur-2xl border border-white/10 
    rounded-3xl shadow-lg shadow-black/20 transition-all duration-300
  `;
  const interactiveClasses = onClick ? 'cursor-pointer hover:border-purple-400/50 hover:bg-black/40 hover:shadow-purple-500/20' : '';

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
