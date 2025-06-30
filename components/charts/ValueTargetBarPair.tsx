
import React from 'react';
import { Indicator } from '../../types'; // Usaremos para formatação

// Helper de formatação exportado para ser reutilizável.
export const formatChartValue = (
  value: number | string, 
  format?: 'currency' | 'percentage' | 'number', 
  unitForDisplay?: string
): string => {
  if (value === 'N/A' || value === 'N/D' || value === '-' || value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (typeof value === 'string' && value.trim().toUpperCase() === '#NUM!')) {
    return '-';
  }
  
  let numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;

  if (typeof value === 'string' && isNaN(numericValue)) {
    // Check if displayUnit exists and is not already part of the value string
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
      
      // Add unit if it exists, not already part of the string, and format is not percentage (which handles its own unit)
      if (unitForDisplay && !formattedString.endsWith(unitForDisplay)) { // Removed redundant format !== 'percentage'
         formattedString += ` ${unitForDisplay}`;
      }
      break;
  }
  return formattedString;
};

interface ValueTargetBarPairProps {
  metricName: string;
  metricValue: number | string; // Pode ser N/A, N/D
  targetValue: number; // A meta é sempre numérica
  maxValueForScale: number; // Para dimensionar a barra corretamente
  format?: Indicator['format'];
  unit?: Indicator['unit'];
}

const ValueTargetBarPair: React.FC<ValueTargetBarPairProps> = ({
  metricName,
  metricValue,
  targetValue,
  maxValueForScale,
  format,
  unit,
}) => {
  const isMetricNumeric = typeof metricValue === 'number';
  const numericMetricValue = isMetricNumeric ? metricValue : parseFloat(String(metricValue).replace(',', '.'));

  const metricPercentage = maxValueForScale > 0 && isMetricNumeric ? (numericMetricValue / maxValueForScale) * 100 : 0;
  const targetPercentage = maxValueForScale > 0 ? (targetValue / maxValueForScale) * 100 : 0;

  let metricBarColor = 'bg-gray-300'; // Cor padrão para N/A ou N/D
  if (isMetricNumeric) {
    metricBarColor = numericMetricValue >= targetValue ? 'bg-green-500' : 'bg-red-500';
  }
  const targetBarColor = 'bg-accent';

  const formattedMetricValue = formatChartValue(metricValue, format, unit);
  const formattedTargetValue = formatChartValue(targetValue, format, unit);

  return (
    <div className="mb-4 p-3 bg-slate-50 rounded-lg shadow-sm">
      <h4 className="text-sm font-medium text-neutral mb-2">{metricName} vs Meta</h4>
      <div className="space-y-2">
        {/* Metric Bar */}
        <div className="flex items-center">
          <div className="w-28 shrink-0 text-xs text-gray-600 truncate" title={metricName}>{metricName}:</div>
          <div className="flex-grow bg-gray-200 rounded-full h-5 mr-2 overflow-hidden">
            <div
              className={`h-5 rounded-full transition-all duration-500 ease-out ${metricBarColor}`}
              style={{ width: `${Math.max(0, Math.min(metricPercentage, 100))}%` }}
              role="progressbar"
              aria-valuenow={isMetricNumeric ? numericMetricValue : undefined}
              aria-valuemin={0}
              aria-valuemax={maxValueForScale}
              aria-label={`${metricName} valor ${formattedMetricValue}`}
            ></div>
          </div>
          <div className="w-20 text-xs font-semibold text-neutral text-right">{formattedMetricValue}</div>
        </div>

        {/* Target Bar */}
        <div className="flex items-center">
          <div className="w-28 shrink-0 text-xs text-gray-600">Meta:</div>
          <div className="flex-grow bg-gray-200 rounded-full h-5 mr-2 overflow-hidden">
            <div
              className={`h-5 rounded-full ${targetBarColor}`}
              style={{ width: `${Math.max(0, Math.min(targetPercentage, 100))}%` }}
              role="progressbar"
              aria-valuenow={targetValue}
              aria-valuemin={0}
              aria-valuemax={maxValueForScale}
              aria-label={`Meta valor ${formattedTargetValue}`}
            ></div>
          </div>
          <div className="w-20 text-xs font-semibold text-neutral text-right">{formattedTargetValue}</div>
        </div>
      </div>
    </div>
  );
};

export default ValueTargetBarPair;