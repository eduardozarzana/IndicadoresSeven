
export enum Trend {
  Up = 'up',
  Down = 'down',
  Stable = 'stable',
}

export interface Indicator {
  id: string;
  originalId: string; // The short ID from the sheet (e.g., 'vendas-tratamento')
  name: string;
  value: number | string; // Este será o valor do "último dia"
  unit?: string;
  trend: Trend;
  target?: number;
  description?: string;
  format?: 'currency' | 'percentage' | 'number';
  average7Days?: number | string;
  average30Days?: number | string;
  sum7Days?: number | string; // Adicionado para a soma de 7 dias
  sum30Days?: number | string; // Adicionado para a soma de 30 dias
  lastRecordObservation?: string; // Added for observation of the last record
  lastRecordFilesLink?: string;   // Added for file link of the last record
  isMandatory?: boolean; // Added to specify if the indicator is mandatory in forms
  historicalData?: { date: string; value: number | string }[]; // Para a visualização de planilha
}

export interface Sector {
  id: string;
  name: string;
  description?: string;
  indicators: Indicator[];
  sectorObservation?: string; // Optional observation for the entire sector
  sectorFilesLink?: string; // Optional link for files related to the entire sector
}

export interface DashboardData {
  title: string;
  sectors: Sector[];
  lastUpdated: string;
}

// Tipos para o formulário de entrada de dados
export interface FormDataEntry {
  dataRegistro: string; // Data em que o registro do indicador deve ser gravado
  sectorId: string;
  sectorName?: string; // Adicionado para enviar ao Apps Script se útil
  indicatorId: string; // ID original/curto do indicador
  indicatorName?: string; // Adicionado para enviar ao Apps Script se útil
  valorIndicador: number | string; // Can be number or "N/A" for optional empty fields
  responsavelEmail?: string;
  observacao?: string; // Será a "Observação do Setor"
  linkArquivosSetor?: string; // Novo campo para o link de arquivos do setor
}

export interface FormIndicator {
  id: string; // Será o ID único do indicador no frontend (ex: marketing_numero-vendas-totais)
  name: string; // Nome do indicador para exibição
  originalId: string; // O ID curto do indicador (ex: numero-vendas-totais) usado na planilha
  isMandatory?: boolean; // Indica se o campo é visualmente obrigatório (com *)
}

export interface FormSector {
  id: string; // ID do setor
  name: string; // Nome do setor para exibição
  indicators: FormIndicator[]; // Lista de indicadores simplificados para este setor
}

// Enum para controlar a visualização do dashboard
export enum ViewMode {
  List = 'list',
  Charts = 'charts',
  Spreadsheet = 'spreadsheet',
}