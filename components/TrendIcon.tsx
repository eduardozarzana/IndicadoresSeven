
import React from 'react';
import { Trend } from '../types';

interface TrendIconProps {
  trend: Trend;
  className?: string;
}

const TrendIcon: React.FC<TrendIconProps> = ({ trend, className }) => {
  const defaultClasses = "w-5 h-5 inline-block ml-1";
  const combinedClassName = `${defaultClasses} ${className || ''}`;

  switch (trend) {
    case Trend.Up:
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className={`${combinedClassName} text-green-500`}
          aria-label="Trending Up"
        >
          <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.56l-2.47 2.47a.75.75 0 01-1.06-1.06l3.75-3.75a.75.75 0 011.06 0l3.75 3.75a.75.75 0 11-1.06 1.06L10.75 5.56v10.69a.75.75 0 01-.75.75z" clipRule="evenodd" />
        </svg>
      );
    case Trend.Down:
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className={`${combinedClassName} text-red-500`}
          aria-label="Trending Down"
        >
          <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.69l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0l-3.75-3.75a.75.75 0 011.06-1.06l2.47 2.47V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
        </svg>
      );
    case Trend.Stable:
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className={`${combinedClassName} text-gray-500`}
          aria-label="Stable Trend"
        >
          <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

export default TrendIcon;