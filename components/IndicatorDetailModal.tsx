import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { Indicator } from '../types';
import { shouldUseSummation } from '../config/indicatorConfig';

// Helper de formatação de valor
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


// Custom Tooltip para o gráfico
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const { format, unit } = payload[0].payload.indicator;
    
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-700">{`Data: ${data.formattedDate}`}</p>
        <p className="text-primary">{`Valor: ${formatValue(value, format, unit)}`}</p>
      </div>
    );
  }
  return null;
};

// Props para o sub-componente MetricDisplay, tornando-o mais robusto.
interface MetricDisplayProps {
  label: string;
  value: string | number | undefined | null;
  isTarget?: boolean;
  format: Indicator['format'];
  unit: Indicator['unit'];
}

// Sub-componente para exibir uma métrica. Agora é mais robusto e recebe todas as suas dependências como props.
const MetricDisplay: React.FC<MetricDisplayProps> = ({ label, value, isTarget, format, unit }) => (
  <div className="bg-violet-50 p-4 rounded-lg text-center shadow-sm">
    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-2xl font-bold ${isTarget ? 'text-accent' : 'text-primary'}`}>
      {formatValue(value, format, unit)}
    </p>
  </div>
);

interface IndicatorDetailModalProps {
  indicator: Indicator;
  onClose: () => void;
}

const IndicatorDetailModal: React.FC<IndicatorDetailModalProps> = ({ indicator, onClose }) => {
  const { name, value, format, unit, average7Days, average30Days, sum7Days, sum30Days, target, description, lastRecordObservation, lastRecordFilesLink, originalId } = indicator;

  const chartData = useMemo(() => {
    if (!indicator.historicalData) return [];
    
    return indicator.historicalData
      .map(d => ({
        ...d,
        value: typeof d.value === 'number' ? d.value : null,
        formattedDate: new Date(d.date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        indicator,
      }))
      .filter(d => d.value !== null)
      .reverse(); // historicalData é mais novo->mais antigo, gráfico precisa mais antigo->mais novo
  }, [indicator]);

  // Lógica centralizada para decidir entre média e soma.
  const useSum = shouldUseSummation(originalId);

  const metric7Days = useSum ? sum7Days : average7Days;
  const metric30Days = useSum ? sum30Days : average30Days;
  const label7Days = useSum ? 'Soma 7 Dias' : 'Média 7 Dias';
  const label30Days = useSum ? 'Soma 30 Dias' : 'Média 30 Dias';


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="indicator-detail-title"
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
          <h2 id="indicator-detail-title" className="text-xl sm:text-2xl font-bold text-primary">{name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
            aria-label="Fechar detalhes do indicador"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto flex-grow pr-2 space-y-6">
          {/* Key Metrics */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricDisplay label="Último Registro" value={value} format={format} unit={unit} />
              <MetricDisplay label={label7Days} value={metric7Days} format={format} unit={unit} />
              <MetricDisplay label={label30Days} value={metric30Days} format={format} unit={unit} />
              <MetricDisplay label="Meta" value={target} isTarget format={format} unit={unit} />
            </div>
          </section>

          {/* Chart */}
          {chartData.length > 1 ? (
             <section>
              <h3 className="text-lg font-semibold text-neutral mb-3">Histórico de Dados</h3>
              <div className="w-full h-72 bg-slate-50 p-2 rounded-lg">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={['dataMin', 'dataMax']} allowDataOverflow={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name={unit || 'Valor'} stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    {target !== undefined && typeof target === 'number' && (
                        <Line type="monotone" dataKey={() => target} name="Meta" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Não há dados históricos suficientes para exibir um gráfico.
            </div>
          )}

          {/* Additional Info */}
          <section className="space-y-4">
            {description && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-neutral mb-1">Descrição do Indicador</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{description}</p>
              </div>
            )}
             {(lastRecordObservation || lastRecordFilesLink) && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-neutral mb-2">Detalhes do Último Registro</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    {lastRecordObservation && (
                         <li><strong className="font-medium text-gray-700">Observação:</strong> {lastRecordObservation}</li>
                    )}
                    {lastRecordFilesLink && (
                        <li>
                            <strong className="font-medium text-gray-700">Arquivos:</strong>{' '}
                            <a href={lastRecordFilesLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                Abrir Link
                            </a>
                        </li>
                    )}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default IndicatorDetailModal;