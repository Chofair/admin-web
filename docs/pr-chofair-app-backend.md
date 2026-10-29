# Backend para correções administrativas de motoristas e conciliação limitada

## Problema e resultado

A proteção da CNH aprovada impedia a operação de corrigir dados e substituir documentos vencidos. Em paralelo, cancelamentos podiam manter cobranças incertas sem um processamento limitado e uma apresentação operacional clara.

Esta PR acrescenta um caminho administrativo autorizado e auditado para correções e reutiliza o processamento financeiro existente, com limites de consultas, idempotência e confirmação por webhook. O aplicativo mantém sua interface e a restrição de alteração da CNH pelo motorista.

O escopo do repositório é backend: `supabase/config.toml`, migrations, Edge Functions e testes. Não há mudança em telas móveis, dependências do aplicativo ou necessidade de APK, publicação iOS ou atualização OTA.

## Migrations

As migrations são incrementais, já aplicadas no staging e devem ser preservadas na ordem abaixo.

| Migration | Alteração |
| --- | --- |
| `20261028120000_admin_driver_editing.sql` | Cria a edição administrativa autorizada, campos permitidos, revisão da ficha, auditoria de responsável/motivo/antes/depois e bucket privado de CNH. Preserva a proteção do documento aprovado fora desse fluxo. |
| `20261028130000_admin_driver_correction_integrity.sql` | Torna a substituição do arquivo e dos dados da CNH atômica; prepara a troca auditada de login; estende a anonimização aos novos dados; agrega as contagens do dashboard. |
| `20261028140000_private_cnh_reference_guards.sql` | Impede referências forjadas e o vínculo da CNH de um motorista a um documento privado de outro. |
| `20261028150000_defer_driver_auth_email_audit.sql` | Adia a validação/auditoria da troca de login até o fim da transação do Auth, compatível com suas gravações separadas de e-mail e metadados. Em falha, desfaz a transação. |
| `20261028160000_driver_edit_conflict_http_status.sql` | Usa `PT409` para conflitos de revisão, retornando HTTP 409 sem repetição de transação por código reservado. |
| `20261028170000_preserve_untouched_driver_profile_fields.sql` | Preserva campos legados que não foram editados, evitando apagar telefone ou normalizar outros valores durante uma correção independente. |
| `20261029120000_admin_driver_canonical_email.sql` | Mantém o e-mail do perfil igual ao login corrigido pelo painel, inclusive em cadastro legado divergente. Não faz atualização em lote de usuários. |
| `20261029130000_bounded_cancellation_reconciliation.sql` | Acrescenta controle de consultas por cobrança e ambiente, reservas, pausa por falhas, deduplicação de webhook, classificação operacional e solicitação administrativa limitada. O processamento novo nasce desativado. |
| `20261029140000_prioritize_paid_cancellation_refunds.sql` | Prioriza reembolsos de pagamentos conhecidos, remove a espera inicial aplicada às cobranças incertas e impede que casos concluídos sejam suspensos/reabertos por envelhecimento dos controles. Separa a apresentação de cobrança incerta e reembolso. |

## Edge Functions

| Função | Alteração |
| --- | --- |
| `admin-corrigir-email-motorista` | Nova função: valida JWT, administrador e conta ativa; prepara a solicitação com revisão/motivo; corrige o login pela API administrativa do Auth; verifica a conclusão auditada. |
| `excluir-conta` | Remove também arquivos do bucket privado de CNH e suas versões históricas, seguindo a rotina existente de limpeza. Registra falhas de Storage. |
| `processar-reembolsos-automaticos` | Reutiliza o worker e as tarefas de reembolso, executando o processamento limitado conforme o tipo de pendência e preservando a chave de idempotência original. |
| `mercadopago-webhook` | Mantém a validação de autenticidade, deduplica envelopes autenticados e trata confirmações tardias de pagamentos/devoluções sem reiniciar o orçamento nem desfazer estados concluídos. |

O helper compartilhado `supabase/functions/_shared/boundedCancellation.ts` implementa a investigação de cobranças, o adaptador HTTP limitado, a execução dos lotes e a validação de notificações de cancelamentos. É publicado junto das funções que o importam; não é uma quinta função para deploy.

`supabase/config.toml` registra a nova função administrativa com verificação de JWT dentro do handler. Credenciais privilegiadas continuam restritas ao servidor. Não foi criado serviço Azure.

## Integridade, auditoria e privacidade

- RPCs revalidam o administrador e aceitam somente campos permitidos; não abrem atualização geral das tabelas para o painel.
- A revisão da ficha impede que um operador sobrescreva uma correção feita enquanto seu formulário estava aberto.
- Arquivo e metadados da CNH são gravados juntos. Novos uploads são privados, usam nomes únicos e preservam versões anteriores.
- A correção de login tem uma solicitação interna de dois minutos, vinculada ao operador, motivo e revisão. Ao concluir a transação do Auth, o banco valida, sincroniza o e-mail do perfil e audita a mudança.
- O ID e a senha da conta permanecem; contas exclusivamente sociais não são convertidas para login por e-mail. A operação atesta a conferência do novo endereço; não há envio de confirmação neste fluxo.
- A exclusão estende a anonimização à auditoria, referências de CNH e solicitações de login, mantendo as restrições financeiras e de corridas ativas anteriores.
- Bucket legado permanece compatível: esta entrega não converte retroativamente seus arquivos públicos em privados.

## Regra financeira e consumo

Pagamento confirmado cancelado pelo sistema por falta de aceite no T−15 segue **reembolso integral automático**, elegível na próxima execução do worker existente. A checagem do provedor evita duplicidade e confirma a devolução. Um reembolso concluído sai do trabalho pendente.

Cobranças com resultado desconhecido usam até seis rodadas automáticas, até dois GETs por rodada e teto de 12 consultas automáticas de investigação. Os intervalos crescem aproximadamente de cinco minutos a 24 horas; não há consultas antes do vencimento da próxima tentativa. A reserva sem chamada HTTP não debita uma rodada.

O controle compartilhado limita a 20 requisições por minuto e três requisições simultâneas por ambiente nesse processamento. Cinco falhas transitórias consecutivas pausam o ambiente por 15 minutos, respeitando um `Retry-After` maior. Divergências permanentes ou orçamento esgotado suspendem a consulta automática e pedem verificação.

Uma verificação administrativa adicional exige motivo, intervalo mínimo de 30 minutos e limite de três solicitações por cobrança em 24 horas. Não zera os contadores nem cria outra chave de reembolso. Uma evidência nova e conclusiva pode liberar uma continuação específica para o reembolso, contada separadamente, sem reiniciar seis rodadas.

Webhooks autenticados continuam aceitando confirmação tardia após a suspensão. Os limites do polling não representam um teto para toda notificação externa. Envelopes concluídos duplicados dispensam nova consulta; notificações fora de ordem não reabrem ciclos nem desfazem reembolsos confirmados.

**Nenhum cron foi criado ou teve a frequência alterada.** Permanecem os existentes:

| Agendamento | Frequência |
| --- | --- |
| `cancelar-corridas-expiradas` | A cada minuto |
| `chofair-reembolsos-automaticos` | A cada minuto |
| `chofair-reconciliar-pagamentos-pendentes` | A cada cinco minutos |

O worker reaproveitado faz operações adicionais de reserva/limitação; quando não há trabalho elegível, retorna sem consultar o provedor. A seleção SQL da conciliação antiga evita disputar os mesmos cancelamentos. As tabelas auxiliares guardam controles, reservas HTTP e recibos de notificações, sem criar uma segunda fila financeira.

Os dados de teste com `PAID` definido manualmente não correspondem necessariamente a pagamentos no Mercado Pago. Não foram regularizados por suposição nem receberam registros fictícios de devolução. Cancelamentos sem início registrado continuam sujeitos à decisão humana sobre serviço, reembolso e repasse.

## Validação

- `supabase/tests/admin_driver_editing_test.sql`: autorização, campos proibidos, atomicidade da CNH, referências privadas, revisão, auditoria, integração com Auth e exclusão, com rollback.
- `supabase/tests/bounded_cancellation_reconciliation_test.sql`: orçamento, reservas, limites, prioridade do reembolso, ausência de espera inicial em `PAID`, isolamento, verificação manual, webhook e manutenção do estado resolvido, com rollback.
- 133 testes financeiros aprovados em `boundedCancellation`, `automaticRefund`, `cancelledCharge` e `mercadopagoWebhook`, usando respostas simuladas.
- Tipos das Edge Functions, tipos do aplicativo e verificação de codificação aprovados durante a entrega; tipos das funções e codificação conferidos novamente antes dos commits.
- Testes negativos publicados no staging recusaram chamadas sem autorização/assinatura com HTTP 401.
- Testes integrados do painel validaram documentos privados, histórico, login e exclusão com fixtures temporárias removidas ao final.

## Situação do staging em 29/10/2026

Projeto conferido: `nwyjzyfuxxhqczdtkjnd`.

- As nove migrations desta PR estão aplicadas. O dry-run isolado da entrega não apontou pendências.
- As quatro funções estão ativas. O código publicado, incluindo os helpers locais importados, foi baixado para diretórios temporários e comparado com o checkout: todos os arquivos comparados são iguais, desconsiderando apenas BOM, finais de linha e espaços nas extremidades do arquivo.
- Versões conferidas: `admin-corrigir-email-motorista` v3; `excluir-conta`, `processar-reembolsos-automaticos` e `mercadopago-webhook` v5.
- Apenas `sandbox` está habilitado no novo controle financeiro; `production` permanece desabilitado.
- Não falta aplicar migration ou publicar Edge Function **desta entrega** no staging. Nenhum novo deploy foi necessário nessa conferência.

Existe uma divergência anterior no histórico geral: `20261023190000` está aplicada remotamente e ausente no checkout, enquanto `20261025120000_split_customer_city_availability_by_vertical.sql` é uma pendência não relacionada. A entrega usou um diretório CLI isolado; não executou essa migration de cidades, não marcou versões artificialmente e não alterou o vínculo original do projeto.

## Publicação após aprovação com o PO

1. Reconciliar o histórico anterior com a equipe e revisar o dry-run do projeto alvo. A pendência de cidades exige decisão própria; não deve entrar inadvertidamente nesta publicação.
2. Conferir explicitamente o alvo e aplicar as nove migrations na ordem, mantendo o novo controle financeiro desativado durante a preparação.
3. Publicar somente as quatro funções desta entrega, com os helpers e a configuração correspondentes.
4. Conferir autenticação, permissões, leitura da ficha, armazenamento privado e contrato do painel com o backend atualizado.
5. Ativar separadamente o ambiente financeiro aprovado, após validar as funções e os limites. Não copiar a ativação `sandbox` do staging para produção por suposição.
6. Publicar o admin-web após disponibilizar o contrato do backend e acompanhar os resultados iniciais.

Esta PR e seus commits não fazem push, deploy em produção ou atualização das lojas. Produção permanece intocada, aguardando a aprovação da homologação.

Guias complementares: [operação do painel](admin-driver-corrections.md), [publicação do backend](chofair-app-publication.md) e [conciliação](cancellation-reconciliation-plan.md).
