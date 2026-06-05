import React from 'react';

interface FuturisticLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDot?: boolean;
  className?: string;
  glow?: boolean;
}

const FuturisticLogo: React.FC<FuturisticLogoProps> = ({
  size = 'md',
  showDot = false,
  className = '',
  glow = true,
}) => {
  // Map size to container/letter dimension classes
  const sizeClasses = {
    sm: { letterWidth: 'w-2.5 h-3', gap: 'gap-x-[3px]', dotSize: 'w-1.5 h-1.5 ml-1', text: 'text-xs' },
    md: { letterWidth: 'w-4 h-5', gap: 'gap-x-1', dotSize: 'w-2 h-2 ml-1.5', text: 'text-sm' },
    lg: { letterWidth: 'w-6 h-7.5', gap: 'gap-x-1.5', dotSize: 'w-3 h-3 ml-2', text: 'text-base' },
    xl: { letterWidth: 'w-9 h-11', gap: 'gap-x-2.5', dotSize: 'w-4 h-4 ml-3', text: 'text-xl' },
  };

  const currentSize = sizeClasses[size];
  const strokeWidth = 2.4;

  // Let's draw each custom high-tech letter's SVG content.
  // Each letter has viewbox "0 0 36 44" for crisp geometric rendering.
  const letters = [
    {
      char: 'A',
      isAccent: false,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-gray-300 transition-colors duration-300`} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 5,40 L 18,4 L 31,40" />
          <path d="M 11,26 L 25,26" />
        </svg>
      ),
    },
    {
      char: 'T',
      isAccent: false,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-gray-300 transition-colors duration-300`} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 4,4 L 32,4" />
          <path d="M 18,4 L 18,40" />
        </svg>
      ),
    },
    {
      char: 'T',
      isAccent: false,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-gray-300 transition-colors duration-300`} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 4,4 L 32,4" />
          <path d="M 18,4 L 18,40" />
        </svg>
      ),
    },
    {
      char: 'E',
      isAccent: false,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-gray-300 transition-colors duration-300`} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 6,6 L 30,6" />
          <path d="M 6,22 L 24,22" />
          <path d="M 6,38 L 30,38" />
        </svg>
      ),
    },
    {
      char: 'N',
      isAccent: false,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-gray-300 transition-colors duration-300`} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 6,4 L 6,40" />
          <path d="M 6,4 L 30,40" />
          <path d="M 30,4 L 30,40" />
        </svg>
      ),
    },
    {
      char: 'D',
      isAccent: false,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-gray-400 transition-colors duration-300`} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 6,4 L 6,40" />
          {/* Floating beautifully detached semi-circle */}
          <path d="M 13,4 A 18,18 0 0 1 13,40" />
        </svg>
      ),
    },
    // ---- Purple accent starts here ----
    {
      char: 'T',
      isAccent: true,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]`} stroke="currentColor" strokeWidth={strokeWidth + 0.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 4,4 L 32,4" />
          <path d="M 18,4 L 18,40" />
        </svg>
      ),
    },
    {
      char: 'R',
      isAccent: true,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]`} stroke="currentColor" strokeWidth={strokeWidth + 0.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 6,4 L 6,40" />
          <path d="M 6,4 L 23,4 A 9,9 0 0 1 23,22 L 6,22" />
          <path d="M 18,22 L 30,40" />
        </svg>
      ),
    },
    {
      char: 'A',
      isAccent: true,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.3)]`} stroke="currentColor" strokeWidth={strokeWidth + 0.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 5,40 L 18,4 L 31,40" />
          <path d="M 11,26 L 25,26" />
        </svg>
      ),
    },
    {
      char: 'C',
      isAccent: true,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]`} stroke="currentColor" strokeWidth={strokeWidth + 0.2} strokeLinecap="round" fill="none">
          <path d="M 28,10 A 15,15 0 1 0 28,34" />
        </svg>
      ),
    },
    {
      char: 'K',
      isAccent: true,
      svg: (
        <svg viewBox="0 0 36 44" className={`${currentSize.letterWidth} text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]`} stroke="currentColor" strokeWidth={strokeWidth + 0.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 6,4 L 6,40" />
          <path d="M 28,4 L 11,21 L 28,40" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`flex items-center select-none shrink-0 ${className}`}>
      <div className={`flex flex-nowrap shrink-0 ${currentSize.gap}`}>
        {letters.map((letter, idx) => (
          <div key={idx} className="flex-shrink-0 transition-all duration-300 transform hover:scale-110">
            {letter.svg}
          </div>
        ))}
      </div>
      {showDot && (
        <span
          className={`shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 ${currentSize.dotSize} ${
            glow ? 'shadow-[0_0_12px_rgba(6,182,212,0.85)] animate-pulse' : ''
          }`}
        />
      )}
    </div>
  );
};

export default FuturisticLogo;
