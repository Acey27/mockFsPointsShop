import React from 'react';

/**
 * LoadingSpinner component props
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Size of the spinner
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {string} [props.text] - Optional text to display
 */

const LoadingSpinner= ({ 
  size = 'md', 
  className = '',
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
      />
      {text && (
        <p className="text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
