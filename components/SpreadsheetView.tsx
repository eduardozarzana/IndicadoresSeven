
import React from 'react';
import { DashboardData, Indicator } from '../types';

// Helper de formatação de valor, similar ao de IndicatorTile, para consistência.
const formatValue = (value: number | string | undefined | null, format?: 'currency' | 'percentage' | 'number', unitForDisplay?: string): string => {
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

// Helper para obter as datas dos últimos 'days' dias, começando de ontem.
const getPastDates = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) { // Começa em i = 1 (ontem)
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates; // Retorna [ontem, anteontem, ...]
};

const SpreadsheetView: React.FC<{ data: DashboardData }> = ({ data }) => {
  const { sectors, lastUpdated, title } = data;
  const dateHeaders = getPastDates(7);

  const formattedLastUpdated = new Date(lastUpdated).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  return (
    <div className="container mx-auto">
      <header className="mb-8 pb-4 border-b border-gray-300">
        <h1 className="text-4xl font-bold text-primary mb-2">{title} - Planilha de Registros</h1>
        <p className="text-sm text-gray-500">Exibindo registros dos 7 dias anteriores (hoje não incluso). Atualizado em: {formattedLastUpdated}</p>
      </header>
      
      {sectors.map(sector => (
        <section key={`${sector.id}-spreadsheet`} className="mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <div className="flex items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-primary">{sector.name}</h2>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="sticky left-0 bg-slate-100 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider z-10 w-1/3">
                    Indicador
                  </th>
                  {dateHeaders.map(dateStr => {
                    const dateObj = new Date(dateStr + 'T12:00:00Z'); // Use T12 to avoid timezone issues
                    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    return (
                      <th key={dateStr} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                        {formattedDate}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sector.indicators.length > 0 ? sector.indicators.map(indicator => {
                  // Mapeia dados históricos para busca rápida por data
                  const valuesByDate = new Map(indicator.historicalData?.map(h => [h.date, h.value]));

                  return (
                    <tr key={indicator.id} className="even:bg-slate-50 hover:bg-violet-50 transition-colors duration-150">
                      <td className="sticky left-0 bg-inherit px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate" title={indicator.name}>
                        {indicator.name}
                      </td>
                      {dateHeaders.map(date => (
                        <td key={date} className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                          {formatValue(valuesByDate.get(date), indicator.format, indicator.unit)}
                        </td>
                      ))}
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={dateHeaders.length + 1} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum indicador disponível para este setor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};

export default SpreadsheetView;