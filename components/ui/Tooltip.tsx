
import React from 'react';

interface TooltipProps {
  children: React.ReactElement;
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50
                     opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none
                     transform translate-y-1 group-hover:translate-y-0">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;