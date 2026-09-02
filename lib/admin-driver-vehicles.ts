import 'server-only';

import type { createSupabaseServerClient } from '@/lib/supabase-server';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type AdminRegistrationStats = {
  total_motoristas: number;
  motoristas_pendentes: number;
  veiculos_pendentes: number;
  total_pagamentos: number;
  pagamentos_pagos: number;
};

export type AdminDriverSummary = {
  id: string;
  status_motorista: string;
  cnh_numero: string | null;
  cnh_validade: string | null;
  created_at: string;
};

export type AdminDriver = {
  id: string;
  chave_pix: string | null;
  cnh_categoria: string | null;
  cnh_foto_url: string | null;
  cnh_numero: string | null;
  cnh_validade: string | null;
  data_aprovacao: string | null;
  motivo_rejeicao: string | null;
  status_motorista: string;
};

export type AdminDriverVehicle = {
  id: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  ano: number | null;
  cor: string | null;
  status_validacao: string;
};

export type AdminDriverDocument = {
  id: string;
  tipo_documento: string;
  nome_documento: string;
  status_verificacao: string | null;
  data_upload: string | null;
  arquivo_url: string;
};

export type AdminDriverDetail = {
  motorista: AdminDriver;
  veiculos: AdminDriverVehicle[];
  documentos: AdminDriverDocument[];
};

export type AdminVehicleSummary = {
  id: string;
  motorista_id: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  ano: number | null;
  status_validacao: string;
  campos_pendentes: string[] | null;
  ativo: boolean;
  created_at: string;
};

export type AdminVehicleDetail = AdminVehicleSummary & {
  renavam: string | null;
  cor: string | null;
  capacidade_passageiros: number | null;
  ar_condicionado: boolean | null;
  accessibility_features: Record<string, unknown> | null;
  crlv_path: string | null;
  crlv_mime_type: string | null;
  crlv_uploaded_at: string | null;
  dados_extraidos_crlv: Record<string, unknown> | null;
  validado_por: string | null;
  validado_em: string | null;
  motivo_rejeicao: string | null;
};

type ListPayload = { items?: unknown; total?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseList<T>(data: unknown) {
  const payload = isRecord(data) ? (data as ListPayload) : {};
  return {
    items: Array.isArray(payload.items) ? (payload.items as T[]) : [],
    total: toNumber(payload.total),
  };
}

export async function getAdminRegistrationStats(supabase: SupabaseServerClient) {
  const { data, error } = await supabase.rpc('admin_obter_estatisticas_cadastros');
  if (error) {
    console.error('Erro ao consultar estatisticas administrativas:', {
      code: error.code,
      message: error.message,
    });
    throw new Error('Nao foi possivel consultar as estatisticas administrativas.');
  }

  const result = isRecord(data) ? data : {};
  return {
    total_motoristas: toNumber(result.total_motoristas),
    motoristas_pendentes: toNumber(result.motoristas_pendentes),
    veiculos_pendentes: toNumber(result.veiculos_pendentes),
    total_pagamentos: toNumber(result.total_pagamentos),
    pagamentos_pagos: toNumber(result.pagamentos_pagos),
  } satisfies AdminRegistrationStats;
}

export async function listAdminDrivers(
  supabase: SupabaseServerClient,
  options: { status?: string; limit?: number; offset?: number } = {},
) {
  const { data, error } = await supabase.rpc('admin_listar_motoristas', {
    status_input: options.status ?? null,
    limite_input: options.limit ?? 50,
    deslocamento_input: options.offset ?? 0,
  });
  if (error) {
    console.error('Erro ao listar motoristas pela RPC administrativa:', {
      code: error.code,
      message: error.message,
    });
    throw new Error('Nao foi possivel listar os motoristas.');
  }
  return parseList<AdminDriverSummary>(data);
}

export async function getAdminDriver(
  supabase: SupabaseServerClient,
  driverId: string,
): Promise<AdminDriverDetail | null> {
  const { data, error } = await supabase.rpc('admin_obter_motorista', {
    motorista_id_input: driverId,
  });
  if (error) {
    console.error('Erro ao consultar motorista pela RPC administrativa:', {
      code: error.code,
      message: error.message,
      driverId,
    });
    throw new Error('Nao foi possivel consultar o motorista.');
  }
  if (!isRecord(data) || !isRecord(data.motorista)) return null;
  return {
    motorista: data.motorista as AdminDriver,
    veiculos: Array.isArray(data.veiculos) ? (data.veiculos as AdminDriverVehicle[]) : [],
    documentos: Array.isArray(data.documentos)
      ? (data.documentos as AdminDriverDocument[])
      : [],
  };
}

export async function updateAdminDriverStatus(
  supabase: SupabaseServerClient,
  driverId: string,
  action: 'aprovar' | 'rejeitar' | 'suspender' | 'reativar',
  reason?: string,
) {
  const { error } = await supabase.rpc('admin_atualizar_status_motorista', {
    motorista_id_input: driverId,
    acao_input: action,
    motivo_input: reason ?? null,
  });
  if (error) {
    console.error('Erro ao atualizar status do motorista pela RPC administrativa:', {
      code: error.code,
      message: error.message,
      driverId,
      action,
    });
    throw new Error(`Nao foi possivel ${action} o motorista.`);
  }
}

export async function listAdminVehicles(
  supabase: SupabaseServerClient,
  options: { statuses?: string[]; plate?: string; limit?: number; offset?: number } = {},
) {
  const { data, error } = await supabase.rpc('admin_listar_veiculos', {
    status_input: options.statuses ?? null,
    placa_input: options.plate ?? null,
    limite_input: options.limit ?? 50,
    deslocamento_input: options.offset ?? 0,
  });
  if (error) {
    console.error('Erro ao listar veiculos pela RPC administrativa:', {
      code: error.code,
      message: error.message,
    });
    throw new Error('Nao foi possivel listar os veiculos.');
  }
  return parseList<AdminVehicleSummary>(data);
}

export async function getAdminVehicle(
  supabase: SupabaseServerClient,
  vehicleId: string,
): Promise<AdminVehicleDetail | null> {
  const { data, error } = await supabase.rpc('admin_obter_veiculo', {
    veiculo_id_input: vehicleId,
  });
  if (error) {
    console.error('Erro ao consultar veiculo pela RPC administrativa:', {
      code: error.code,
      message: error.message,
      vehicleId,
    });
    throw new Error('Nao foi possivel consultar o veiculo.');
  }
  return isRecord(data) ? (data as AdminVehicleDetail) : null;
}
