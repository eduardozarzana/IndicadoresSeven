
import React from 'react';
import { Sector, Indicator } from '../types';
import IndicatorTile from './IndicatorTile';

// Heroicon: ChartBarIcon (example - ensure you have a similar icon or use an actual SVG)
const ChartBarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-primary mr-3 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

interface SectorViewProps {
  sector: Sector;
  onSelectIndicator: (indicator: Indicator) => void;
}

const SectorView: React.FC<SectorViewProps> = ({ sector, onSelectIndicator }) => {
  const hasDescription = !!sector.description;
  const hasSectorObservation = !!sector.sectorObservation;
  const hasSectorFilesLink = !!sector.sectorFilesLink;

  return (
    <section key={sector.id} className="mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex items-center mb-3 pb-3 border-b border-gray-200">
        <ChartBarIcon />
        <h2 className="text-xl sm:text-2xl font-semibold text-primary">{sector.name}</h2>
      </div>

      {/* Indicators list or 'no indicators' message */}
      {sector.indicators.length > 0 ? (
        <div className="space-y-3.5">
          {sector.indicators.map(indicator => (
            <IndicatorTile key={indicator.id} indicator={indicator} onSelectIndicator={onSelectIndicator} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mt-2 mb-3">Nenhum indicador disponível para este setor.</p>
      )}

      {/* Sector Description (now labeled "Observação do Setor") - styled like an indicator tile */}
      {hasDescription && (
        <div className="bg-violet-50 hover:bg-violet-100 transition-colors duration-200 p-5 rounded-xl shadow-sm mt-3.5">
          <h4 className="text-base font-semibold text-gray-900 mb-2">Observação do Setor</h4>
          <p className="text-sm text-neutral whitespace-pre-wrap break-words italic">{sector.description}</p>
        </div>
      )}

      {/* Original Sector Observation - styled like an indicator tile, with conditional heading */}
      {hasSectorObservation && (
         <div className="bg-violet-50 hover:bg-violet-100 transition-colors duration-200 p-5 rounded-xl shadow-sm mt-3.5">
            <h4 className="text-base font-semibold text-gray-900 mb-2">
              {hasDescription ? "Observações Complementares" : "Observação do Setor"}
            </h4>
            <p className="text-sm text-neutral whitespace-pre-wrap break-words">{sector.sectorObservation}</p>
        </div>
      )}

      {/* Sector Files Link - styled like an indicator tile */}
      {hasSectorFilesLink && (
        <div className="bg-violet-50 hover:bg-violet-100 transition-colors duration-200 p-5 rounded-xl shadow-sm mt-3.5">
          <h4 className="text-base font-semibold text-gray-900 mb-2">Arquivos do Setor</h4>
          <a
            href={sector.sectorFilesLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all"
            aria-label={`Abrir link de arquivos para o setor ${sector.name}`}
          >
            Abrir Link de Arquivos do Setor
          </a>
        </div>
      )}
    </section>
  );
};

export default SectorView;