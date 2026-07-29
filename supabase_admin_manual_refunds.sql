-- Admin-panel support for auditable manual refunds and operational context.
-- Apply after the latest ChofairApp migrations, especially:
--   supabase_ride_admin_review.sql
--   supabase_pending_request_cancellation.sql
--   supabase_payment_pending_reconciliation.sql
--
-- A manual refund is an operational record. It deliberately does not update
-- public.pagamentos.status, which remains the last status reported by
-- AbacatePay and can only be changed by the provider integration.

begin;

set local timezone = 'UTC';

create table if not exists public.pagamento_reembolsos_manuais (
	id uuid primary key default gen_random_uuid(),
	cancelamento_id uuid not null unique
		references public.solicitacao_cancelamentos(id) on delete restrict,
	pagamento_id uuid not null
		references public.pagamentos(id) on delete restrict,
	solicitacao_id uuid not null
		references public.solicitacoes(id) on delete restrict,
	metodo text not null,
	administrador_id uuid not null
		references public.profiles(id) on delete restrict,
	realizado_em timestamp with time zone not null default now(),
	valor_centavos integer not null,
	referencia text not null,
	observacao text not null,
	status_pagamento_no_registro text not null,
	criado_em timestamp with time zone not null default now(),
	constraint pagamento_reembolsos_manuais_metodo_check
		check (
			metodo in (
				'pix',
				'transferencia_bancaria',
				'dinheiro',
				'credito_em_conta',
				'outro'
			)
		),
	constraint pagamento_reembolsos_manuais_valor_check
		check (valor_centavos > 0),
	constraint pagamento_reembolsos_manuais_referencia_check
		check (char_length(referencia) between 3 and 200),
	constraint pagamento_reembolsos_manuais_observacao_check
		check (char_length(observacao) between 10 and 1000)
);

create index if not exists idx_pagamento_reembolsos_manuais_pagamento
on public.pagamento_reembolsos_manuais (pagamento_id, realizado_em desc);

create index if not exists idx_pagamento_reembolsos_manuais_solicitacao
on public.pagamento_reembolsos_manuais (solicitacao_id, realizado_em desc);

alter table public.pagamento_reembolsos_manuais enable row level security;

revoke all on table public.pagamento_reembolsos_manuais
from public, anon, authenticated;
grant all on table public.pagamento_reembolsos_manuais to service_role;

create or replace function public.admin_registrar_reembolso_manual(
	cancelamento_id_input uuid,
	metodo_input text,
	valor_centavos_input integer,
	referencia_input text,
	observacao_input text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
set timezone = 'UTC'
as $function$
declare
	v_admin_id uuid := auth.uid();
	v_is_admin boolean := false;
	v_metodo text := lower(btrim(coalesce(metodo_input, '')));
	v_referencia text := btrim(coalesce(referencia_input, ''));
	v_observacao text := btrim(coalesce(observacao_input, ''));
	v_cancelamento record;
	v_pagamento record;
	v_existente record;
	v_reembolso_id uuid;
	v_realizado_em timestamp with time zone := now();
begin
	if v_admin_id is null then
		raise exception using errcode = '42501', message = 'Autenticacao obrigatoria';
	end if;

	select coalesce(p.is_admin, false)
	into v_is_admin
	from public.profiles as p
	where p.id = v_admin_id;

	if not coalesce(v_is_admin, false) then
		raise exception using
			errcode = '42501',
			message = 'Apenas administradores podem registrar reembolsos';
	end if;

	if v_metodo not in (
		'pix',
		'transferencia_bancaria',
		'dinheiro',
		'credito_em_conta',
		'outro'
	) then
		raise exception 'Metodo de reembolso invalido';
	end if;

	if valor_centavos_input is null or valor_centavos_input <= 0 then
		raise exception 'Valor de reembolso invalido';
	end if;

	if char_length(v_referencia) < 3 or char_length(v_referencia) > 200 then
		raise exception 'A referencia deve ter entre 3 e 200 caracteres';
	end if;

	if char_length(v_observacao) < 10 or char_length(v_observacao) > 1000 then
		raise exception 'A observacao deve ter entre 10 e 1000 caracteres';
	end if;

	select
		c.id,
		c.solicitacao_id,
		c.pagamento_id,
		c.tratamento_financeiro,
		c.status,
		c.resultado
	into v_cancelamento
	from public.solicitacao_cancelamentos as c
	where c.id = cancelamento_id_input
	for update;

	if not found then
		raise exception 'Cancelamento financeiro nao encontrado';
	end if;

	select
		r.id,
		r.metodo,
		r.valor_centavos,
		r.referencia,
		r.realizado_em
	into v_existente
	from public.pagamento_reembolsos_manuais as r
	where r.cancelamento_id = cancelamento_id_input;

	if found then
		return jsonb_build_object(
			'success', true,
			'already_registered', true,
			'reembolso_id', v_existente.id,
			'metodo', v_existente.metodo,
			'valor_centavos', v_existente.valor_centavos,
			'referencia', v_existente.referencia,
			'realizado_em', v_existente.realizado_em
		);
	end if;

	if v_cancelamento.status is distinct from 'aberta'
		or v_cancelamento.tratamento_financeiro is distinct from 'reembolso'
	then
		raise exception 'Este cancelamento nao esta aguardando reembolso';
	end if;

	select
		p.id,
		p.solicitacao_id,
		p.status,
		p.valor_centavos
	into v_pagamento
	from public.pagamentos as p
	where p.id = v_cancelamento.pagamento_id
	for update;

	if not found then
		raise exception 'Pagamento associado nao encontrado';
	end if;

	if v_pagamento.solicitacao_id is distinct from v_cancelamento.solicitacao_id then
		raise exception 'Pagamento nao pertence ao cancelamento informado';
	end if;

	-- The provider status is only observed here. It is never changed.
	if v_pagamento.status is distinct from 'PAID' then
		raise exception
			'O pagamento nao esta PAID na AbacatePay; aguarde a conciliacao antes do registro manual';
	end if;

	-- The cancellation queue currently represents a full cancellation. Requiring
	-- the exact paid amount prevents a partial reimbursement from closing it.
	if valor_centavos_input is distinct from v_pagamento.valor_centavos then
		raise exception
			'O valor deve corresponder integralmente ao pagamento associado';
	end if;

	insert into public.pagamento_reembolsos_manuais (
		cancelamento_id,
		pagamento_id,
		solicitacao_id,
		metodo,
		administrador_id,
		realizado_em,
		valor_centavos,
		referencia,
		observacao,
		status_pagamento_no_registro
	)
	values (
		v_cancelamento.id,
		v_pagamento.id,
		v_cancelamento.solicitacao_id,
		v_metodo,
		v_admin_id,
		v_realizado_em,
		valor_centavos_input,
		v_referencia,
		v_observacao,
		v_pagamento.status
	)
	returning id into v_reembolso_id;

	update public.solicitacao_cancelamentos
	set
		status = 'resolvida',
		resolvida_em = v_realizado_em,
		resultado = 'reembolsado'
	where id = v_cancelamento.id
		and status = 'aberta'
		and tratamento_financeiro = 'reembolso';

	if not found then
		raise exception 'O cancelamento foi alterado durante o registro do reembolso';
	end if;

	return jsonb_build_object(
		'success', true,
		'already_registered', false,
		'reembolso_id', v_reembolso_id,
		'cancelamento_id', v_cancelamento.id,
		'pagamento_id', v_pagamento.id,
		'pagamento_status_preservado', v_pagamento.status,
		'valor_centavos', valor_centavos_input,
		'realizado_em', v_realizado_em
	);
end;
$function$;

create or replace function public.admin_listar_cancelamentos_pagamento(
	status_input text default 'aberta',
	limite_input integer default 50,
	antes_de_input timestamp with time zone default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
set timezone = 'UTC'
as $function$
declare
	v_admin_id uuid := auth.uid();
	v_is_admin boolean := false;
	v_status text := lower(btrim(coalesce(status_input, 'aberta')));
	v_limite integer := least(greatest(coalesce(limite_input, 50), 1), 100);
	v_items jsonb;
	v_next_cursor timestamp with time zone;
begin
	if v_admin_id is null then
		raise exception using errcode = '42501', message = 'Autenticacao obrigatoria';
	end if;

	select coalesce(p.is_admin, false)
	into v_is_admin
	from public.profiles as p
	where p.id = v_admin_id;

	if not coalesce(v_is_admin, false) then
		raise exception using
			errcode = '42501',
			message = 'Apenas administradores podem consultar cancelamentos';
	end if;

	if v_status not in ('aberta', 'resolvida', 'todas') then
		raise exception 'Status de cancelamento invalido';
	end if;

	with pagina as (
		select
			c.id,
			c.solicitacao_id,
			c.usuario_id,
			u.name as usuario_nome,
			c.pagamento_id,
			c.tratamento_financeiro,
			c.status,
			c.motivo,
			c.criada_em,
			c.resolvida_em,
			c.resultado,
			c.snapshot_financeiro,
			p.status as pagamento_status_atual,
			p.valor_centavos,
			p.abacatepay_billing_id,
			p.pago_em,
			case
				when rm.id is null then null
				else jsonb_build_object(
					'id', rm.id,
					'metodo', rm.metodo,
					'administrador_id', rm.administrador_id,
					'administrador_nome', administrador.name,
					'realizado_em', rm.realizado_em,
					'valor_centavos', rm.valor_centavos,
					'referencia', rm.referencia,
					'observacao', rm.observacao,
					'status_pagamento_no_registro', rm.status_pagamento_no_registro
				)
			end as reembolso_manual
		from public.solicitacao_cancelamentos as c
		left join public.profiles as u on u.id = c.usuario_id
		left join public.pagamentos as p on p.id = c.pagamento_id
		left join public.pagamento_reembolsos_manuais as rm
			on rm.cancelamento_id = c.id
		left join public.profiles as administrador
			on administrador.id = rm.administrador_id
		where (v_status = 'todas' or c.status = v_status)
			and (antes_de_input is null or c.criada_em < antes_de_input)
		order by c.criada_em desc, c.id desc
		limit v_limite
	)
	select
		coalesce(
			jsonb_agg(to_jsonb(pagina) order by pagina.criada_em desc),
			'[]'::jsonb
		),
		min(pagina.criada_em)
	into v_items, v_next_cursor
	from pagina;

	return jsonb_build_object(
		'items', v_items,
		'next_cursor', v_next_cursor,
		'limit', v_limite
	);
end;
$function$;

create or replace function public.admin_obter_contexto_solicitacao(
	solicitacao_id_input uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
set timezone = 'UTC'
as $function$
declare
	v_admin_id uuid := auth.uid();
	v_is_admin boolean := false;
	v_resultado jsonb;
begin
	if v_admin_id is null then
		raise exception using errcode = '42501', message = 'Autenticacao obrigatoria';
	end if;

	select coalesce(p.is_admin, false)
	into v_is_admin
	from public.profiles as p
	where p.id = v_admin_id;

	if not coalesce(v_is_admin, false) then
		raise exception using
			errcode = '42501',
			message = 'Apenas administradores podem consultar o contexto da solicitacao';
	end if;

	if not exists (
		select 1
		from public.solicitacoes as s
		where s.id = solicitacao_id_input
	) then
		raise exception 'Solicitacao nao encontrada';
	end if;

	select jsonb_build_object(
		'revisao',
		(
			select to_jsonb(revisao)
			from (
				select
					r.id,
					r.status,
					r.motivo,
					r.solicitante_papel,
					solicitante.name as solicitante_nome,
					r.criada_em,
					r.decisao,
					r.observacao_admin,
					r.resolvida_em,
					revisor.name as revisor_nome,
					r.snapshot_financeiro,
					r.resultado_financeiro
				from public.corrida_revisoes as r
				left join public.profiles as solicitante
					on solicitante.id = r.solicitante_id
				left join public.profiles as revisor
					on revisor.id = r.resolvida_por
				where r.solicitacao_id = solicitacao_id_input
			) as revisao
		),
		'cancelamento',
		(
			select to_jsonb(cancelamento)
			from (
				select
					c.id,
					c.tratamento_financeiro,
					c.status,
					c.motivo,
					c.criada_em,
					c.resolvida_em,
					c.resultado,
					c.snapshot_financeiro
				from public.solicitacao_cancelamentos as c
				where c.solicitacao_id = solicitacao_id_input
			) as cancelamento
		),
		'reembolso_manual',
		(
			select to_jsonb(reembolso)
			from (
				select
					rm.id,
					rm.metodo,
					rm.realizado_em,
					rm.valor_centavos,
					rm.referencia,
					rm.observacao,
					rm.status_pagamento_no_registro,
					administrador.name as administrador_nome
				from public.pagamento_reembolsos_manuais as rm
				left join public.profiles as administrador
					on administrador.id = rm.administrador_id
				where rm.solicitacao_id = solicitacao_id_input
				order by rm.realizado_em desc
				limit 1
			) as reembolso
		)
	)
	into v_resultado;

	return v_resultado;
end;
$function$;

create or replace function public.admin_obter_alertas_operacionais()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
set timezone = 'UTC'
as $function$
declare
	v_admin_id uuid := auth.uid();
	v_is_admin boolean := false;
begin
	if v_admin_id is null then
		raise exception using errcode = '42501', message = 'Autenticacao obrigatoria';
	end if;

	select coalesce(p.is_admin, false)
	into v_is_admin
	from public.profiles as p
	where p.id = v_admin_id;

	if not coalesce(v_is_admin, false) then
		raise exception using
			errcode = '42501',
			message = 'Apenas administradores podem consultar alertas operacionais';
	end if;

	return jsonb_build_object(
		'revisoes_corridas_abertas',
		(
			select count(*)
			from public.corrida_revisoes as r
			where r.status = 'aberta'
		),
		'cancelamentos_abertos',
		(
			select count(*)
			from public.solicitacao_cancelamentos as c
			where c.status = 'aberta'
		),
		'reembolsos_manuais_pendentes',
		(
			select count(*)
			from public.solicitacao_cancelamentos as c
			where c.status = 'aberta'
				and c.tratamento_financeiro = 'reembolso'
		),
		'pagamentos_pendentes_conciliacao',
		(
			select count(*)
			from public.pagamentos as p
			where p.status = 'PENDING'
				and p.conciliacao_encerrada_em is null
				and p.created_at <= now() - interval '10 minutes'
		),
		'conciliacoes_encerradas_pendentes',
		(
			select count(*)
			from public.pagamentos as p
			where p.status = 'PENDING'
				and p.conciliacao_encerrada_em is not null
		)
	);
end;
$function$;

create or replace function public.admin_atualizar_status_repasse(
	repasse_id_input uuid,
	acao_input text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
set timezone = 'UTC'
as $function$
declare
	v_admin_id uuid := auth.uid();
	v_is_admin boolean := false;
	v_acao text := lower(btrim(coalesce(acao_input, '')));
	v_repasse record;
	v_novo_status text;
	v_pago_em timestamp with time zone;
begin
	if v_admin_id is null then
		raise exception using errcode = '42501', message = 'Autenticacao obrigatoria';
	end if;

	select coalesce(p.is_admin, false)
	into v_is_admin
	from public.profiles as p
	where p.id = v_admin_id;

	if not coalesce(v_is_admin, false) then
		raise exception using
			errcode = '42501',
			message = 'Apenas administradores podem atualizar repasses';
	end if;

	if v_acao not in ('confirmar', 'reverter') then
		raise exception 'Acao de repasse invalida';
	end if;

	select r.id, r.status, r.pago_em
	into v_repasse
	from public.repasses_motorista as r
	where r.id = repasse_id_input
	for update;

	if not found then
		raise exception 'Repasse nao encontrado';
	end if;

	v_novo_status := case
		when v_acao = 'confirmar' then 'pago'
		else 'pendente'
	end;

	if v_repasse.status = v_novo_status then
		return jsonb_build_object(
			'success', true,
			'already_updated', true,
			'repasse_id', v_repasse.id,
			'status', v_repasse.status,
			'pago_em', v_repasse.pago_em
		);
	end if;

	if (v_acao = 'confirmar' and v_repasse.status is distinct from 'pendente')
		or (v_acao = 'reverter' and v_repasse.status is distinct from 'pago')
	then
		raise exception 'Transicao de repasse invalida';
	end if;

	v_pago_em := case when v_acao = 'confirmar' then now() else null end;

	update public.repasses_motorista
	set
		status = v_novo_status,
		pago_em = v_pago_em
	where id = v_repasse.id
		and status = v_repasse.status;

	if not found then
		raise exception 'O repasse foi alterado durante a atualizacao';
	end if;

	return jsonb_build_object(
		'success', true,
		'already_updated', false,
		'repasse_id', v_repasse.id,
		'status', v_novo_status,
		'pago_em', v_pago_em,
		'atualizado_por', v_admin_id
	);
end;
$function$;

revoke all on function public.admin_registrar_reembolso_manual(
	uuid,
	text,
	integer,
	text,
	text
) from public, anon, authenticated;
revoke all on function public.admin_listar_cancelamentos_pagamento(
	text,
	integer,
	timestamp with time zone
) from public, anon, authenticated;
revoke all on function public.admin_obter_contexto_solicitacao(uuid)
from public, anon, authenticated;
revoke all on function public.admin_obter_alertas_operacionais()
from public, anon, authenticated;
revoke all on function public.admin_atualizar_status_repasse(uuid, text)
from public, anon, authenticated;

grant execute on function public.admin_registrar_reembolso_manual(
	uuid,
	text,
	integer,
	text,
	text
) to authenticated;
grant execute on function public.admin_listar_cancelamentos_pagamento(
	text,
	integer,
	timestamp with time zone
) to authenticated;
grant execute on function public.admin_obter_contexto_solicitacao(uuid)
to authenticated;
grant execute on function public.admin_obter_alertas_operacionais()
to authenticated;
grant execute on function public.admin_atualizar_status_repasse(uuid, text)
to authenticated;

comment on table public.pagamento_reembolsos_manuais is
'Registro privado e auditavel de reembolsos executados fora da AbacatePay; nao altera o status do provedor.';
comment on function public.admin_registrar_reembolso_manual(
	uuid,
	text,
	integer,
	text,
	text
) is
'Registra um reembolso manual integral, identifica o administrador e preserva public.pagamentos.status.';
comment on function public.admin_obter_contexto_solicitacao(uuid) is
'Retorna ao administrador o historico privado de revisao, cancelamento e reembolso de uma solicitacao.';
comment on function public.admin_obter_alertas_operacionais() is
'Retorna contadores enxutos para alertas do dashboard administrativo.';
comment on function public.admin_atualizar_status_repasse(uuid, text) is
'Confirma ou reverte um repasse com autorizacao administrativa e transicao validada.';

notify pgrst, 'reload schema';

commit;
