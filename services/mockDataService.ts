import { DashboardData, Trend, Sector, Indicator } from '../types';

// --- INÍCIO: Dados brutos que simulam a planilha do Google Sheets ---

const MOCK_SHEET_HEADERS = [
    'ID_UNICO_REGISTRO', 'DATA_REGISTRO', 'RESPONSAVEL_EMAIL', 'SETOR_ID', 'SETOR_NOME', 
    'INDICADOR_ID', 'INDICADOR_NOME', 'VALOR_INDICADOR', 'OBSERVACAO_SETOR', 'LINK_ARQUIVOS_SETOR',
    'SETOR_DESCRICAO_GERAL', 'INDICADOR_UNIDADE', 'INDICADOR_TENDENCIA', 'INDICADOR_META', 'INDICADOR_DESCRICAO',
    'OBSERVACAO_INDICADOR_REGISTRO', 'LINK_INDICADOR_REGISTRO'
];

// Função auxiliar para gerar datas para os últimos N dias
const getDateString = (offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return date.toISOString().split('T')[0];
};

const MOCK_SHEET_ROWS = [
    // Marketing Data
    ...Array.from({ length: 7 }, (_, i) => ['uuid-m1-'+i, getDateString(i), 'ana@seven.com', 'marketing', 'MARKETING', 'vendas-totais', 'NÚMERO DE VENDAS TOTAIS', 155 - i * 5, i === 0 ? 'Campanha de Páscoa' : '', '', 'Indicadores de Marketing.', '', i < 3 ? 'up' : 'stable', 150, 'Vendas totais do dia.', i === 0 ? 'Aumento devido à campanha de Páscoa.' : '', '']),
    ...Array.from({ length: 7 }, (_, i) => ['uuid-m2-'+i, getDateString(i), 'ana@seven.com', 'marketing', 'MARKETING', 'vendas-bot', 'NÚMERO DE VENDAS BOT', i === 0 ? '-' : 45 - i * 2, i === 0 ? 'Bot em manutenção' : '', '', 'Indicadores de Marketing.', '', 'down', 50, 'Vendas pelo bot.', i === 0 ? 'Bot offline.' : '', '']),
    ...Array.from({ length: 7 }, (_, i) => ['uuid-m3-'+i, getDateString(i), 'ana@seven.com', 'marketing', 'MARKETING', 'conversao-bot', 'CONVERSÃO BOT', i === 0 ? '-' : 28 - i, '', '', 'Indicadores de Marketing.', '%', 'down', 30, 'Conversão do bot.', '', '']),

    // Pre-vendas Conversão Data
    ...Array.from({ length: 7 }, (_, i) => ['uuid-pc1-'+i, getDateString(i), 'bia@seven.com', 'pre-vendas-conversao', 'PRÉ-VENDAS CONVERSÃO', 'fila-prospect', 'NÚMERO FILA PROSPECT (INÍCIO DE DIA)', 150 + i * 3, i === 0 ? 'Fila alta pós-feriado.' : '', '', 'Indicadores de pré-vendas.', '', 'down', 50, 'Prospects na fila.', '', '']),
    ...Array.from({ length: 7 }, (_, i) => ['uuid-pc2-'+i, getDateString(i), 'bia@seven.com', 'pre-vendas-conversao', 'PRÉ-VENDAS CONVERSÃO', 'numero-indevidos', 'NÚMERO DE INDEVIDOS', 25 - i, '', '', 'Indicadores de pré-vendas.', '', 'down', 10, 'Contatos indevidos.', '', '']),
    
    // Logística Data - CORRIGIDO para usar o ID 'logstica'
    ...Array.from({ length: 7 }, (_, i) => ['uuid-l1-'+i, getDateString(i), 'carlos@seven.com', 'logstica', 'LOGÍSTICA', '-de-entregas-no-prazo-30-dias', '% De Entregas No Prazo - 30 dias', 92 - i, '', '', 'Indicadores de logística.', '%', 'stable', 95, 'Entregas no prazo.', '', '']),
    ...Array.from({ length: 7 }, (_, i) => ['uuid-l2-'+i, getDateString(i), 'carlos@seven.com', 'logstica', 'LOGÍSTICA', 'custo-logstico-r', 'Custo Logístico (R$)', 12.50 + i * 0.1, '', '', 'Indicadores de logística.', 'BRL', 'up', 12.00, 'Custo por entrega.', 'Leve aumento no custo.', '']),
    ...Array.from({ length: 7 }, (_, i) => ['uuid-l3-'+i, getDateString(i), 'carlos@seven.com', 'logstica', 'LOGÍSTICA', 'custo-de-retrabalho-r', 'Custo De Retrabalho (R$)', i % 3 === 0 ? '-' : 3.50 + i * 0.05, '', '', 'Indicadores de logística.', 'BRL', 'up', 4.00, 'Custo de retrabalho.', '', '']),

    // Vendas Data - NOVO SETOR ADICIONADO para testar a soma
    ...Array.from({ length: 7 }, (_, i) => ['uuid-v1-'+i, getDateString(i), 'davi@seven.com', 'vendas', 'VENDAS', 'vendas-tratamento', 'Vendas Tratamento', 15 - i, '', '', 'Indicadores de Vendas.', '', 'stable', 950, 'Número de vendas de tratamento.', '', '']),
    ...Array.from({ length: 7 }, (_, i) => ['uuid-v2-'+i, getDateString(i), 'davi@seven.com', 'vendas', 'VENDAS', 'venda-tg', 'Vendas TG', 8 + i, '', '', 'Indicadores de Vendas.', '', 'up', 50, 'Número de vendas de TG.', '', '']),
    
    // Pós-Vendas Data - NOVO SETOR ADICIONADO conforme solicitado
    ...Array.from({ length: 7 }, (_, i) => ['uuid-pv1-'+i, getDateString(i), 'eva@seven.com', 'pos-vendas', 'PÓS-VENDAS', 'total-de-vendas-r', 'Total de Vendas (R$)', 2500 - i * 150, '', 'https://seven.com/files/posvendas', 'Indicadores de Pós-Vendas.', 'BRL', 'stable', 15000, 'Valor total de vendas do dia.', '', '']),
];

// --- FIM: Dados brutos ---


// Reimplementação em TypeScript da lógica de parsing do Google Apps Script.

function parseTrend(trendStr?: any): Trend {
  const lowerTrend = trendStr ? trendStr.toString().toLowerCase().trim() : '';
  if (lowerTrend === Trend.Up) return Trend.Up;
  if (lowerTrend === Trend.Down) return Trend.Down;
  return Trend.Stable;
}

function parseIndicatorValue(value: any, format?: string): number | string {
  if (value === null || value === undefined || value.toString().trim() === "" || ['N/A', 'N/D', '-'].includes(value.toString().toUpperCase())) {
    return '-';
  }
  const valueStr = value.toString().trim();
  const num = parseFloat(valueStr.replace(",", "."));
  if (isNaN(num)) return valueStr;
  return num;
}

function detectIndicatorFormat(indicatorName?: any, unit?: any): 'percentage' | 'number' | 'currency' {
    const nome = indicatorName ? indicatorName.toString().toUpperCase() : '';
    const unitStr = unit ? unit.toString().toUpperCase() : '';
    if (nome.includes('%') || unitStr === '%' || nome.includes('CONVERSÃO')) {
        return 'percentage';
    }
    if (unitStr === 'BRL' || nome.includes('(R$)')) {
        return 'currency';
    }
    return 'number';
}

function parseMockSheetDataToDashboardFormat(headers: string[], dataRows: any[][]): DashboardData {
  const headerMap: { [key: string]: number } = {};
  headers.forEach((header, index) => {
    headerMap[header.trim()] = index;
  });

  const getRowValue = (row: any[], headerName: string, defaultValue: any = undefined) => {
    const index = headerMap[headerName];
    if (index !== undefined && row[index] !== undefined && row[index] !== null && row[index].toString().trim() !== "") {
      return row[index];
    }
    return defaultValue;
  };

  const allIndicatorRecords: { [key: string]: any } = {};
  let overallLastUpdated = new Date(0);

  dataRows.forEach(row => {
    const rawDate = getRowValue(row, 'DATA_REGISTRO');
    if (!rawDate) return;
    const recordDate = new Date(rawDate + 'T00:00:00'); // Normalize date
    if (isNaN(recordDate.getTime())) return;
    if (recordDate > overallLastUpdated) overallLastUpdated = recordDate;

    const sectorId = getRowValue(row, 'SETOR_ID');
    const indicatorOriginalId = getRowValue(row, 'INDICADOR_ID');
    if (!sectorId || !indicatorOriginalId || getRowValue(row, 'VALOR_INDICADOR') === undefined) return;
    
    const uniqueIndicatorKey = `${sectorId}_${indicatorOriginalId}`;
    if (!allIndicatorRecords[uniqueIndicatorKey]) {
      const indicatorName = getRowValue(row, 'INDICADOR_NOME', indicatorOriginalId);
      const indicatorUnit = getRowValue(row, 'INDICADOR_UNIDADE');
      allIndicatorRecords[uniqueIndicatorKey] = {
        sectorId,
        sectorName: getRowValue(row, 'SETOR_NOME', sectorId),
        sectorDescriptionGeneral: getRowValue(row, 'SETOR_DESCRICAO_GERAL', ''),
        indicatorOriginalId,
        indicatorName,
        indicatorUnit,
        indicatorFormat: detectIndicatorFormat(indicatorName, indicatorUnit),
        indicatorTargetStr: getRowValue(row, 'INDICADOR_META'),
        indicatorDescriptionGeneral: getRowValue(row, 'INDICADOR_DESCRICAO', ''),
        records: []
      };
    }
    
    allIndicatorRecords[uniqueIndicatorKey].records.push({
      date: recordDate,
      value: parseIndicatorValue(getRowValue(row, 'VALOR_INDICADOR'), allIndicatorRecords[uniqueIndicatorKey].indicatorFormat),
      trend: parseTrend(getRowValue(row, 'INDICADOR_TENDENCIA')),
      sectorObservationForDay: getRowValue(row, 'OBSERVACAO_SETOR'),
      sectorFilesLinkForDay: getRowValue(row, 'LINK_ARQUIVOS_SETOR'),
      indicatorObservationForRecord: getRowValue(row, 'OBSERVACAO_INDICADOR_REGISTRO'),
      indicatorFilesLinkForRecord: getRowValue(row, 'LINK_INDICADOR_REGISTRO')
    });
  });

  const sectorsMap = new Map<string, Sector & { latestDateInSector?: Date }>();
  for (const key in allIndicatorRecords) {
    const indData = allIndicatorRecords[key];
    if (indData.records.length === 0) continue;

    indData.records.sort((a: any, b: any) => b.date - a.date);
    const latestRecord = indData.records[0];

    let sector = sectorsMap.get(indData.sectorId);
    if (!sector) {
      sector = {
        id: indData.sectorId,
        name: indData.sectorName,
        description: indData.sectorDescriptionGeneral,
        indicators: [],
        sectorObservation: undefined,
        sectorFilesLink: undefined,
        latestDateInSector: new Date(0)
      };
      sectorsMap.set(indData.sectorId, sector);
    }
    
    if (sector.latestDateInSector && latestRecord.date >= sector.latestDateInSector) {
      sector.latestDateInSector = latestRecord.date;
      sector.sectorObservation = latestRecord.sectorObservationForDay || sector.sectorObservation;
      sector.sectorFilesLink = latestRecord.sectorFilesLinkForDay || sector.sectorFilesLink;
    }

    let parsedTarget;
    if (indData.indicatorTargetStr !== undefined) {
      const targetNum = parseFloat(String(indData.indicatorTargetStr).replace(",", "."));
      if (!isNaN(targetNum)) parsedTarget = targetNum;
    }

    const finalIndicator: Indicator = {
      id: key,
      originalId: indData.indicatorOriginalId, // Storing the reliable short ID
      name: indData.indicatorName,
      value: latestRecord.value,
      unit: indData.indicatorUnit,
      trend: latestRecord.trend,
      target: parsedTarget,
      description: indData.indicatorDescriptionGeneral,
      format: indData.indicatorFormat,
      lastRecordObservation: latestRecord.indicatorObservationForRecord,
      lastRecordFilesLink: latestRecord.indicatorFilesLinkForRecord,
      historicalData: indData.records.map((rec: any) => ({
        date: rec.date.toISOString().split('T')[0],
        value: rec.value
      })),
    };
    sector.indicators.push(finalIndicator);
  }
  
  const finalSectors = Array.from(sectorsMap.values()).map(s => {
    delete s.latestDateInSector;
    return s;
  }).filter(s => s.indicators.length > 0);

  return {
    title: 'Indicadores Seven',
    sectors: finalSectors,
    lastUpdated: overallLastUpdated > new Date(0) ? overallLastUpdated.toISOString() : new Date().toISOString(),
  };
}


let memoizedMockData: DashboardData | null = null;

const getMemoizedMockData = (): DashboardData => {
  if (memoizedMockData) {
    return memoizedMockData;
  }
  memoizedMockData = parseMockSheetDataToDashboardFormat(MOCK_SHEET_HEADERS, MOCK_SHEET_ROWS);
  return memoizedMockData;
};


export const fetchDashboardData = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Retorna uma cópia profunda para evitar mutações nos dados em cache.
      resolve(JSON.parse(JSON.stringify(getMemoizedMockData())));
    }, 200); 
  });
};