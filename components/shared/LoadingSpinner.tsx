
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-primary font-semibold">Carregando dados...</p>
    </div>
  );
};

export default LoadingSpinner;