import React, { useState, useEffect, useCallback } from 'react';
import { DashboardData, FormDataEntry, ViewMode } from './types'; // Added ViewMode
import { fetchDataFromGoogleAppsScript, submitFormDataToGoogleScript } from './services/googleSheetService'; 
import DashboardDisplay from './components/DashboardDisplay';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ErrorDisplay from './components/shared/ErrorDisplay';
import { fetchDashboardData as fetchMockData, mockSectors } from './services/mockDataService';
import DataEntryForm from './components/DataEntryForm';
import ChartsView from './components/ChartsView'; // Importar a nova visualização de gráficos

const GOOGLE_APPS_SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbwNtVU7GEFlKlU9PlNSKN-84UIEAGPGG-9VcL9_jKa9PCTh5x0KNTsC59JFvtxuBgkoIw/exec'; 

const App: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSourceMessage, setDataSourceMessage] = useState<string>('');

  const [showDataEntryForm, setShowDataEntryForm] = useState<boolean>(false);
  const [formSubmissionStatus, setFormSubmissionStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.List); // Estado para a visualização atual

  const deduplicateArrayById = <T extends { id: string }>(arr: T[]): T[] => {
    if (!arr) return [];
    const uniqueItems: T[] = [];
    const seenIds = new Set<string>();
    for (const item of arr) {
      if (item && item.id && !seenIds.has(item.id)) {
        uniqueItems.push(item);
        seenIds.add(item.id);
      }
    }
    return uniqueItems;
  };

  const loadData = useCallback(async (isRetry: boolean = false) => {
    if (!isRetry) setIsLoading(true);
    setError(null);
    if (!isRetry) setDataSourceMessage('');

    const forcedTitle = "Indicadores Seven";

    try {
      let data: DashboardData;
      if (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.trim() !== '') {
        data = await fetchDataFromGoogleAppsScript(GOOGLE_APPS_SCRIPT_URL);
        if (!isRetry) setDataSourceMessage('Dados carregados do Google Sheets via Apps Script.');
      } else {
        console.warn("URL do Google Apps Script não fornecida. Usando dados mockados.");
        data = await fetchMockData();
        if (!isRetry) setDataSourceMessage('URL do Google Apps Script não fornecida. Exibindo dados de exemplo.');
      }
      data.title = forcedTitle;

      if (data && data.sectors) {
        data.sectors = deduplicateArrayById(data.sectors);
        data.sectors.forEach(sector => {
          if (sector && sector.indicators) {
            sector.indicators = deduplicateArrayById(sector.indicators);
          }
        });
      }
      
      setDashboardData(data);

    } catch (err) {
      console.error("Falha ao buscar dados do painel:", err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao buscar os dados.';
      setError(errorMessage);
      
      if (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.trim() !== '') {
        try {
            console.warn("Tentando carregar dados mockados como fallback após erro do Google Apps Script.");
            let mockData = await fetchMockData();
            mockData.title = forcedTitle; 
            if (mockData && mockData.sectors) {
                mockData.sectors = deduplicateArrayById(mockData.sectors);
                mockData.sectors.forEach(sector => {
                    if (sector && sector.indicators) {
                        sector.indicators = deduplicateArrayById(sector.indicators);
                    }
                });
            }
            setDashboardData(mockData);
            if (!isRetry) setDataSourceMessage(`Falha ao carregar do Google Sheets (${errorMessage}). Exibindo dados de exemplo.`);
        } catch (mockErr) {
            console.error("Falha ao buscar dados mockados como fallback:", mockErr);
             const mockErrorMessage = mockErr instanceof Error ? mockErr.message : 'Falha ao carregar dados de exemplo.';
             setError(`Primário: ${errorMessage}. Fallback: ${mockErrorMessage}`);
             setDashboardData(null); 
        }
      } else { 
        try {
            console.warn("Tentando carregar dados mockados como fallback principal.");
            let mockData = await fetchMockData(); 
            mockData.title = forcedTitle;
            if (mockData && mockData.sectors) {
                mockData.sectors = deduplicateArrayById(mockData.sectors);
                mockData.sectors.forEach(sector => {
                    if (sector && sector.indicators) {
                        sector.indicators = deduplicateArrayById(sector.indicators);
                    }
                });
            }
            setDashboardData(mockData);
            if (!isRetry) setDataSourceMessage('Exibindo dados de exemplo após falha inicial.');
        } catch (finalMockErr) {
            console.error("Falha ao buscar dados mockados como fallback final:", finalMockErr);
            const finalMockErrorMessage = finalMockErr instanceof Error ? finalMockErr.message : 'Falha crítica ao carregar dados de exemplo.';
            setError(finalMockErrorMessage);
            setDashboardData(null);
        }
      }
    } finally {
      if (!isRetry) setIsLoading(false);
    }
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
        // Específico para erro de duplicidade
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

  if (isLoading && !dashboardData) {
    return <LoadingSpinner />;
  }

  if (error && !dashboardData) {
    return <ErrorDisplay message={error} onRetry={() => loadData()} />;
  }
  
  if (!dashboardData) {
    return <ErrorDisplay message={error || "Não foi possível carregar os dados do painel."} onRetry={() => loadData()} />;
  }

  return (
    <div className="min-h-screen bg-base">
      {dataSourceMessage && (
        <div 
          className={`p-2 text-center text-sm ${error && (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.trim() !== '') ? 'bg-yellow-200 text-yellow-800 border-b border-yellow-300' : 'bg-blue-100 text-blue-700 border-b border-blue-200'}`}
          role="alert"
        >
          {dataSourceMessage}
        </div>
      )}
      {error && dashboardData && (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.trim() !== '') && dataSourceMessage.includes("Exibindo dados de exemplo.") && (
         <div className="p-2 text-center text-sm bg-yellow-200 text-yellow-800 border-b border-yellow-300" role="alert">
            Aviso: {error} 
         </div>
       )}

      {formSubmissionStatus && (
        <div 
          className={`p-3 my-2 mx-4 rounded-md text-sm text-center ${formSubmissionStatus.type === 'success' ? 'bg-green-100 text-green-700' : (formSubmissionStatus.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}`}
          role={formSubmissionStatus.type === 'error' ? 'alert' : 'status'}
          aria-live="assertive"
        >
          {formSubmissionStatus.message}
          <button onClick={() => setFormSubmissionStatus(null)} className="ml-4 font-bold hover:opacity-75 p-1 leading-none">Fechar</button>
        </div>
      )}

      <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative">
        <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3">
            <button
                onClick={() => { setShowDataEntryForm(true); setFormSubmissionStatus(null); }}
                className="bg-primary hover:bg-accent text-base font-bold py-3 px-6 rounded-full shadow-lg transition-transform duration-150 ease-in-out hover:scale-105 flex items-center justify-center"
                aria-label="Adicionar Novo Registro"
                title="Adicionar Novo Registro"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Novo Registro
            </button>
        </div>

        {showDataEntryForm && ( 
          <DataEntryForm
            sectorsData={mockSectors} 
            onSubmit={handleFormSubmit}
            onClose={() => setShowDataEntryForm(false)}
            isLoading={isSubmittingForm}
          />
        )}

        {/* Controles de Visualização */}
        <div className="mb-6 flex justify-center space-x-2 bg-slate-200 p-1 rounded-lg shadow">
          <button
            onClick={() => setCurrentView(ViewMode.List)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                        ${currentView === ViewMode.List ? 'bg-primary text-base' : 'bg-transparent text-neutral hover:bg-slate-300'}`}
            aria-pressed={currentView === ViewMode.List}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1.5 align-text-bottom" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Lista
          </button>
          <button
            onClick={() => setCurrentView(ViewMode.Charts)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                        ${currentView === ViewMode.Charts ? 'bg-primary text-base' : 'bg-transparent text-neutral hover:bg-slate-300'}`}
            aria-pressed={currentView === ViewMode.Charts}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1.5 align-text-bottom" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            Gráficos
          </button>
        </div>
        
        {/* Renderização condicional da visualização */}
        {currentView === ViewMode.List && <DashboardDisplay data={dashboardData} />}
        {currentView === ViewMode.Charts && <ChartsView data={dashboardData} />}
        
      </div>
    </div>
  );
};

export default App;