# Backend do painel no repositório ChofairApp

Esta entrega altera o **painel administrativo e seu backend**. O complemento móvel foi removido a pedido: a tela `motorista.tsx`, `lib/supabase.js`, `types/database.ts` e `package.json` voltaram ao código anterior. O leitor de CNH e seu teste também foram removidos. Não há mudança de interface do aplicativo para publicar nem necessidade de gerar uma nova versão Android/iOS por esta entrega.

O fluxo continua sendo: o motorista encaminha a CNH atualizada à operação; um administrador confere os documentos e faz a correção no painel. A restrição existente sobre a CNH aprovada permanece no aplicativo e no banco.

## O que ficou no ChofairApp

| Arquivo | Finalidade |
| --- | --- |
| `supabase/migrations/20261028120000_admin_driver_editing.sql` | Base de edição administrativa: validação, permissão, histórico com responsável/motivo/antes/depois e armazenamento privado da CNH. A exceção administrativa preserva a proteção para o motorista. |
| `supabase/migrations/20261028130000_admin_driver_correction_integrity.sql` | Salva arquivo e dados da CNH juntos; prepara a correção auditada do e-mail; estende a anonimização da conta aos dados novos; agrupa as contagens do dashboard. |
| `supabase/migrations/20261028140000_private_cnh_reference_guards.sql` | Impede apontar a CNH de um motorista para um documento privado de outro e impede referências privadas forjadas pelo cliente. |
| `supabase/migrations/20261028150000_defer_driver_auth_email_audit.sql` | Valida e audita a troca de login ao terminar a transação do Auth, que grava e-mail e metadados em etapas. Uma falha nessa validação desfaz a transação. |
| `supabase/migrations/20261028160000_driver_edit_conflict_http_status.sql` | Conflitos de revisão retornam HTTP 409, sem repetir indefinidamente a operação como se fosse uma falha transitória de banco. |
| `supabase/migrations/20261028170000_preserve_untouched_driver_profile_fields.sql` | Evita que corrigir um campo apague um telefone legado ou normalize nome/UF que não foram editados. |
| `supabase/migrations/20261029120000_admin_driver_canonical_email.sql` | Mantém o e-mail do perfil igual ao login corrigido pelo painel, inclusive se o cadastro legado tinha outro endereço. Não altera cadastros em lote nem o fluxo móvel. |
| `supabase/functions/admin-corrigir-email-motorista/index.ts` | Nova Edge Function que altera o login pela API administrativa do Auth, depois de verificar a sessão e a permissão administrativa. |
| `supabase/functions/excluir-conta/index.ts` | Estende a função existente para remover também os arquivos do bucket privado de CNH, incluindo versões anteriores. |
| `supabase/config.toml` | Registra a nova função, que verifica o JWT internamente. |
| `supabase/tests/admin_driver_editing_test.sql` | Testes de autorização, validação, concorrência, arquivos, auditoria, login e exclusão, com rollback. |

Os arquivos posteriores à migração inicial são ajustes incrementais da mesma implementação, identificados nos testes. Como já foram aplicados ao staging, foram mantidos em ordem para preservar o histórico de implantação.

## Correção do login: por que existe uma função específica?

O e-mail usado para autenticar está no Supabase Auth. Mudar somente `profiles.email` não corrige a credencial de entrada nem o endereço usado na recuperação de senha. A função usa a [API administrativa oficial do Auth](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid), com a credencial privilegiada restrita ao servidor.

O fluxo implementado é:

1. O painel envia o ID do motorista, o novo e-mail, a revisão da ficha e o motivo, com a sessão do administrador.
2. O backend verifica se o operador é administrador, se a conta está ativa, se o e-mail não está ocupado e se a ficha permanece na revisão conferida.
3. Uma solicitação interna registra o responsável e a troca autorizada, com validade de dois minutos. Outra correção de login simultânea é recusada.
4. A Edge Function solicita a troca ao Auth. A senha e o ID da conta são preservados; contas exclusivamente Google/Apple continuam gerenciadas pelo provedor.
5. Ao concluir a transação do Auth, o banco valida a solicitação, registra antes/depois e conclui a auditoria. A solicitação fica concluída; em falha, o backend a cancela. Se a ficha mudou nesse intervalo, a gravação é recusada e o operador deve recarregar.

A confirmação da interface é uma declaração do operador de que conferiu identidade e titularidade do novo endereço. Não foi criado um processo de assinatura ou um envio de link de confirmação ao motorista. Ao corrigir o login pelo painel, o e-mail do perfil passa a ser o mesmo endereço, inclusive quando o cadastro legado tinha outro valor. O histórico apresenta uma única alteração de e-mail de acesso; a auditoria completa permanece no banco. Não há atualização em lote dos cadastros anteriores nem mudança do fluxo móvel.

Essa parte é necessária **para oferecer correção do e-mail de acesso pelo painel**. Ela não é um requisito para apenas substituir CNH. Está incluída porque a correção de e-mail foi mantida no escopo. A migração da auditoria adiada também pertence a esse fluxo de login.

As funções usadas aqui são [Edge Functions do Supabase](https://supabase.com/docs/guides/functions), executadas no backend já utilizado pelo projeto. Não foi criado um serviço Azure.

## Controle de concorrência: exemplo

Dois operadores abrem a mesma ficha. O primeiro salva uma alteração; o segundo tenta salvar a aba antiga. O backend compara a revisão enviada com os dados atuais e devolve um conflito para o segundo operador recarregar e conferir a ficha. Isso também protege o vínculo entre dados da CNH e arquivo durante a substituição.

O controle funciona no momento de salvar. Não cria serviço de sincronização, fila de tarefas, notificações ou atualização em tempo real. O código reservado `40001` da primeira implementação foi substituído por `PT409` para o PostgREST devolver HTTP 409 imediatamente.

## Por que atualizar a exclusão de conta?

Antes, a exclusão já limpava os documentos antigos e anonimizava o cadastro. Os novos uploads administrativos passaram a ocupar outro bucket privado e geraram histórico com dados pessoais anteriores.

Por isso, a rotina SQL de anonimização também limpa as referências novas, o histórico de correções e as solicitações de correção de e-mail. A Edge Function existente tenta remover os arquivos privados e suas versões anteriores; falhas de Storage são registradas, seguindo o comportamento de limpeza já existente. Apagar apenas a referência no banco não remove o arquivo armazenado.

Essa atualização atende aos dados introduzidos pela edição no painel. Não adiciona nenhuma ação móvel e não altera as regras existentes que impedem excluir uma conta com corrida ativa, nem o tratamento financeiro anterior.

## Publicação

As sete migrations e as duas Edge Functions já foram aplicadas/publicadas **somente no staging**. Produção não foi alterada nesta entrega.

Quando a promoção for aprovada, conferir o projeto alvo e o dry-run, reconciliar a divergência anterior de histórico descrita no [guia do painel](admin-driver-corrections.md), aplicar as migrations em ordem, publicar as duas Edge Functions e publicar o admin-web. Subir os arquivos ao Git, isoladamente, não executa essas etapas.

Nenhum build ou publicação nas lojas é exigido: no repositório ChofairApp, a implementação está em `supabase/`, com testes adicionais em `tests/`. A unificação do e-mail acrescentou a sétima migration; não exigiu novo deploy de função.

## Complemento: conciliação de cancelamentos

A migration `20261029130000_bounded_cancellation_reconciliation.sql` acrescenta o acompanhamento limitado nas cobranças existentes, controles compartilhados de chamadas e reservas, deduplicação de notificações e uma solicitação administrativa de verificação com limite. Não altera telas ou serviços do aplicativo móvel.

As funções `processar-reembolsos-automaticos` e `mercadopago-webhook` foram atualizadas somente no staging. O primeiro reutiliza a tarefa de reembolso e a chave de idempotência existentes; o segundo valida e deduplica o envelope autenticado, aceitando confirmação tardia sem reiniciar os contadores. A função de conciliação de pagamentos ainda pendentes não recebeu nova interface; sua seleção SQL exclui os cancelamentos assumidos pelo processamento compartilhado.

Nesse complemento, subir as migrations `20261029130000_bounded_cancellation_reconciliation.sql` e `20261029140000_prioritize_paid_cancellation_refunds.sql`, os arquivos financeiros modificados em `supabase/functions/`, o teste SQL `supabase/tests/bounded_cancellation_reconciliation_test.sql` e o teste `tests/boundedCancellation.spec.ts`. Somando os escopos documentados, há nove migrations novas e quatro funções novas/atualizadas. Nenhum APK, build iOS ou atualização OTA é necessário por estas mudanças.

A segunda migration financeira remove a espera inicial para reembolsos de pagamentos já conhecidos, prioriza essas tarefas e mantém os casos concluídos fora da expiração do acompanhamento. Não cria nem altera agendamentos e não exige republicar as Edge Functions já atualizadas. A alteração foi aplicada somente no staging.

O processamento novo fica desativado por padrão na migration. Depois de publicar e testar as duas funções no projeto correto, ativar apenas o ambiente aprovado no controle do banco. Nesta entrega foi ativado apenas `sandbox` no staging; `production` permaneceu desativado e o projeto de produção não foi modificado. Conferir a divergência de histórico descrita acima antes de qualquer promoção geral. Detalhes e parâmetros estão no [guia de conciliação](cancellation-reconciliation-plan.md).
