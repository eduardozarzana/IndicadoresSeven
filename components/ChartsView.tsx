
import React from 'react';
import { DashboardData, Sector, Indicator } from '../types';
import IndicatorChartDisplay from './charts/IndicatorChartDisplay';

// Ícone para a seção do setor (semelhante ao SectorView)
const ChartBarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-primary mr-3 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

interface ChartsViewProps {
  data: DashboardData;
}

const ChartsView: React.FC<ChartsViewProps> = ({ data }) => {
  const { title, sectors, lastUpdated } = data;

  const formattedLastUpdated = new Date(lastUpdated).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 pb-4 border-b border-gray-300">
        <h1 className="text-4xl font-bold text-primary mb-2">{title} - Gráficos de Metas</h1>
        <p className="text-sm text-gray-500">Última atualização: {formattedLastUpdated}</p>
      </header>
      
      {sectors.length > 0 ? (
        sectors.map(sector => {
          const indicatorsWithTargets = sector.indicators.filter(
            indicator => indicator.target !== undefined && 
                         indicator.target !== null && 
                         typeof indicator.target === 'number'
          );

          if (indicatorsWithTargets.length === 0) {
            return null; // Não renderizar o setor se não houver indicadores com metas numéricas válidas
          }

          return (
            <section key={`${sector.id}-charts`} className="mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
                <ChartBarIcon />
                <h2 className="text-xl sm:text-2xl font-semibold text-primary">{sector.name}</h2>
              </div>

              {indicatorsWithTargets.map(indicator => (
                <IndicatorChartDisplay key={indicator.id} indicator={indicator} />
              ))}
            </section>
          );
        })
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">Nenhum dado de setor para exibir gráficos.</p>
        </div>
      )}
       {sectors.length > 0 && sectors.every(s => s.indicators.filter(ind => ind.target !== undefined && ind.target !== null && typeof ind.target === 'number').length === 0) && (
         <div className="text-center py-10 mt-6">
          <p className="text-lg text-gray-600">Nenhum indicador com meta numérica definida foi encontrado para exibir gráficos.</p>
          <p className="text-sm text-gray-500 mt-1">Verifique se a coluna 'INDICADOR_META' existe e está preenchida corretamente na sua planilha.</p>
        </div>
       )}
    </div>
  );
};

export default ChartsView;
