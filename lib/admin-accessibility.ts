import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
export type AccessibilityQueueItem = {
  driver_id: string; driver_name: string | null; driver_cpf: string | null;
  status: ApprovalStatus; submission_version: number; ear_observed: boolean;
  submitted_at: string | null; reviewed_at: string | null;
  pending_vehicles: number; approved_vehicles: number; total_vehicles: number;
};
export type AccessibilityDetail = {
  driver: Record<string, unknown> & { cnh_foto_url?: string | null };
  driver_application: Record<string, unknown>;
  vehicles: Record<string, unknown>[];
  evidence: Array<Record<string, unknown> & { storage_path: string; evidence_type: string; submission_version: number; driver_application_id?: string | null; vehicle_application_id?: string | null }>;
  events: Record<string, unknown>[];
};

export async function listAccessibilityApplications(supabase: SupabaseClient, status: ApprovalStatus | null, page = 1) {
  const limit = 30;
  const { data, error } = await supabase.rpc('admin_list_accessibility_applications', {
    status_input: status, limit_input: limit, offset_input: (page - 1) * limit,
  });
  if (error) throw error;
  const result = data as { items?: AccessibilityQueueItem[]; total?: number } | null;
  return { items: result?.items ?? [], total: Number(result?.total ?? 0), limit };
}

export async function getAccessibilityDetail(supabase: SupabaseClient, driverId: string) {
  const { data, error } = await supabase.rpc('admin_get_accessibility_application', { driver_id_input: driverId });
  if (error) throw error;
  return (data as AccessibilityDetail | null) ?? null;
}

export async function getAccessibilityStats(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('admin_accessibility_stats');
  if (error) throw error;
  return data as { pending_profiles: number; pending_vehicles: number; approved_profiles: number; approved_vehicles: number };
}

export async function signAccessibilityEvidence(supabase: SupabaseClient, detail: AccessibilityDetail) {
  const vehicleEvidence = detail.evidence.filter((item) => item.vehicle_application_id);
  return Promise.all(vehicleEvidence.map(async (item) => {
    const { data, error } = await supabase.storage.from('accessibility-evidence').createSignedUrl(item.storage_path, 120);
    return { ...item, signedUrl: error ? null : data.signedUrl };
  }));
}
