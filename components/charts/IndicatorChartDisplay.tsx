import React from 'react';
import { Indicator } from '../../types';
import ValueTargetBarPair, { formatChartValue } from './ValueTargetBarPair';
import { shouldUseSummation } from '../../config/indicatorConfig';

interface IndicatorChartDisplayProps {
  indicator: Indicator;
}

const IndicatorChartDisplay: React.FC<IndicatorChartDisplayProps> = ({ indicator }) => {
  const { name, value, target, average7Days, average30Days, sum7Days, sum30Days, format, unit, originalId } = indicator;

  if (target === undefined || target === null) {
    return null; // Não renderizar gráfico se não houver meta
  }

  // Determinar o valor máximo para a escala das barras, considerando apenas valores numéricos
  const valuesToConsider: number[] = [target];
  if (typeof value === 'number') valuesToConsider.push(value);
  if (typeof average7Days === 'number') valuesToConsider.push(average7Days);
  if (typeof average30Days === 'number') valuesToConsider.push(average30Days);
  if (typeof sum7Days === 'number') valuesToConsider.push(sum7Days); // Considerar somas na escala
  if (typeof sum30Days === 'number') valuesToConsider.push(sum30Days); // Considerar somas na escala
  
  const maxValueForScale = valuesToConsider.length > 0 ? Math.max(...valuesToConsider.map(v => Math.abs(v)), 0) : 100;
  
  // Se todos os valores relevantes (value, avg7, avg30) forem não numéricos (N/A, N/D), não renderizar o gráfico.
  const hasNumericValues = typeof value === 'number' || typeof average7Days === 'number' || typeof average30Days === 'number' || typeof sum7Days === 'number' || typeof sum30Days === 'number';
  if (!hasNumericValues) {
      return (
        <div className="bg-violet-50 p-5 rounded-xl shadow-sm my-3.5">
          <h3 className="text-base font-semibold text-gray-900 mb-2" title={name}>
            {name}
          </h3>
          <p className="text-sm text-neutral">Não há dados numéricos suficientes para exibir o gráfico deste indicador.</p>
           {/* CORREÇÃO: Usa a função de formatação segura importada */}
           <p className="text-xs text-gray-500 mt-1">Meta: {formatChartValue(target, format, unit)}</p>
        </div>
      );
  }

  // Lógica para decidir entre média e soma, agora usando a função centralizada.
  const useSum = shouldUseSummation(originalId);

  const metric7Days = useSum ? sum7Days : average7Days;
  const metric30Days = useSum ? sum30Days : average30Days;
  const label7Days = useSum ? 'Soma 7 Dias' : 'Média 7 Dias';
  const label30Days = useSum ? 'Soma 30 Dias' : 'Média 30 Dias';

  return (
    <div className="bg-violet-100 p-4 rounded-xl shadow-md my-3.5">
      <h3 className="text-base font-semibold text-gray-900 mb-3 text-center" title={name}> {/* Changed text-primary to text-gray-900 */}
        {name}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ValueTargetBarPair
          metricName="Último Registro"
          metricValue={value}
          targetValue={target}
          maxValueForScale={maxValueForScale}
          format={format}
          unit={unit}
        />
        <ValueTargetBarPair
          metricName={label7Days}
          metricValue={metric7Days !== undefined ? metric7Days : '-'}
          targetValue={target}
          maxValueForScale={maxValueForScale}
          format={format}
          unit={unit}
        />
        <ValueTargetBarPair
          metricName={label30Days}
          metricValue={metric30Days !== undefined ? metric30Days : '-'}
          targetValue={target}
          maxValueForScale={maxValueForScale}
          format={format}
          unit={unit}
        />
      </div>
    </div>
  );
};

export default IndicatorChartDisplay;