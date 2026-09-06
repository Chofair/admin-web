'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export type ReviewState = { status: 'idle' | 'success' | 'error'; message: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function input(formData: FormData) {
  const id = String(formData.get('application_id') ?? '');
  const driverId = String(formData.get('driver_id') ?? '');
  const action = String(formData.get('review_action') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!UUID.test(id) || !UUID.test(driverId) || !['approve', 'reject', 'suspend'].includes(action)) return null;
  if (action !== 'approve' && (reason.length < 10 || reason.length > 500)) return null;
  return { id, driverId, action, reason: reason || null };
}
function refresh(driverId: string) { revalidatePath('/acessibilidade'); revalidatePath(`/acessibilidade/${driverId}`); revalidatePath('/admin'); }

export async function reviewDriver(_state: ReviewState, formData: FormData): Promise<ReviewState> {
  const value = input(formData);
  if (!value) return { status: 'error', message: 'Revise a ação e informe um motivo entre 10 e 500 caracteres.' };
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('admin_review_driver_accessibility', {
    driver_id_input: value.driverId, action_input: value.action,
    ear_observed_input: formData.get('ear_observed') === 'true', reason_input: value.reason,
  });
  if (error) return { status: 'error', message: error.message };
  const reviewedDriverId = String((data as { driver_id?: unknown } | null)?.driver_id ?? value.driverId);
  refresh(UUID.test(reviewedDriverId) ? reviewedDriverId : value.driverId);
  return { status: 'success', message: 'Decisão do perfil registrada.' };
}

export async function reviewVehicle(_state: ReviewState, formData: FormData): Promise<ReviewState> {
  const value = input(formData);
  if (!value) return { status: 'error', message: 'Revise a ação e informe um motivo entre 10 e 500 caracteres.' };
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('admin_review_vehicle_accessibility', {
    vehicle_application_id_input: value.id, action_input: value.action, reason_input: value.reason,
  });
  if (error) return { status: 'error', message: error.message };
  const reviewedDriverId = String((data as { driver_id?: unknown } | null)?.driver_id ?? value.driverId);
  refresh(UUID.test(reviewedDriverId) ? reviewedDriverId : value.driverId);
  return { status: 'success', message: 'Decisão do veículo registrada.' };
}
