import { DashboardData, FormDataEntry } from '../types';

// Esta função agora espera uma URL de um Google Apps Script implantado como aplicativo da web
// que retorna diretamente um JSON no formato DashboardData.
export const fetchDataFromGoogleAppsScript = async (appsScriptUrl: string): Promise<DashboardData> => {
  console.log("Buscando dados de:", appsScriptUrl); // Log Adicionado
  if (!appsScriptUrl) {
    throw new Error("URL do Google Apps Script não fornecida.");
  }
  try {
    const url = new URL(appsScriptUrl);
    url.searchParams.append('_cacheBust', new Date().getTime().toString());

    const response = await fetch(url.toString(), { cache: "no-store" });
    
    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (e) {
        // Não conseguiu parsear o corpo do erro como JSON
      }
      if (errorBody && errorBody.error) {
          throw new Error(`Erro do Google Apps Script: ${errorBody.error} (Status: ${response.status})`);
      }
      throw new Error(`Erro ao buscar dados do Google Apps Script: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Erro retornado pelo Google Apps Script: ${data.error}`);
    }
    
    if (!data.sectors || !data.lastUpdated || !data.title) {
        console.warn("Dados recebidos do Apps Script não possuem a estrutura DashboardData esperada.", data);
        throw new Error("Formato de dados inválido recebido do Google Apps Script. Verifique o script.");
    }

    // Verifica se os dados históricos existem para a aba "Planilha"
    if (data.sectors && data.sectors.length > 0) {
      const anyIndicatorIsMissingHistoricalData = data.sectors.some(sector =>
        sector.indicators && sector.indicators.some(indicator => indicator.historicalData === undefined)
      );

      if (anyIndicatorIsMissingHistoricalData) {
        const errorMessage = "O script do Google Sheets não está retornando os dados históricos ('historicalData') necessários para a aba 'Planilha'. Por favor, atualize seu script, salve as alterações e faça uma **nova implantação (Deploy > New Deployment)** para que as mudanças tenham efeito.";
        const firstProblematicIndicator = data.sectors
            .flatMap(s => (s.indicators || [])) // ensure indicators array exists
            .find(ind => ind.historicalData === undefined);

        console.error(`PANEL ERROR: ${errorMessage}. The received data object is missing the 'historicalData' property on at least one indicator. Example of problematic indicator:`, firstProblematicIndicator);
        throw new Error(errorMessage);
      }
    }


    if (data.lastUpdated) {
      data.lastUpdated = new Date(data.lastUpdated).toISOString();
    }

    // CLARIFICAÇÃO IMPORTANTE:
    // O Google Apps Script é o responsável por garantir que o campo 'value' de cada indicador,
    // bem como 'lastRecordObservation' e 'lastRecordFilesLink', já correspondam ao
    // REGISTRO MAIS RECENTE desejado (por exemplo, os dados do último dia de registro).
    // O frontend irá renderizar os dados exatamente como são fornecidos para estes campos.
    // O campo 'lastUpdated' no JSON geral deve refletir o timestamp destes dados mais recentes.
    return data as DashboardData;

  } catch (error) {
    console.error("Falha ao buscar ou processar dados do Google Apps Script:", error);
    if (error instanceof Error) {
        // Propaga erros específicos para que o fallback seja acionado corretamente com a mensagem certa
        if (error.message.startsWith("Erro do Google Apps Script:") || 
            error.message.startsWith("Erro retornado pelo Google Apps Script:") ||
            error.message.startsWith("Formato de dados inválido") ||
            error.message.includes("históricos")) { // Captura o novo erro de dados históricos
          throw error;
        }
        throw new Error(`Erro ao carregar dados do Google Apps Script: ${error.message}`);
    }
    throw new Error("Erro desconhecido ao carregar dados do Google Apps Script.");
  }
};

export const submitFormDataToGoogleScript = async (appsScriptUrl: string, formData: FormDataEntry): Promise<any> => {
  console.log("Enviando dados para:", appsScriptUrl); // Log Adicionado
  console.log("Dados do formulário a serem enviados:", formData); // Log Adicionado

  if (!appsScriptUrl) {
    throw new Error("URL do Google Apps Script não fornecida para submissão.");
  }
  if (!formData) {
    throw new Error("Dados do formulário não fornecidos para submissão.");
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      mode: 'cors', 
      cache: 'no-cache',
      headers: {
        // Alterado para text/plain para simplificar o parsing no Apps Script
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify(formData), // O corpo ainda é uma string JSON
    });

    // Tenta ler a resposta como texto primeiro para depuração
    const responseText = await response.text();
    console.log("Resposta de texto crua do Apps Script:", responseText); // Log Adicionado

    // Agora tenta parsear o texto como JSON
    const responseData = JSON.parse(responseText);

    if (!response.ok || responseData.status === 'error') {
      throw new Error(responseData.message || `Erro ao enviar dados: ${response.status} ${response.statusText}`);
    }
    
    return responseData; 

  } catch (error) {
    console.error("Erro ao enviar dados para o Google Apps Script:", error);
    if (error instanceof Error) {
      throw error; 
    }
    throw new Error("Erro desconhecido ao enviar dados.");
  }
};