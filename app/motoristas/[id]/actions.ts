'use server';

import { requireAdmin } from '@/lib/auth';
import { updateAdminDriverStatus } from '@/lib/admin-driver-vehicles';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function aprovarMotorista(motoristaId: string) {
  const { supabase } = await requireAdmin();

  await updateAdminDriverStatus(supabase, motoristaId, 'aprovar');

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

  await updateAdminDriverStatus(supabase, motoristaId, 'rejeitar', motivo.trim());

  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath('/motoristas');
  redirect(`/motoristas/${motoristaId}?msg=rejeitado`);
}

export async function suspenderMotorista(motoristaId: string) {
  const { supabase } = await requireAdmin();

  await updateAdminDriverStatus(supabase, motoristaId, 'suspender');

  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath('/motoristas');
  redirect(`/motoristas/${motoristaId}?msg=suspenso`);
}

export async function reativarMotorista(motoristaId: string) {
  const { supabase } = await requireAdmin();

  await updateAdminDriverStatus(supabase, motoristaId, 'reativar');

  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath('/motoristas');
  redirect(`/motoristas/${motoristaId}?msg=reativado`);
}
