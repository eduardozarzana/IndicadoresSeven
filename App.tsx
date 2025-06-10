
import React, { useState, useEffect, useCallback } from 'react';
import { DashboardData, FormDataEntry, ViewMode, Sector, Indicator } from './types'; // Added Sector, Indicator, ViewMode
import { fetchDataFromGoogleAppsScript, submitFormDataToGoogleScript } from './services/googleSheetService'; 
import DashboardDisplay from './components/DashboardDisplay';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ErrorDisplay from './components/shared/ErrorDisplay';
import { mockSectors } from './services/mockDataService'; // Import mockSectors directly
import DataEntryForm from './components/DataEntryForm';
import ChartsView from './components/ChartsView';

const GOOGLE_APPS_SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbwNtVU7GEFlKlU9PlNSKN-84UIEAGPGG-9VcL9_jKa9PCTh5x0KNTsC59JFvtxuBgkoIw/exec'; 

const App: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSourceMessage, setDataSourceMessage] = useState<string>('');

  const [showDataEntryForm, setShowDataEntryForm] = useState<boolean>(false);
  const [formSubmissionStatus, setFormSubmissionStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.List);

  const loadData = useCallback(async (isRetry: boolean = false) => {
    if (!isRetry) setIsLoading(true);
    setError(null);
    // Don't reset dataSourceMessage on retry, so user knows original status if retry fails
    // if (!isRetry) setDataSourceMessage('');

    const forcedTitle = "Indicadores Seven";
    let liveData: DashboardData | null = null;
    let liveDataError: string | null = null;

    // 1. Attempt to fetch live data if URL is provided
    if (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.trim() !== '') {
      try {
        liveData = await fetchDataFromGoogleAppsScript(GOOGLE_APPS_SCRIPT_URL);
        if (!isRetry) setDataSourceMessage('Dados carregados e mesclados do Google Sheets.');
      } catch (scriptError) {
        console.error("Falha ao buscar dados do Google Apps Script:", scriptError);
        liveDataError = scriptError instanceof Error ? scriptError.message : String(scriptError);
        if (!isRetry) setDataSourceMessage(`Falha ao carregar do Google Sheets (${liveDataError}). Usando estrutura base com dados de exemplo.`);
      }
    } else {
      if (!isRetry) setDataSourceMessage('URL do Google Apps Script não fornecida. Exibindo dados de exemplo.');
    }

    // 2. Start with mockSectors as the base structure and order (deep copy)
    const baseStructureSectors: Sector[] = JSON.parse(JSON.stringify(mockSectors));
    let finalSectors = baseStructureSectors;
    let finalLastUpdated = new Date().toISOString(); // Default to now
    let finalTitle = forcedTitle;

    // 3. Merge live data into the mock structure if live data exists
    if (liveData && liveData.sectors) {
      finalLastUpdated = liveData.lastUpdated || finalLastUpdated;
      finalTitle = liveData.title || finalTitle;

      const liveSectorsMap = new Map<string, Sector>();
      liveData.sectors.forEach(sector => liveSectorsMap.set(sector.id, sector));

      finalSectors = baseStructureSectors.map(mockSector => {
        const liveSectorData = liveSectorsMap.get(mockSector.id);
        
        if (liveSectorData) {
          const liveIndicatorsMap = new Map<string, Indicator>();
          liveSectorData.indicators.forEach(indicator => liveIndicatorsMap.set(indicator.id, indicator));

          const mergedIndicators = mockSector.indicators.map(mockIndicator => {
            const liveIndicatorData = liveIndicatorsMap.get(mockIndicator.id);
            if (liveIndicatorData) {
              return {
                // From Mock (structural, defaults like name, format, isMandatory)
                id: mockIndicator.id,
                name: mockIndicator.name,
                format: mockIndicator.format,
                isMandatory: mockIndicator.isMandatory,

                // From Live Data (dynamic values, trend, observations)
                value: liveIndicatorData.value,
                trend: liveIndicatorData.trend,
                average7Days: liveIndicatorData.average7Days,
                average30Days: liveIndicatorData.average30Days,
                lastRecordObservation: liveIndicatorData.lastRecordObservation,
                lastRecordFilesLink: liveIndicatorData.lastRecordFilesLink,
                
                // Meta and Unit: Prefer live, fallback to mock
                target: liveIndicatorData.target !== undefined ? liveIndicatorData.target : mockIndicator.target,
                unit: liveIndicatorData.unit !== undefined ? liveIndicatorData.unit : mockIndicator.unit,
                // Description: Prefer live, fallback to mock
                description: liveIndicatorData.description !== undefined ? liveIndicatorData.description : mockIndicator.description,
              };
            }
            return mockIndicator; // Live data not found for this indicator, use mock
          });
          
          // Merge sector-level details
          return {
            ...mockSector, // Base structure from mock (id, name)
            indicators: mergedIndicators,
            description: liveSectorData.description !== undefined ? liveSectorData.description : mockSector.description,
            sectorObservation: liveSectorData.sectorObservation !== undefined ? liveSectorData.sectorObservation : mockSector.sectorObservation,
            sectorFilesLink: liveSectorData.sectorFilesLink !== undefined ? liveSectorData.sectorFilesLink : mockSector.sectorFilesLink,
          };
        }
        return mockSector; // Live data not found for this sector, use mock
      });
    } else if (liveDataError && !isRetry) {
      // Message already set, error will be displayed if needed.
      // finalSectors remains baseStructureSectors (mock data).
    }

    setDashboardData({
      title: finalTitle,
      sectors: finalSectors,
      lastUpdated: finalLastUpdated,
    });

    if (liveDataError && !liveData && !isRetry) { // If live data fetch failed AND we have no live data to show
        setError(liveDataError); // Set error to display ErrorDisplay component if appropriate
    }

    setIsLoading(false);
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormSubmit = async (formDataList: FormDataEntry[]) => {
    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.trim() === '') {
      setFormSubmissionStatus({ type: 'error', message: 'URL do Google Apps Script não configurada para envio.' });
      return;
    }
    if (formDataList.length === 0) {
      setFormSubmissionStatus({ type: 'info', message: 'Nenhum dado de indicador foi preenchido para enviar.' });
      return;
    }

    setIsSubmittingForm(true);
    setFormSubmissionStatus(null);
    
    let successCount = 0;
    let errorCount = 0;
    let firstErrorMessage = '';

    for (const formData of formDataList) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); 
        await submitFormDataToGoogleScript(GOOGLE_APPS_SCRIPT_URL, formData);
        successCount++;
      } catch (err) {
        errorCount++;
        const message = err instanceof Error ? err.message : 'Falha ao enviar um dos registros.';
        if (!firstErrorMessage) {
          firstErrorMessage = message;
        }
        if (message.includes("DUPLICATE_ENTRY")) {
            firstErrorMessage = message.replace("DUPLICATE_ENTRY:", "").trim();
        }
        console.error("Erro na submissão de um item do formulário:", err, formData);
      }
    }
    setIsSubmittingForm(false);

    if (errorCount > 0) {
      setFormSubmissionStatus({ 
        type: 'error', 
        message: `Falha ao enviar ${errorCount > 1 ? `${errorCount} de ${formDataList.length} registros` : '1 registro'}. ${firstErrorMessage}` 
      });
    } else {
      setFormSubmissionStatus({ 
        type: 'success', 
        message: `${successCount} registro(s) do setor foram salvos com sucesso!` 
      });
      setShowDataEntryForm(false); 
    }
    await loadData(true); 
  };

  if (isLoading && !dashboardData) { // Show main loader only on initial load
    return <LoadingSpinner />;
  }

  const renderControls = () => (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-[-2rem] mb-6 flex flex-col sm:flex-row justify-between items-center">
      <div className="flex space-x-2 mb-4 sm:mb-0">
        <button
          onClick={() => setCurrentView(ViewMode.List)}
          disabled={currentView === ViewMode.List || isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
            currentView === ViewMode.List 
              ? 'bg-primary text-white cursor-default' 
              : 'bg-slate-200 text-neutral hover:bg-slate-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-pressed={currentView === ViewMode.List}
        >
          Visualizar Lista
        </button>
        <button
          onClick={() => setCurrentView(ViewMode.Charts)}
          disabled={currentView === ViewMode.Charts || isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
            currentView === ViewMode.Charts 
              ? 'bg-primary text-white cursor-default' 
              : 'bg-slate-200 text-neutral hover:bg-slate-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-pressed={currentView === ViewMode.Charts}
        >
          Visualizar Gráficos
        </button>
      </div>
      <button
        onClick={() => {
          setShowDataEntryForm(true);
          setFormSubmissionStatus(null); 
        }}
        disabled={isLoading}
        className={`px-5 py-2.5 text-sm font-medium text-base bg-accent hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-300 rounded-lg shadow-md transition-all duration-150 ease-in-out ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Abrir formulário de entrada de dados"
      >
        Lançar Dados Diários
      </button>
    </div>
  );

  return (
    <>
      {renderControls()}

      {dataSourceMessage && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-2">
            <div className={`p-3 rounded-md text-sm ${error ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                {dataSourceMessage}
            </div>
          </div>
      )}
      
      {/* Show main error display only if loading finished, there's an error, AND no data (even mock) is set */}
      {isLoading && !dashboardData && <LoadingSpinner />}
      {!isLoading && error && !dashboardData && (
        <ErrorDisplay message={error} onRetry={() => loadData(false)} /> // Full retry on error if no data
      )}

      {dashboardData && currentView === ViewMode.List && <DashboardDisplay data={dashboardData} />}
      {dashboardData && currentView === ViewMode.Charts && <ChartsView data={dashboardData} />}
      
      {!isLoading && !error && !dashboardData && (
         <div className="text-center py-10">
            <p className="text-xl text-gray-500">Nenhum dado disponível para exibição.</p>
        </div>
      )}

      {showDataEntryForm && dashboardData && (
        <DataEntryForm
          sectorsData={dashboardData.sectors} // This will now be the merged data
          onSubmit={handleFormSubmit}
          onClose={() => setShowDataEntryForm(false)}
          isLoading={isSubmittingForm}
        />
      )}

      {formSubmissionStatus && (
        <div 
            className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-base z-50 max-w-sm ${
            formSubmissionStatus.type === 'success' ? 'bg-green-500' : 
            formSubmissionStatus.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            role="alert"
        >
          <div className="flex items-center">
            {formSubmissionStatus.type === 'success' && (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
            )}
            {formSubmissionStatus.type === 'error' && (
             <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
            )}
            {formSubmissionStatus.type === 'info' && (
             <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
            )}
            <span>{formSubmissionStatus.message}</span>
          </div>
          <button 
            onClick={() => setFormSubmissionStatus(null)} 
            className="absolute top-1 right-2 text-xl leading-none text-inherit hover:text-gray-300"
            aria-label="Fechar notificação"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
};

export default App;
