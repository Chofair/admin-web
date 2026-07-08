'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function confirmarRepasse(repasseId: string) {
  const { error } = await supabaseAdmin
    .from('repasses_motorista')
    .update({ status: 'pago', pago_em: new Date().toISOString() })
    .eq('id', repasseId);

  if (error) {
    throw new Error(`Erro ao confirmar repasse: ${error.message}`);
  }

  revalidatePath('/pagamentos');
}

export async function reverterRepasse(repasseId: string) {
  const { error } = await supabaseAdmin
    .from('repasses_motorista')
    .update({ status: 'pendente', pago_em: null })
    .eq('id', repasseId);

  if (error) {
    throw new Error(`Erro ao reverter repasse: ${error.message}`);
  }

  revalidatePath('/pagamentos');
}
