'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
export type DecisionState = {
    message: string;
    ok: boolean;
};
export async function decideCancellation(_previous: DecisionState, form: FormData): Promise<DecisionState> {
    const { supabase } = await requireAdmin();
    const id = String(form.get('id') ?? '');
    const topic = String(form.get('tema') ?? '');
    const decision = String(form.get('decisao') ?? '');
    const reason = String(form.get('motivo') ?? '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(id) || !['reembolso', 'repasse', 'transferencia'].includes(topic))
        return { ok: false, message: 'Dados inválidos.' };
    if (topic === 'transferencia' ? (reason.length < 3 || reason.length > 200) : (!['aprovado', 'negado'].includes(decision) || reason.length < 10 || reason.length > 500))
        return { ok: false, message: 'Preencha a decisão e a justificativa ou o identificador da transferência.' };
    const { error } = topic === 'transferencia' ? await supabase.rpc('admin_confirmar_repasse_v2', { solicitacao_id_input: id, transferencia_id_input: reason }) : await supabase.rpc('admin_decidir_cancelamento_v2', { solicitacao_id_input: id, tema_input: topic, decisao_input: decision, motivo_input: reason });
    if (error)
        return { ok: false, message: 'Não foi possível registrar. Atualize a página e confira se a decisão já foi tomada e se a corrida foi encerrada antes de aprovar o repasse.' };
    for (const path of ['/cancelamentos', '/cancelamentos-pagamento', '/pagamentos', `/solicitacoes/${id}`])
        revalidatePath(path);
    return { ok: true, message: topic === 'transferencia' ? 'Pagamento do repasse registrado.' : topic === 'repasse' ? 'Decisao do repasse registrada. A transferencia aprovada deve ser confirmada separadamente.' : 'Decisão registrada. A aprovação do reembolso inicia o processamento no provedor.' };
}
