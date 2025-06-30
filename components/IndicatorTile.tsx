
import React, { useState } from 'react';
import { Indicator } from '../types';

// Helper to format values, handling numbers, percentages, currency, and units.
const formatValue = (value: number | string, format?: 'currency' | 'percentage' | 'number', unitForDisplay?: string): string => {
  // Handle null/undefined/empty/placeholder values, including #NUM! error from sheets
  if (value === 'N/A' || value === 'N/D' || value === '-' || value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (typeof value === 'string' && value.trim().toUpperCase() === '#NUM!')) {
    return '-';
  }
  
  let numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;

  if (typeof value === 'string' && isNaN(numericValue)) {
    return `${value}${unitForDisplay && !value.includes(unitForDisplay) ? ` ${unitForDisplay}` : ''}`;
  }

  let formattedString: string;
  switch (format) {
    case 'currency':
      const currencyCode = (unitForDisplay && unitForDisplay.length === 3) ? unitForDisplay : 'BRL';
      formattedString = numericValue.toLocaleString('pt-BR', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
      break;
    case 'percentage':
      const percentSuffix = (unitForDisplay === undefined || unitForDisplay === '%') ? '%' : ` ${unitForDisplay}`;
      formattedString = `${numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${percentSuffix}`;
      break;
    case 'number':
    default:
      // For numbers, display with a maximum of 2 decimal places.
      formattedString = numericValue.toLocaleString('pt-BR', { 
        maximumFractionDigits: 2,
      });

      if (unitForDisplay) {
        if (!formattedString.endsWith(unitForDisplay)) {
             formattedString += ` ${unitForDisplay}`;
        }
      }
      break;
  }
  return formattedString;
};

interface IndicatorTileProps {
  indicator: Indicator;
  onSelectIndicator: (indicator: Indicator) => void;
}


const IndicatorTile: React.FC<IndicatorTileProps> = ({ indicator, onSelectIndicator }) => {
  const { name, value, unit, format, average7Days, average30Days, lastRecordObservation, lastRecordFilesLink } = indicator;
  const [isObservationExpanded, setIsObservationExpanded] = useState(false);

  const renderFormattedValue = (val: number | string | undefined, fmt: typeof format, unt: typeof unit, isTarget: boolean = false) => {
    const placeholderValues = ['N/A', 'N/D', '-'];
    const isPlaceholder = val === undefined || val === null || placeholderValues.includes(String(val));
    
    if (isPlaceholder) {
        const nullClass = isTarget ? "text-lg font-semibold text-gray-500" : "text-xl font-bold text-gray-500";
        return <span className={nullClass}>-</span>;
    }
    
    const valueClass = isTarget ? "text-lg font-semibold text-neutral" : "text-xl font-bold text-gray-900";
    return <span className={valueClass}>{formatValue(val as number | string, fmt, unt)}</span>;
  };
  
  const MAX_OBS_LENGTH = 60;

  return (
    <div
      onClick={() => onSelectIndicator(indicator)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectIndicator(indicator)}
      className="bg-violet-50 hover:bg-violet-100 transition-all duration-200 p-5 rounded-xl shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01]"
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes do indicador ${name}`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-0 sm:w-2/5 md:w-1/3 truncate" title={name}>
          {name}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 sm:w-3/5 md:w-2/3">
          {/* Último Registro Column */}
          <div className="flex flex-col items-center justify-start text-center">
            <p className="text-xs text-gray-500 uppercase whitespace-nowrap tracking-wide">Último Registro</p>
            {renderFormattedValue(value, format, unit)}

            {(lastRecordObservation || lastRecordFilesLink) && (
              <ul className="list-disc list-inside mt-2 space-y-1.5 text-xs text-gray-700 text-left w-full max-w-xs sm:max-w-none sm:w-auto mx-auto sm:mx-0">
                {lastRecordObservation && (
                  <li id={`obs-item-${indicator.id}`}>
                    <strong className="font-medium text-gray-600">Obs:</strong>{' '}
                    <span id={`obs-text-${indicator.id}`} className="leading-relaxed">
                      {isObservationExpanded || lastRecordObservation.length <= MAX_OBS_LENGTH
                        ? lastRecordObservation
                        : `${lastRecordObservation.substring(0, MAX_OBS_LENGTH)}...`}
                    </span>
                    {lastRecordObservation.length > MAX_OBS_LENGTH && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsObservationExpanded(!isObservationExpanded);
                        }}
                        className="ml-1 text-primary hover:underline text-xs font-semibold"
                        aria-expanded={isObservationExpanded}
                        aria-controls={`obs-text-${indicator.id}`} 
                      >
                        {isObservationExpanded ? 'Ver menos' : 'Ver mais'}
                      </button>
                    )}
                  </li>
                )}

                {lastRecordFilesLink && (
                  <li>
                    <strong className="font-medium text-gray-600">Arquivos:</strong>{' '}
                    <a
                      href={lastRecordFilesLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:underline break-all"
                    >
                      Abrir Link
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Média 7 Dias Column */}
          <div className="flex flex-col items-center justify-start text-center mt-4 sm:mt-0">
            <p className="text-xs text-gray-500 uppercase whitespace-nowrap tracking-wide">Média 7 Dias</p>
            {renderFormattedValue(average7Days, format, unit)}
          </div>

          {/* Média 30 Dias Column */}
          <div className="flex flex-col items-center justify-start text-center mt-4 sm:mt-0">
            <p className="text-xs text-gray-500 uppercase whitespace-nowrap tracking-wide">Média 30 Dias</p>
            {renderFormattedValue(average30Days, format, unit)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndicatorTile;