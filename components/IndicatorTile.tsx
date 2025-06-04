
import React, { useState } from 'react';
import { Indicator } from '../types';

// Helper to format values, handling numbers, percentages, currency, and units.
// Also handles 'N/A' or empty strings by returning them as is.
const formatValue = (value: number | string, format?: 'currency' | 'percentage' | 'number', unitForDisplay?: string): string => {
  let displayUnit = unitForDisplay;

  // Handle N/A or specifically empty strings directly
  if (value === 'N/A' || value === 'N/D' || (typeof value === 'string' && value.trim() === '')) {
    return typeof value === 'string' ? value : String(value);
  }
  
  let numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;

  if (typeof value === 'string' && isNaN(numericValue)) {
    // If it's a string that can't be parsed to a number, return it with unit if applicable
    return `${value}${displayUnit && !value.includes(displayUnit) ? ` ${displayUnit}` : ''}`;
  }
  // At this point, numericValue is a number or value was originally a number

  let formattedString: string;
  switch (format) {
    case 'currency':
      // Ensure 'BRL' is used if displayUnit is not a valid currency code for toLocaleString
      const currencyCode = (displayUnit && displayUnit.length === 3) ? displayUnit : 'BRL';
      formattedString = numericValue.toLocaleString('pt-BR', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
      break;
    case 'percentage':
      const percentSuffix = (displayUnit === undefined || displayUnit === '%') ? '%' : ` ${displayUnit}`;
      // Ensure two decimal places for percentages like 56.40%
      formattedString = `${numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${percentSuffix}`;
      break;
    case 'number':
    default:
      // For numbers, if it's an integer, display as integer. If float, display with appropriate decimals.
      const isInteger = Number.isInteger(numericValue);
      formattedString = numericValue.toLocaleString('pt-BR', { 
        minimumFractionDigits: isInteger ? 0 : (String(numericValue).includes('.') ? String(numericValue).split('.')[1].length : 0),
        maximumFractionDigits: 10 
      });
      if (displayUnit) { // Don't add unit if it's already '%' from percentage format (already handled by percentage case)
        // Avoid double unit if unit is already part of the value (e.g. "8.5 /10")
        if (!formattedString.endsWith(displayUnit)) {
             formattedString += ` ${displayUnit}`;
        }
      }
      break;
  }
  return formattedString;
};


const IndicatorTile: React.FC<{ indicator: Indicator }> = ({ indicator }) => {
  const { name, value, unit, format, average7Days, average30Days, lastRecordObservation, lastRecordFilesLink, target } = indicator;
  const [isObservationExpanded, setIsObservationExpanded] = useState(false);

  const renderFormattedValue = (val: number | string | undefined, fmt: typeof format, unt: typeof unit, isTarget: boolean = false) => {
    if (val === 'N/D' || val === undefined || val === null || String(val).trim() === '' || val === "N/A") {
      return <span className="text-xl font-bold text-gray-900">N/A</span>; // Changed N/A color to gray-900
    }
    // Changed text-primary to text-gray-900 and text-accent to text-neutral
    const valueClass = isTarget ? "text-lg font-semibold text-neutral" : "text-xl font-bold text-gray-900";
    return <span className={valueClass}>{formatValue(val, fmt, unt)}</span>;
  };
  
  const MAX_OBS_LENGTH = 60;

  return (
    <div className="bg-violet-50 hover:bg-violet-100 transition-colors duration-200 p-5 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <h3 className="text-base font-semibold text-gray-900 mb-3 sm:mb-0 sm:w-2/5 md:w-1/3 truncate" title={name}>
          {name}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 sm:w-3/5 md:w-2/3">
          {/* Último Registro Column */}
          <div className="flex flex-col items-center justify-start text-center">
            <p className="text-xs text-gray-500 uppercase whitespace-nowrap tracking-wide">Último Registro</p>
            {renderFormattedValue(value, format, unit)}
            
            {/* Target Display */}
            {target !== undefined && (
              <div className="mt-1.5">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Meta: </span>
                {renderFormattedValue(target, format, unit, true)}
              </div>
            )}

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
                        onClick={() => setIsObservationExpanded(!isObservationExpanded)}
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
