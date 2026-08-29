'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export type AcknowledgeMapsAlertState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function acknowledgeMapsAlert(
  _previousState: AcknowledgeMapsAlertState,
  formData: FormData,
): Promise<AcknowledgeMapsAlertState> {
  const alertId = String(formData.get('alert_id') ?? '').trim();

  if (!UUID_PATTERN.test(alertId)) {
    return { status: 'error', message: 'Alerta inválido.' };
  }

  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase
    .from('maps_api_alerts')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
    })
    .eq('id', alertId)
    .is('acknowledged_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Erro ao reconhecer alerta do Google Maps:', {
      code: error.code,
      message: error.message,
      alertId,
      administratorId: user.id,
    });
    return {
      status: 'error',
      message: 'Não foi possível reconhecer o alerta. Atualize a página e tente novamente.',
    };
  }

  revalidatePath('/google-maps');

  return data
    ? { status: 'success', message: 'Alerta reconhecido.' }
    : { status: 'success', message: 'Este alerta já havia sido reconhecido.' };
}
