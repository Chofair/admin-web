# Publicação do backend em produção — 29/10/2026

A promoção foi autorizada após a homologação em staging. O merge da PR #14 já havia publicado o admin-web pela automação da master; faltavam as dependências do Supabase utilizadas pelo dashboard e pela ficha do motorista.

## Comparação antes da publicação

- Staging: `nwyjzyfuxxhqczdtkjnd`, 86 migrations e 15 Edge Functions.
- Produção: `jzxnzrtefgqhbopbcdxy`, 76 migrations e 14 Edge Functions.
- Nenhuma versão de migration era exclusiva de produção. Staging tinha as nove migrations desta entrega e uma migration anterior de cadastro em cidades não atendidas, `20261023190000_allow_driver_registration_in_unserved_city`.
- Essa migration anterior de cidade foi excluída da promoção. A migration local `20261025120000_split_customer_city_availability_by_vertical.sql`, também alheia ao trabalho, não foi aplicada.
- As colunas, políticas e triggers preexistentes de produção estavam presentes em staging. As funções SQL fora da entrega eram iguais, exceto a regra de cadastro relacionada à migration de cidade; a definição de produção foi preservada.
- Produção tinha versões com diferenças de tipagem nas Edge Functions `login-cpf`, `recuperar-senha`, `autocomplete-endereco` e `reconciliar-pagamentos-pendentes`. Elas não foram republicadas.
- Produção também tinha secrets próprios e um cron adicional `reconciliar-pagamentos-pendentes`, a cada seis horas. Todas essas configurações foram preservadas; nenhum agendamento foi criado, removido ou alterado.
- O histórico antigo contém diferenças no conteúdo SQL armazenado, inclusive versões sem statements em staging. A promoção não reaplicou nem reparou artificialmente versões antigas. As definições relevantes do catálogo foram comparadas e o histórico anterior de produção permaneceu intacto.

## Conteúdo publicado

Somente as nove migrations desta entrega, em ordem:

1. `20261028120000_admin_driver_editing.sql`
2. `20261028130000_admin_driver_correction_integrity.sql`
3. `20261028140000_private_cnh_reference_guards.sql`
4. `20261028150000_defer_driver_auth_email_audit.sql`
5. `20261028160000_driver_edit_conflict_http_status.sql`
6. `20261028170000_preserve_untouched_driver_profile_fields.sql`
7. `20261029120000_admin_driver_canonical_email.sql`
8. `20261029130000_bounded_cancellation_reconciliation.sql`
9. `20261029140000_prioritize_paid_cancellation_refunds.sql`

Quatro funções publicadas e ativas:

| Função | Versão após a publicação |
| --- | --- |
| `admin-corrigir-email-motorista` | 1 |
| `excluir-conta` | 9 |
| `processar-reembolsos-automaticos` | 10 |
| `mercadopago-webhook` | 49 |

Foi usada uma cópia isolada do commit `ca5de6406beff2d2810611c30bc3fcb8beffee87` do ChofairApp, comparada com as funções testadas em staging. Alterações locais em andamento no ChofairApp e os vínculos originais dos projetos não foram modificados. O dry-run listou exatamente as nove migrations, sem seeds ou roles. Não houve cópia de usuários, arquivos, registros de teste, pagamentos ou valores de secrets entre os bancos.

Após a publicação e as verificações, o controle financeiro novo foi habilitado somente para `production` no projeto de produção. `sandbox` continua desativado nesse projeto; staging permanece independente.

## Validação concluída

- Os testes SQL de cadastro/CNH/login/exclusão e conciliação passaram novamente no staging com rollback, usando o código aprovado.
- As nove migrations estão aplicadas em produção; o dry-run final da entrega não apresenta pendências. O histórico passou de 76 para 85 versões.
- O código das quatro funções publicadas foi baixado e comparado com a cópia aprovada, incluindo helpers: todos os arquivos correspondem, desconsiderando BOM, finais de linha e espaços nas extremidades do arquivo.
- Leituras do dashboard e de uma ficha de motorista passaram sob o papel autenticado e a permissão de administrador. A transação de verificação foi revertida e nenhum cadastro foi alterado.
- As duas RPCs estão disponíveis pelo PostgREST e recusam acesso anônimo com HTTP 401 / `42501`.
- As quatro Edge Functions recusaram chamadas sem autorização; o webhook executou a checagem de assinatura. Não houve chamada ao Mercado Pago nessas verificações.
- Bucket de CNH privado e RLS das novas tabelas de auditoria conferidos.
- Histórico anterior, colunas, políticas, funções fora do escopo, secrets e crons de produção preservados. A única migration presente apenas em staging após a entrega continua sendo a regra anterior de cidade.

## Efeito no aplicativo

Não há atualização de telas móveis nem necessidade de publicar Android/iOS. O cadastro, as regras de cidade de produção, a solicitação de serviços e a criação normal de pagamentos mantêm o código anterior.

As mudanças têm efeitos intencionais no backend: correções administrativas passam a aparecer no cadastro ao recarregar os dados; corrigir o e-mail pelo painel muda o endereço utilizado no login e na recuperação de senha, mantendo ID e senha; CNHs substituídas ficam privadas e o motorista aprovado continua sem poder alterá-las pelo app; a exclusão passa a limpar também esses documentos e sua auditoria; cancelamentos e devoluções passam pelo processamento limitado e pelo webhook atualizado.

Pagamentos confirmados cancelados sem aceite no T−15 continuam elegíveis ao reembolso integral automático. Resultado desconhecido não é tratado como ausência de cobrança, e devolução só é concluída com evidência do provedor. Cancelamentos por ausência de início registrado continuam exigindo avaliação operacional quando aplicável.

## Ajustes posteriores dos agendamentos

Após a promoção descrita acima, os dois crons de conciliação foram comparados: chamavam a mesma Edge Function `reconciliar-pagamentos-pendentes`, que não usa o corpo da requisição para selecionar outro fluxo. Ambos usavam autenticação via Vault. O cron de seis horas foi considerado redundante.

A migration `20261029150000_deduplicate_payment_reconciliation_schedule.sql` foi testada com rollback e aplicada no staging e em produção. Ela removeu o duplicado em produção e alterou o principal para dez minutos. Foram conferidos o comando original, a autenticação, o estado ativo e os outros jobs, preservados. Os dois ambientes passaram a ter nove agendamentos ativos.

A migration `20261029160000_schedule_automatic_refunds_every_five_minutes.sql` foi preparada no ChofairApp, validada com rollback e mantida na branch atual da PR para publicação pelo responsável. O teste conferiu repetição segura e alteração exclusiva do intervalo do job de reembolsos. Nenhuma alteração persistente dessa nova migration foi feita nos bancos nesta etapa.

| Rotina | Configuração aplicada nos dois ambientes | Próxima alteração preparada |
| --- | --- | --- |
| Cancelamento de corridas expiradas | A cada minuto | Nenhuma |
| Conciliação de pagamentos pendentes | A cada dez minutos | Nenhuma |
| Processamento automático de reembolsos | A cada minuto | A cada cinco minutos, após aplicar `20261029160000` |

A troca de frequência não altera elegibilidade, prioridade, limites de chamadas, chave de idempotência ou webhook. O executor continua selecionando até três tarefas por rodada; diminuir a frequência reduz as execuções previstas e pode aumentar a espera em uma fila maior. Não foi necessário publicar funções ou versão do aplicativo para preparar esse ajuste.
