
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = `
    px-4 py-2 rounded-lg font-semibold text-sm focus:outline-none 
    focus:ring-2 focus:ring-offset-2 focus:ring-offset-black 
    transition-all duration-200 flex items-center justify-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-purple-700 text-white hover:bg-purple-600 focus:ring-purple-500',
    secondary: 'bg-gray-800/60 text-gray-200 hover:bg-gray-700/80 focus:ring-blue-500 border border-gray-700/80',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-300 hover:bg-purple-500/10 focus:ring-purple-500',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;