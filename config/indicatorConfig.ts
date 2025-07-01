/**
 * @file Centralized configuration for indicator-specific logic.
 * This file provides a single place to manage which indicators should use summation
 * instead of averaging for their time-based metrics.
 */

/**
 * A set of indicator 'originalId's that should have their values summed over time
 * for metrics like "Soma 7 Dias" and "Soma 30 Dias", instead of being averaged.
 *
 * To make an indicator use summation, simply add its 'originalId' from the
 * spreadsheet to this set.
 *
 * Example:
 * Your spreadsheet has an indicator with INDICADOR_ID = 'novos-clientes'.
 * To make it sum up, add 'novos-clientes' to the set below.
 */
export const INDICATORS_TO_SUM = new Set([
  'nmero-de-vendas-totais',
  'vendas-tratamento',
  'venda-tg',
  'nmero-de-vendas-humano',
  'nmero-agendado',
  'total-de-vendas-r', // Adicionado para o Pós-Vendas conforme solicitado
  'nmero-de-estornos-tratamentosatend',
  'nmero-de-estornos-suplementos',
  'estornos-realizadosdia-r',
]);

/**
 * Checks if a given indicator should be summed instead of averaged based on its
 * originalId.
 * @param {string | undefined} indicatorOriginalId - The original ID of the indicator (e.g., 'vendas-tratamento').
 * @returns {boolean} True if the indicator's values should be summed.
 */
export const shouldUseSummation = (indicatorOriginalId: string | undefined): boolean => {
  if (!indicatorOriginalId) {
    return false;
  }
  return INDICATORS_TO_SUM.has(indicatorOriginalId);
};
