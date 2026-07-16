'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export type VehicleActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeMessage(message: string) {
  return message.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function getRpcErrorMessage(message: string, fallback: string) {
  const knownErrors = [
    'CRLV-e não enviado',
    'Arquivo do CRLV-e não encontrado no Storage',
    'Ar-condicionado não confirmado',
    'Dados documentais incompletos',
    'Capacidade de passageiros não informada',
    'Categoria do veículo não informada',
    'Recursos de acessibilidade não informados',
    'Pendências documentais ainda precisam de revisão',
    'Placa inválida',
    'RENAVAM inválido',
    'Marca obrigatória ou inválida',
    'Modelo obrigatório ou inválido',
    'Ano obrigatório ou inválido',
    'Ano abaixo do mínimo permitido',
    'Configuração de ano mínimo indisponível',
    'Cor obrigatória ou inválida',
    'Capacidade de passageiros inválida',
    'O motivo deve ter entre 10 e 250 caracteres',
    'Veículo não encontrado',
  ];
  const normalized = normalizeMessage(message);
  const known = knownErrors.find((item) => normalized.includes(normalizeMessage(item)));
  return known ?? fallback;
}

function getVehicleId(formData: FormData) {
  const vehicleId = String(formData.get('vehicle_id') ?? '');
  return UUID_PATTERN.test(vehicleId) ? vehicleId : null;
}

function revalidateVehicle(vehicleId: string, data: unknown) {
  const vehicle = data as { motorista_id?: string } | null;
  revalidatePath('/veiculos');
  revalidatePath('/veiculos/' + vehicleId);
  revalidatePath('/admin');
  if (vehicle?.motorista_id) revalidatePath('/motoristas/' + vehicle.motorista_id);
}

export async function saveVehicleReview(
  _previousState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  const vehicleId = getVehicleId(formData);
  if (!vehicleId) return { status: 'error', message: 'Veículo inválido.' };

  const placa = String(formData.get('placa') ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const renavam = String(formData.get('renavam') ?? '').replace(/\D/g, '');
  const marca = String(formData.get('marca') ?? '').trim();
  const modelo = String(formData.get('modelo') ?? '').trim();
  const ano = Number.parseInt(String(formData.get('ano') ?? ''), 10);
  const cor = String(formData.get('cor') ?? '').trim();
  const capacidade = Number.parseInt(String(formData.get('capacidade_passageiros') ?? ''), 10);
  const maxYear = new Date().getFullYear() + 1;

  if (!/^[A-Z]{3}([0-9]{4}|[0-9][A-Z][0-9]{2})$/.test(placa)) {
    return { status: 'error', message: 'Informe uma placa válida.' };
  }
  if (!/^\d{9,11}$/.test(renavam)) {
    return { status: 'error', message: 'Informe um RENAVAM válido.' };
  }
  if (!marca || marca.length > 80) {
    return { status: 'error', message: 'Informe uma marca válida.' };
  }
  if (!modelo || modelo.length > 120) {
    return { status: 'error', message: 'Informe um modelo válido.' };
  }
  if (!Number.isInteger(ano) || ano < 1900 || ano > maxYear) {
    return { status: 'error', message: 'Informe um ano válido.' };
  }
  if (!cor || cor.length > 50) {
    return { status: 'error', message: 'Informe uma cor válida.' };
  }
  if (!Number.isInteger(capacidade) || capacidade < 1 || capacidade > 20) {
    return { status: 'error', message: 'Informe uma capacidade entre 1 e 20.' };
  }

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('admin_save_vehicle_review', {
    p_vehicle_id: vehicleId,
    p_fields: {
      placa,
      renavam,
      marca,
      modelo,
      ano,
      cor,
      capacidade_passageiros: capacidade,
    },
  });

  if (error) {
    console.error('Erro ao salvar revisão manual do veículo:', {
      code: error.code,
      message: error.message,
      vehicleId,
    });
    return {
      status: 'error',
      message: getRpcErrorMessage(
        error.message,
        'Não foi possível salvar a revisão. Confira os valores e tente novamente.'
      ),
    };
  }

  revalidateVehicle(vehicleId, data);
  return { status: 'success', message: 'Revisão manual salva. O veículo continua pendente até a aprovação.' };
}

export async function rejectVehicle(
  _previousState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  const vehicleId = getVehicleId(formData);
  if (!vehicleId) return { status: 'error', message: 'Veículo inválido.' };

  const reason = String(formData.get('reason') ?? '').trim();
  if (reason.length < 10 || reason.length > 250) {
    return { status: 'error', message: 'O motivo deve ter entre 10 e 250 caracteres.' };
  }

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('admin_reject_vehicle', {
    p_vehicle_id: vehicleId,
    p_reason: reason,
  });

  if (error) {
    console.error('Erro ao rejeitar veículo via RPC:', {
      code: error.code,
      message: error.message,
      vehicleId,
    });
    return {
      status: 'error',
      message: getRpcErrorMessage(error.message, 'Não foi possível rejeitar o veículo.'),
    };
  }

  revalidateVehicle(vehicleId, data);
  return { status: 'success', message: 'Veículo rejeitado e motivo registrado.' };
}

export async function approveVehicle(
  _previousState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  const vehicleId = getVehicleId(formData);
  if (!vehicleId) return { status: 'error', message: 'Veículo inválido.' };

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('admin_approve_vehicle', {
    p_vehicle_id: vehicleId,
  });

  if (error) {
    console.error('Erro ao aprovar veículo via RPC:', {
      code: error.code,
      message: error.message,
      vehicleId,
    });
    return {
      status: 'error',
      message: getRpcErrorMessage(
        error.message,
        'Não foi possível aprovar o veículo. Revise os dados e tente novamente.'
      ),
    };
  }

  revalidateVehicle(vehicleId, data);
  return { status: 'success', message: 'Veículo aprovado com sucesso.' };
}
