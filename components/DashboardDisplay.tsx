
import React from 'react';
import { DashboardData, Indicator } from '../types';
import SectorView from './SectorView';

interface DashboardDisplayProps {
  data: DashboardData;
  onSelectIndicator: (indicator: Indicator) => void;
}

const DashboardDisplay: React.FC<DashboardDisplayProps> = ({ data, onSelectIndicator }) => {
  const { title, sectors, lastUpdated } = data;

  const formattedLastUpdated = new Date(lastUpdated).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 pb-4 border-b border-gray-300">
        <h1 className="text-4xl font-bold text-primary mb-2">{title}</h1>
        <p className="text-sm text-gray-500">Última atualização: {formattedLastUpdated}</p>
      </header>
      
      {sectors.length > 0 ? (
        sectors.map(sector => (
          <SectorView key={sector.id} sector={sector} onSelectIndicator={onSelectIndicator} />
        ))
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">Nenhum dado de setor para exibir.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardDisplay;