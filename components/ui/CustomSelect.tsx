import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  name?: string;
  value: string | number;
  onChange: (e: { target: { name?: string; value: string | number } }) => void;
  options: CustomSelectOption[];
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none w-full ${className}`}
      id={id}
    >
      {/* Target element button trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 py-2 bg-black/40 backdrop-blur-md border border-white/10 hover:border-purple-500/50 rounded-lg flex items-center justify-between text-left text-sm text-gray-200 transition-all duration-300 relative focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        <span className="truncate pr-4">{selectedOption?.label || 'Select...'}</span>
        <ChevronDown
          className={`shrink-0 w-4 h-4 text-gray-400 transition-transform duration-300 ease-out ${
            isOpen ? 'rotate-180 text-purple-400' : ''
          }`}
        />
      </button>

      {/* Floating glassmorphic options dropdown portal */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 p-1 bg-black/85 backdrop-blur-xl border border-white/15 dark:border-purple-500/20 rounded-xl shadow-2xl shadow-indigo-950/50 max-h-60 overflow-y-auto animate-fadeIn focus:outline-none">
          <div className="space-y-0.5">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-600/35 border border-purple-500/30 text-white font-medium shadow-sm shadow-purple-500/10'
                      : 'text-gray-300 hover:bg-white/5 border border-transparent hover:text-white'
                  }`}
                  style={{
                    animationDelay: `${index * 15}ms`,
                  }}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {isSelected && (
                    <Check className="shrink-0 w-4 h-4 text-purple-400 font-bold" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
