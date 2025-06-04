
import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base p-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md text-center">
        <div className="text-2xl mb-2">😔</div>
        <h2 className="text-xl font-semibold mb-2">Ocorreu um Erro</h2>
        <p className="mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-500 hover:bg-red-700 text-base font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
