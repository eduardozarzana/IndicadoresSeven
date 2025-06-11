import React from 'react';
import { Indicator } from '../../types'; // Usaremos para formatação

// Helper de formatação ajustado
const formatChartValue = (
  value: number | string, 
  format?: 'currency' | 'percentage' | 'number', 
  unitForDisplay?: string
): string => {
  const displayUnit = unitForDisplay; 

  if (value === 'N/A' || value === 'N/D' || value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim() === '') {
    return value;
  }
  
  let numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;

  if (typeof value === 'string' && isNaN(numericValue)) {
    return `${value}${displayUnit && !value.includes(displayUnit) ? ` ${displayUnit}` : ''}`;
  }
  // Agora numericValue é um número

  let formattedString: string;
  const valueStr = String(numericValue); // String representation of the number

  switch (format) {
    case 'currency':
      const currencyCode = (displayUnit && displayUnit.length === 3) ? displayUnit : 'BRL';
      formattedString = numericValue.toLocaleString('pt-BR', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
      break;
    case 'percentage':
      const percentSuffix = (displayUnit === undefined || displayUnit === '%') ? '%' : ` ${displayUnit}`;
      let originalPercentDecimals = 0;
      if (valueStr.includes('.')) {
        const decimalPart = valueStr.split('.')[1];
        if (decimalPart) {
          originalPercentDecimals = decimalPart.length;
        }
      }
      // Ajuste para evitar que números como 56.0 sejam exibidos como "56.0" (queremos "56")
      // Se for um inteiro (ex: 56, ou 56.000), originalPercentDecimals será 0 após a conversão para número,
      // a menos que queiramos preservar os zeros à direita do input string original.
      // parseFloat("56.0") is 56. So String(numericValue) for 56.0 (input string) would be "56".
      // We need to look at the original `value` if it was a string with trailing zeros.
      let effectivePercentDecimals = 0;
      if (typeof value === 'string' && value.includes('.')) {
          const originalDecimalPart = value.split('.')[1];
          if (originalDecimalPart) effectivePercentDecimals = originalDecimalPart.length;
      } else if (String(numericValue).includes('.')) {
          const numericDecimalPart = String(numericValue).split('.')[1];
          if (numericDecimalPart) effectivePercentDecimals = numericDecimalPart.length;
      }


      formattedString = numericValue.toLocaleString('pt-BR', { 
        minimumFractionDigits: effectivePercentDecimals, 
        maximumFractionDigits: effectivePercentDecimals 
      }) + percentSuffix;
      break;
    case 'number':
    default:
      let originalNumDecimals = 0;
      // Similar logic for decimals as percentage
      if (typeof value === 'string' && value.includes('.')) {
          const originalDecimalPart = value.split('.')[1];
          if (originalDecimalPart) originalNumDecimals = originalDecimalPart.length;
      } else if (String(numericValue).includes('.')) { // numericValue is definitely a number here
          const numericDecimalPart = String(numericValue).split('.')[1];
          if (numericDecimalPart) originalNumDecimals = numericDecimalPart.length;
      }

      formattedString = numericValue.toLocaleString('pt-BR', { 
        minimumFractionDigits: originalNumDecimals, 
        maximumFractionDigits: originalNumDecimals 
      });
      
      if (displayUnit && !formattedString.endsWith(displayUnit)) {
         formattedString += ` ${displayUnit}`;
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
  const isMetricNumeric = typeof metricValue === 'number' || (typeof metricValue === 'string' && !isNaN(parseFloat(metricValue.replace(',', '.'))));
  const numericMetricValue = isMetricNumeric ? (typeof metricValue === 'number' ? metricValue : parseFloat(metricValue.replace(',', '.'))) : 0;


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
