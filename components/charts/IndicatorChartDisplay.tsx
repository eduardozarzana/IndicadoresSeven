
import React from 'react';
import { Indicator } from '../../types';
import ValueTargetBarPair from './ValueTargetBarPair';

interface IndicatorChartDisplayProps {
  indicator: Indicator;
}

const IndicatorChartDisplay: React.FC<IndicatorChartDisplayProps> = ({ indicator }) => {
  const { name, value, target, average7Days, average30Days, format, unit } = indicator;

  if (target === undefined || target === null) {
    return null; // Não renderizar gráfico se não houver meta
  }

  // Determinar o valor máximo para a escala das barras, considerando apenas valores numéricos
  const valuesToConsider: number[] = [target];
  if (typeof value === 'number') valuesToConsider.push(value);
  if (typeof average7Days === 'number') valuesToConsider.push(average7Days);
  if (typeof average30Days === 'number') valuesToConsider.push(average30Days);
  
  const maxValueForScale = valuesToConsider.length > 0 ? Math.max(...valuesToConsider.map(v => Math.abs(v)), 0) : 100;
  
  // Se todos os valores relevantes (value, avg7, avg30) forem não numéricos (N/A, N/D), não renderizar o gráfico.
  const hasNumericValues = typeof value === 'number' || typeof average7Days === 'number' || typeof average30Days === 'number';
  if (!hasNumericValues) {
      return (
        <div className="bg-violet-50 p-5 rounded-xl shadow-sm my-3.5">
          <h3 className="text-base font-semibold text-gray-900 mb-2" title={name}>
            {name}
          </h3>
          <p className="text-sm text-neutral">Não há dados numéricos suficientes para exibir o gráfico deste indicador.</p>
           <p className="text-xs text-gray-500 mt-1">Meta: {target.toLocaleString('pt-BR')}{unit ? ` ${unit}`: ''}</p>
        </div>
      );
  }


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
          metricName="Média 7 Dias"
          metricValue={average7Days !== undefined ? average7Days : 'N/D'}
          targetValue={target}
          maxValueForScale={maxValueForScale}
          format={format}
          unit={unit}
        />
        <ValueTargetBarPair
          metricName="Média 30 Dias"
          metricValue={average30Days !== undefined ? average30Days : 'N/D'}
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
