'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function updatePayout(payoutId: string, action: 'confirmar' | 'reverter') {
  if (!UUID_PATTERN.test(payoutId)) {
    throw new Error('Repasse inválido.');
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_atualizar_status_repasse', {
    repasse_id_input: payoutId,
    acao_input: action,
  });

  if (error) {
    console.error('Erro ao atualizar repasse:', {
      code: error.code,
      message: error.message,
      payoutId,
      action,
    });
    throw new Error('Não foi possível atualizar o repasse.');
  }

  revalidatePath('/pagamentos');
  revalidatePath('/admin');
}

export async function confirmarRepasse(repasseId: string) {
  await updatePayout(repasseId, 'confirmar');
}

export async function reverterRepasse(repasseId: string) {
  await updatePayout(repasseId, 'reverter');
}
