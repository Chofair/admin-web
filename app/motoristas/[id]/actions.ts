'use server';

import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function aprovarMotorista(motoristaId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('driver_profiles')
    .update({
      status_motorista: 'aprovado',
      verificado: true,
      data_aprovacao: new Date().toISOString(),
      motivo_rejeicao: null,
    })
    .eq('id', motoristaId);

  if (error) {
    throw new Error(`Erro ao aprovar motorista: ${error.message}`);
  }

  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath('/motoristas');
  redirect(`/motoristas/${motoristaId}?msg=aprovado`);
}

export async function rejeitarMotorista(formData: FormData) {
  const { supabase } = await requireAdmin();

  const motoristaId = formData.get('motorista_id') as string;
  const motivo = formData.get('motivo') as string;

  if (!motoristaId || !motivo?.trim()) {
    throw new Error('ID do motorista e motivo são obrigatórios');
  }

  const { error } = await supabase
    .from('driver_profiles')
    .update({
      status_motorista: 'rejeitado',
      verificado: false,
      motivo_rejeicao: motivo.trim(),
    })
    .eq('id', motoristaId);

  if (error) {
    throw new Error(`Erro ao rejeitar motorista: ${error.message}`);
  }

  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath('/motoristas');
  redirect(`/motoristas/${motoristaId}?msg=rejeitado`);
}

export async function suspenderMotorista(motoristaId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('driver_profiles')
    .update({
      status_motorista: 'suspenso',
      verificado: false,
    })
    .eq('id', motoristaId);

  if (error) {
    throw new Error(`Erro ao suspender motorista: ${error.message}`);
  }

  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath('/motoristas');
  redirect(`/motoristas/${motoristaId}?msg=suspenso`);
}

export async function reativarMotorista(motoristaId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('driver_profiles')
    .update({
      status_motorista: 'aprovado',
      verificado: true,
    })
    .eq('id', motoristaId);

  if (error) {
    throw new Error(`Erro ao reativar motorista: ${error.message}`);
  }

  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath('/motoristas');
  redirect(`/motoristas/${motoristaId}?msg=reativado`);
}
