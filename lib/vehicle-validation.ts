import type { StatusValidacaoVeiculo } from '@/lib/types';

export const PENDING_VEHICLE_STATUSES: StatusValidacaoVeiculo[] = [
  'pendente_upload',
  'pendente_extracao',
  'extraido_parcial',
  'pendente_revisao',
];

export const VEHICLE_STATUS_LABELS: Record<StatusValidacaoVeiculo, string> = {
  pendente_upload: 'Aguardando CRLV-e',
  pendente_extracao: 'Aguardando extração',
  extraido_parcial: 'Extração parcial',
  pendente_revisao: 'Pendente de revisão',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

export const VEHICLE_STATUS_STYLES: Record<StatusValidacaoVeiculo, string> = {
  pendente_upload: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  pendente_extracao: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  extraido_parcial: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  pendente_revisao: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  aprovado: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  rejeitado: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

export function getVehicleStatusLabel(status?: string | null) {
  if (status && status in VEHICLE_STATUS_LABELS) {
    return VEHICLE_STATUS_LABELS[status as StatusValidacaoVeiculo];
  }
  return status || 'Não informado';
}

export function getVehicleStatusStyle(status?: string | null) {
  if (status && status in VEHICLE_STATUS_STYLES) {
    return VEHICLE_STATUS_STYLES[status as StatusValidacaoVeiculo];
  }
  return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
}

export function formatVehicleFieldName(field: string) {
  const labels: Record<string, string> = {
    placa: 'Placa',
    renavam: 'RENAVAM',
    marca: 'Marca',
    modelo: 'Modelo',
    ano: 'Ano',
    ano_fabricacao: 'Ano de fabricação',
    ano_modelo: 'Ano do modelo',
    cor: 'Cor',
    capacidade_passageiros: 'Capacidade de passageiros',
    categorias: 'Categorias',
    accessibility_features: 'Recursos de acessibilidade',
    ar_condicionado: 'Ar-condicionado',
  };

  const isMismatch = field.endsWith('_divergente');
  const normalizedField = field.replace(/_divergente$/, '');
  const label = labels[normalizedField] ?? normalizedField.replaceAll('_', ' ');

  return isMismatch ? label + ' divergente' : label;
}
