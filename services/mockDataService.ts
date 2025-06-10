import { DashboardData, Trend, Sector, Indicator } from '../types';

// Função para gerar IDs amigáveis (slugify)
const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por -
    .replace(/[^\w-]+/g, '') // Remove caracteres não alfanuméricos exceto -
    .replace(/--+/g, '-'); // Substitui múltiplos - por um único -
};

interface InitialIndicatorDefinition extends Pick<Indicator, 'name' | 'value'>, Partial<Omit<Indicator, 'id' | 'name' | 'value' | 'isMandatory'>> {
  isMandatory?: boolean;
}

const createIndicator = (
  sectorId: string,
  name: string,
  value: number | string,
  opts: Partial<Indicator> = {} // opts can now include isMandatory
): Indicator => {
  const indicatorId = slugify(name);
  return {
    id: `${sectorId}_${indicatorId}`,
    name,
    value,
    unit: opts.unit || (opts.format === 'percentage' ? '%' : (opts.format === 'currency' ? 'BRL' : undefined)),
    trend: opts.trend || Trend.Stable,
    target: opts.target !== undefined ? opts.target : (typeof value === 'number' ? Math.round(value * 1.1) : undefined),
    description: opts.description || `Descrição para ${name}`,
    format: opts.format || 'number',
    average7Days: opts.average7Days !== undefined ? opts.average7Days : (typeof value === 'number' ? Math.round(value * 0.95) : 'N/D'),
    average30Days: opts.average30Days !== undefined ? opts.average30Days : (typeof value === 'number' ? Math.round(value * 0.9) : 'N/D'),
    lastRecordObservation: opts.lastRecordObservation,
    lastRecordFilesLink: opts.lastRecordFilesLink,
    isMandatory: opts.isMandatory === undefined ? true : opts.isMandatory, // Default to true if not specified
  };
};

// Added sectorObservation and sectorFilesLink to the type and data
const sectorsData: { name: string; description?: string; indicators: InitialIndicatorDefinition[]; sectorObservation?: string; sectorFilesLink?: string; }[] = [
  {
    name: 'MARKETING',
    description: 'Indicadores relacionados às estratégias e resultados de Marketing.',
    sectorObservation: 'Campanha de Páscoa impulsionou as vendas. O bot esteve em manutenção, impactando sua conversão.',
    sectorFilesLink: 'https://example.com/marketing_reports_folder',
    indicators: [
      { name: 'NÚMERO DE VENDAS TOTAIS', value: 155, format: 'number', target: 7, lastRecordObservation: 'Aumento devido à campanha de Páscoa. Ver anexo para detalhes sobre a performance e ROI.', lastRecordFilesLink: 'https://example.com/pascoa_report.pdf' },
      
    ],
  },
  {
    name: 'PRÉ-VENDAS CONVERSÃO',
    description: 'Indicadores de conversão da equipe de pré-vendas.',
    sectorObservation: 'Fila de prospects alta pós-feriado. Equipe focada na redução. Número de indevidos ainda é um ponto de atenção.',
    indicators: [
  { name: 'NÚMERO FILA PROSPECT (INÍCIO DE DIA)', value: 150, format: 'number', trend: Trend.Down, target: 10, lastRecordObservation: 'Fila alta devido ao feriado prolongado. Equipe focada em reduzir nas próximas 48h.' },
  { name: 'NÚMERO DE FILA TREBLE', value: 0, format: 'number', trend: Trend.Down, target: 5, lastRecordObservation: 'Novo indicador de fila Treble.' },
  { name: 'NÚMERO DE VENDAS HUMANO', value: 15, format: 'percentage', target: 1350, lastRecordFilesLink: 'https://example.com/human_sales_overview.docx', lastRecordObservation: 'Vendas humanas estáveis, mas com potencial de crescimento.' },
  { name: 'CONVERSÃO HUMANO', value: 24, format: 'percentage', trend: Trend.Up, target: 14, lastRecordObservation: 'Melhoria na conversão de 2% após treinamento da equipe em novas técnicas de abordagem.' },
],
  },
  {
    name: 'PRÉ VENDAS COMPARECIMENTO',
    description: 'Indicadores de comparecimento relacionados à pré-venda.',
    sectorObservation: 'Nenhuma atividade de agendamento recente. Monitorar os próximos dias.',
    sectorFilesLink: 'https://example.com/prevendas_comparecimento_docs',
    indicators: [
      { name: 'NÚMERO AGENDADO', value: 0, format: 'percentage', target: 6550, lastRecordObservation: 'Nenhum agendamento realizado no último dia.'}, 
      { name: '% COMPARECIMENTO', value: 0, format: 'percentage', trend: Trend.Up, target: 85, lastRecordObservation: 'Sem agendamentos, sem taxa de comparecimento. Monitorar próximos eventos.' , lastRecordFilesLink: 'https://example.com/event_schedule.ics'},
    ],
  },
  {
    name: 'COMERCIAL',
    description: 'Indicadores de desempenho da equipe comercial.',
    sectorObservation: 'Desempenho comercial estável. Sinais pendentes e outras pendências em redução, o que é positivo.',
    indicators: [
      { name: 'VENDAS TRATAMENTO', value: 0, format: 'number', trend: Trend.Down },
      { name: 'VENDA TG', value: 0, format: 'number', trend: Trend.Down },
      { name: 'VENDA TG ASSISTIDO', value: 0, format: 'currency', unit: 'BRL', lastRecordObservation: 'Valor de Teste de Genotipagem (TG) de vendas assistidas.' },
      { name: '%TG', value: 0, format: 'percentage', target: 40, lastRecordFilesLink: 'https://example.com/tg_details.csv'},
      { name: 'CONVERSÃO NO DIA', value: 0, format: 'percentage', target: 60, lastRecordObservation: 'Meta de conversão para o dia.'}, 
      { name: 'SINAIS PENDENTES (ACUMULADO)', value: 0, format: 'number', trend: Trend.Down, lastRecordObservation: 'Redução no número de sinais pendentes.' },
      { name: 'PENDÊNCIA PACIENTE/ASSINATURA (ACUMULADO)', value: 0, format: 'number', trend: Trend.Down, lastRecordFilesLink: 'https://example.com/pending_signatures.csv', lastRecordObservation: 'Acompanhamento de assinaturas pendentes está em dia.' },
    ],
  },
  {
    name: 'PRÉ VENDAS: AGENDAMENTO COM NUTRIÇÃO',
    description: 'Indicadores de agendamento com a equipe de nutrição.',
    sectorObservation: 'Volume de leads e agendamentos dentro do esperado. Pendências de agendamento em queda.',
    sectorFilesLink: 'https://example.com/nutricao_agendamento_recursos',
    indicators: [
      { name: 'NÚMERO QUE SUBIU EM LISTA', value: 0, format: 'number', lastRecordObservation: 'Volume de leads para nutrição dentro do esperado.' },
      { name: 'AGENDAMENTOS REALIZADOS', value: 0, format: 'number', lastRecordObservation: 'Agendamentos realizados pela equipe de nutrição.' },
      { name: 'AGENDAMENTOS REALIZADOS COM PRIORIDADE', value: 0, format: 'number' },
      { name: 'PENDÊNCIAS DE AGENDAMENTO (ACUMULADO MÊS)', value: 0, format: 'number', trend: Trend.Down, lastRecordFilesLink: 'https://example.com/nutri_scheduling_ backlog.xlsx' },
    ],
  },
  {
    name: 'NUTRIÇÃO',
    description: 'Indicadores de desempenho e satisfação da equipe de nutrição.',
    sectorObservation: 'Equipe de nutrição performando bem, com baixo absenteísmo e NPS alto. Nenhuma queixa registrada.',
    indicators: [
      { name: '% ABSENTEÍSMO', value: 0, format: 'percentage', trend: Trend.Down, target: 20, lastRecordObservation: 'Taxa de absenteísmo baixa, equipe completa.' },
      { name: 'PRIMEIRA CONSULTA (TRAT ANTIGO)', value: 0, format: 'number' },
      { name: 'INDICAÇÕES DE SUPLEMENTOS (TRAT ANTIGO)', value: 0, format: 'number' },
      { name: '% INDICAÇÃO EM INÍCIO', value: 0, format: 'percentage', trend: Trend.Up, target: 90, lastRecordFilesLink: 'https://example.com/suplement_indication_rate.png' },
      { name: 'QUEIXA DE CLIENTES/NPS', value: 0, format: 'number', trend: Trend.Down, target: 1, lastRecordObservation: 'Nenhuma queixa registrada para a equipe de nutrição.' },
      { name: 'NOTA SATISFAÇÃO', value: 0, format: 'number', unit: '/10', trend: Trend.Up, target: 8.5 },
      { name: 'NOTA NPS', value: 0, format: 'number', trend: Trend.Up, target: 900, lastRecordObservation: 'NPS da nutrição se mantém alto.' },
    ],
  },

{
  name: 'PÓS-VENDAS',
  description: 'Indicadores do setor de pós-vendas.',
  indicators: [
    { name: 'TOTAL DE OPORTUNIDADES', value: 0, format: 'number', lastRecordObservation: 'Total de oportunidades geradas no pós-vendas.' },
    { name: 'CONVERSÃO NO DIA', value: 0, format: 'percentage', lastRecordObservation: 'Taxa de conversão do dia no pós-vendas.' },
    { name: 'TOTAL DE VENDAS R$', value: 0, format: 'currency', unit: 'BRL', lastRecordObservation: 'Total de vendas em reais no pós-vendas.' },
    { name: 'NÚMERO PENDÊNCIAS PLANILHA (ACUMULADO)', value: 0, format: 'number', lastRecordObservation: 'Pendências acumuladas na planilha do pós-vendas.' },
  ],
},

  {
    name: 'LOGÍSTICA',
    description: 'Indicadores de operações logísticas.',
    sectorObservation: 'Indicadores de performance logística atualizados. Monitoramento de entregas, custos e devoluções em andamento.',
    sectorFilesLink: 'https://example.com/logistica_procedimentos',
    indicators: [
      { name: '% De Entregas No Prazo - 30 dias', value: 92, format: 'percentage', isMandatory: true },
      { name: '% De Atraso - 30 dias', value: 8, format: 'percentage', isMandatory: true },
      { name: 'Total De Devolução Nos Últimos - 30 dias', value: 10, format: 'number', isMandatory: true },
      { name: 'Tempo Médio De Entrega - 30 dias', value: 10, format: 'number', unit: 'dias', isMandatory: true },
      { name: '% De Divergentes - 30 dias', value: 2, format: 'percentage', isMandatory: true },
      { name: '% Saída Rochavera', value: 75, format: 'percentage', isMandatory: true },
      { name: 'Custo Logístico (R$)', value: 12.50, unit: 'BRL', format: 'currency', isMandatory: false },
      { name: 'Custo De Retrabalho (R$)', value: 12.50, unit: 'BRL', format: 'currency', isMandatory: false },
    ],
  },
  {
    name: 'FINANCEIRO',
    description: 'Indicadores financeiros da operação.',
    sectorObservation: 'Controle de estornos eficiente, com pendências zeradas.',
    indicators: [
      { name: 'NÚMERO DE ESTORNOS TRATAMENTOS/ATEND.', value: 0, format: 'number', trend: Trend.Down, lastRecordObservation: 'Controle de estornos de tratamentos efetivo.' },
      { name: 'NÚMERO DE ESTORNOS SUPLEMENTOS', value: 0, format: 'number', trend: Trend.Down },
      { name: 'ESTORNOS REALIZADOS/DIA (R$)', value: 0, format: 'currency', unit: 'BRL', trend: Trend.Down, lastRecordFilesLink: 'https://example.com/daily_refunds.csv' },
      { name: 'PENDÊNCIA DE ESTORNOS', value: 0, format: 'number', trend: Trend.Down, lastRecordObservation: 'Fila de pendências de estorno zerada.' },
      { name: 'TOTAL DE VENDAS (R$)', value: 0, format: 'currency', unit: 'BRL', target: 4200000, lastRecordObservation: 'Total de vendas em valor monetário.'},
    ],
  },
  {
    name: 'JORNADA CLIENTE',
    description: 'Indicadores relacionados à experiência e satisfação do cliente.',
    sectorObservation: 'Baixo volume de chamados SAC e queixas. Sem casos em aberto no Reclame Aqui.',
    sectorFilesLink: 'https://example.com/jornada_cliente_faq',
    indicators: [
      { name: 'SAC: Nº EM ABERTO', value: 0, format: 'number', trend: Trend.Down, lastRecordObservation: 'Poucos chamados SAC em aberto.' },
      { name: 'QUEIXAS: NOVOS CASOS', value: 0, format: 'number', trend: Trend.Down },
      { name: 'QUEIXAS: EM ABERTO', value: 0, format: 'number', trend: Trend.Down, lastRecordFilesLink: 'https://example.com/complaints_status.html' },
      { name: 'SOLICITAÇÃO DE CANCELAMENTO DE SUPLEMENTOS', value: 0, format: 'number', trend: Trend.Down, lastRecordObservation: 'Baixo número de solicitações de cancelamento de suplementos.'},
      { name: 'SOLICITAÇÕES DE CANCELAMENTO DE TRATAMENTOS', value: 0, format: 'number', trend: Trend.Down },
      { name: 'RECLAME AQUI: NOVOS CASOS', value: 0, format: 'number', trend: Trend.Down },
      { name: 'RECLAME AQUI: CASOS EM ABERTO', value: 0, format: 'number', trend: Trend.Down, lastRecordObservation: 'Nenhum caso em aberto no Reclame Aqui atualmente.' },
    ],
  }
];


export const mockSectors: Sector[] = sectorsData.map(sectorItem => {
  const sectorId = slugify(sectorItem.name);
  
  const allIndicatorsForSector: Indicator[] = sectorItem.indicators.map(indDef => {
    // Pass the entire indDef which now includes isMandatory
    return createIndicator(sectorId, indDef.name, indDef.value, indDef as Partial<Indicator>);
  });

  const uniqueIndicatorsForSector: Indicator[] = [];
  const seenIds = new Set<string>();

  for (const indicator of allIndicatorsForSector) {
    if (!seenIds.has(indicator.id)) {
      uniqueIndicatorsForSector.push(indicator);
      seenIds.add(indicator.id);
    }
  }
  
  return {
    id: sectorId,
    name: sectorItem.name,
    description: sectorItem.description,
    indicators: uniqueIndicatorsForSector,
    sectorObservation: sectorItem.sectorObservation,
    sectorFilesLink: sectorItem.sectorFilesLink,
  };
});


const mockDashboardData: DashboardData = {
  title: 'Indicadores Seven',
  sectors: mockSectors,
  lastUpdated: new Date().toISOString(),
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ 
        ...mockDashboardData, 
        sectors: mockSectors, 
        lastUpdated: new Date().toISOString() 
      });
    }, 200); 
  });
};
