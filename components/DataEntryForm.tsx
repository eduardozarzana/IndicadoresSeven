import React, { useState, useEffect, useMemo } from 'react';
import { FormDataEntry, FormSector, FormIndicator, Sector as FullSector } from '../types';

interface DataEntryFormProps {
  sectorsData: FullSector[];
  onSubmit: (formDataList: FormDataEntry[]) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

// Função auxiliar para normalizar strings: remove acentos, converte para minúsculas e remove espaços.
// Isso garante que a comparação seja robusta contra variações de formatação na planilha.
const normalizeString = (str: string | undefined): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD") // Separa os caracteres base dos diacríticos (ex: 'í' -> 'i' + '´')
    .replace(/[\u0300-\u036f]/g, "") // Remove os diacríticos
    .trim();
};


// Função auxiliar para determinar se um indicador é obrigatório.
// Centraliza a lógica de validação em um único lugar.
const isIndicatorRequired = (indicator: FormIndicator, sectorId: string): boolean => {
    // Normaliza os IDs para garantir uma comparação consistente.
    const normalizedSectorId = normalizeString(sectorId);
    const normalizedIndicatorId = normalizeString(indicator.originalId);

    // REGRA DE NEGÓCIO: Indicadores específicos no setor 'Logística' não são obrigatórios.
    // O ID DO SETOR foi corrigido de 'logistica' para 'logstica' com base na planilha do usuário.
    const isLogisticaSector = normalizedSectorId === 'logstica';
    const nonMandatoryLogisticIds = ['custo-logstico-r', 'custo-de-retrabalho-r'];
    
    if (isLogisticaSector && nonMandatoryLogisticIds.includes(normalizedIndicatorId)) {
        return false; // Não é obrigatório
    }

    // Comportamento padrão: é obrigatório a menos que `isMandatory` seja explicitamente `false`.
    return indicator.isMandatory !== false;
};


const DataEntryForm: React.FC<DataEntryFormProps> = ({ sectorsData, onSubmit, onClose, isLoading }) => {
  const [dataRegistro, setDataRegistro] = useState<string>(new Date().toISOString().split('T')[0]);
  const [responsavelEmail, setResponsavelEmail] = useState<string>('');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  
  const [indicatorValues, setIndicatorValues] = useState<Record<string, string>>({});
  const [observacaoSetorInput, setObservacaoSetorInput] = useState<string>('');
  const [linkArquivosSetorInput, setLinkArquivosSetorInput] = useState<string>('');
  
  const [formError, setFormError] = useState<string | null>(null);

  const formSectors: FormSector[] = useMemo(() => {
    return sectorsData.map(sector => ({
      id: sector.id,
      name: sector.name,
      indicators: sector.indicators.map(indicator => {
        // Extrai o ID original do indicador do ID único (ex: "setor_idoriginal" -> "idoriginal")
        // Esta abordagem é mais robusta do que `split` e `join`.
        const originalId = indicator.id.startsWith(sector.id + '_') 
          ? indicator.id.substring(sector.id.length + 1)
          : indicator.id;
        return {
          id: indicator.id, 
          name: indicator.name,
          originalId: originalId,
          isMandatory: indicator.isMandatory,
        };
      }),
    }));
  }, [sectorsData]);

  const currentSector = useMemo(() => {
    return formSectors.find(s => s.id === selectedSectorId);
  }, [selectedSectorId, formSectors]);

  useEffect(() => {
    setIndicatorValues({});
    setObservacaoSetorInput('');
    setLinkArquivosSetorInput('');
    setFormError(null); 
  }, [selectedSectorId]);

  const handleIndicatorValueChange = (indicatorId: string, value: string) => {
    setIndicatorValues(prev => ({ ...prev, [indicatorId]: value }));
  };

  const handleSectorChange = (newSectorId: string) => {
    setIndicatorValues({});
    setObservacaoSetorInput('');
    setLinkArquivosSetorInput('');
    setFormError(null);
    setSelectedSectorId(newSectorId);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!dataRegistro || !selectedSectorId) {
      setFormError('Data para Lançamento e Setor são obrigatórios.');
      return;
    }
    
    if (!responsavelEmail.trim()) {
        setFormError('Responsável pelo Lançamento é obrigatório.');
        return;
    }

    if (!currentSector) {
      setFormError('Setor selecionado não encontrado ou inválido.');
      return;
    }

    const formDataList: FormDataEntry[] = [];

    if (currentSector.indicators.length > 0) {
      for (const indicator of currentSector.indicators) {
        const inputValue = indicatorValues[indicator.id]?.trim();
        const isRequired = isIndicatorRequired(indicator, currentSector.id);
        let valorParaEnviar: number | string;

        if (inputValue) { // Se houver um valor preenchido
            const valorNum = parseFloat(inputValue.replace(',', '.'));
            if (isNaN(valorNum)) {
                setFormError(`Valor inválido para "${indicator.name.replace('*', '').trim()}". Use números (ex: 123 ou 123,45).`);
                return; 
            }
            valorParaEnviar = valorNum;
        } else { // Se o campo estiver vazio
            if (isRequired) { // E o campo for obrigatório
                setFormError(`"${indicator.name.replace('*', '').trim()}" é obrigatório.`);
                return; 
            } else { // Se for opcional e vazio, enviar "N/A" para alinhar com a planilha.
                valorParaEnviar = "N/A";
            }
        }
        
        formDataList.push({
          dataRegistro,
          responsavelEmail: responsavelEmail.trim(),
          sectorId: currentSector.id,
          sectorName: currentSector.name,
          indicatorId: indicator.originalId, 
          indicatorName: indicator.name.replace('*', '').trim(), 
          valorIndicador: valorParaEnviar,
          observacao: observacaoSetorInput.trim() || undefined,
          linkArquivosSetor: linkArquivosSetorInput.trim() || undefined,
        });
      }
      
      if (formDataList.length !== currentSector.indicators.length && currentSector.indicators.length > 0) {
         return;
      }

    } else {
      // O setor não tem indicadores definidos.
    }

    try {
      await onSubmit(formDataList);
    } catch (error) {
      // O erro durante o envio é tratado pelo `formSubmissionStatus` no App.tsx
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary">Entrada de Dados Diários</h2>
          <button 
            onClick={onClose} 
            disabled={isLoading} 
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
            aria-label="Fechar formulário"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-grow pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dataRegistro" className="block text-sm font-medium text-gray-700 mb-1">Data para Lançamento <span className="text-red-500">*</span></label>
              <input
                type="date"
                id="dataRegistro"
                value={dataRegistro}
                onChange={(e) => setDataRegistro(e.target.value)}
                disabled={isLoading}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
              />
            </div>
            <div>
              <label htmlFor="responsavelEmail" className="block text-sm font-medium text-gray-700 mb-1">Responsável pelo Lançamento <span className="text-red-500">*</span></label>
              <input
                type="email"
                id="responsavelEmail"
                value={responsavelEmail}
                onChange={(e) => setResponsavelEmail(e.target.value)}
                disabled={isLoading}
                required
                placeholder="email@exemplo.com"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">Setor <span className="text-red-500">*</span></label>
            <select
              id="sector"
              value={selectedSectorId}
              onChange={(e) => handleSectorChange(e.target.value)}
              disabled={isLoading}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
            >
              <option value="">Selecione um setor</option>
              {formSectors.map((sector) => (
                <option key={sector.id} value={sector.id}>{sector.name}</option>
              ))}
            </select>
          </div>

          {currentSector && (
            <div className="space-y-4 pt-4 mt-4 border-t">
              <h3 className="text-lg font-semibold text-primary">{currentSector.name}</h3>
              {currentSector.indicators.map(indicator => (
                <div key={indicator.id}>
                  <label htmlFor={indicator.id} className="block text-sm font-medium text-gray-700 mb-1">
                    {indicator.name.replace('*', '').trim()}
                    {isIndicatorRequired(indicator, currentSector.id) && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="text" 
                    id={indicator.id}
                    value={indicatorValues[indicator.id] || ''}
                    onChange={(e) => handleIndicatorValueChange(indicator.id, e.target.value)}
                    disabled={isLoading}
                    placeholder="Valor"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
              ))}
              <div>
                <label htmlFor="observacaoSetor" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações do Setor: {currentSector.name} (Opcional)
                </label>
                <textarea
                  id="observacaoSetor"
                  value={observacaoSetorInput}
                  onChange={(e) => setObservacaoSetorInput(e.target.value)}
                  rows={3}
                  disabled={isLoading}
                  placeholder="Observações gerais sobre este setor..."
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                />
              </div>
              <div>
                <label htmlFor="linkArquivosSetor" className="block text-sm font-medium text-gray-700 mb-1">
                  Link para Arquivos do Setor: {currentSector.name} (Opcional)
                </label>
                <input
                  type="url"
                  id="linkArquivosSetor"
                  value={linkArquivosSetorInput}
                  onChange={(e) => setLinkArquivosSetorInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="https://exemplo.com/link/para/arquivos"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                />
              </div>
            </div>
          )}

          {formError && (
            <p className="flex items-center text-sm text-red-700 bg-red-100 p-3 rounded-md shadow-sm">
              <svg className="w-5 h-5 mr-2 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              {formError}
            </p>
          )}

          <div className="flex justify-end space-x-3 pt-4 sm:pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm transition-colors duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedSectorId} 
              className="px-4 py-2 text-sm font-medium text-base bg-primary hover:bg-accent border border-transparent rounded-md shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-150"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                currentSector ? `Gravar dados do Setor: ${currentSector.name.substring(0,15)}${currentSector.name.length > 15 ? '...' : ''}` : 'Salvar Registros'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataEntryForm;