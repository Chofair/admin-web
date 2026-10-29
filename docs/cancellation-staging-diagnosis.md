# Diagnóstico de cancelamentos e revisões — staging

O diagnóstico abaixo registra a situação anterior à correção. A conciliação limitada foi posteriormente implementada e ativada apenas no staging, conforme o [guia de implementação](cancellation-reconciliation-plan.md).

Consulta em 29/10/2026 no projeto `nwyjzyfuxxhqczdtkjnd`. Foram consultados registros, definições SQL e metadados do agendador. Nenhum reembolso, reprocessamento ou decisão financeira foi executado. Não houve consulta ao provedor com suas credenciais; o status externo exato do pagamento em falha ainda precisa ser conferido.

O responsável confirmou posteriormente que todos os pagamentos observados são testes. Isso contextualiza os registros antigos, mas a falha de seleção descrita abaixo também afeta novas tentativas que cheguem ao mesmo estado. O comportamento esperado é encerrar automaticamente o caso com ausência de cobrança confirmada, conciliar resultados desconhecidos sem exigir decisão manual apenas por estarem pendentes e acompanhar a devolução quando houver pagamento confirmado. Cancelamento local e resultado desconhecido não estabelecem, isoladamente, ausência de cobrança.

**Esclarecimento posterior do responsável, em 29/10/2026:** os registros com divergência de pagamento foram marcados como pagos manualmente no banco após problemas no teste de pagamento. O estado local `PAID` desses exemplos não corresponde a uma cobrança confirmada pelo provedor. Isso explica os casos observados sem retorno de pagamento; não é evidência de falha na devolução de um pagamento real. Nenhum desses registros foi regularizado automaticamente nesta entrega e não foi registrado reembolso fictício. A investigação limitada permanece para situações reais de resultado incerto; pagamentos efetivamente confirmados seguem o reembolso automático aprovado.

## Situação observada

Entre os 39 cancelamentos com decisão automática, 29 estavam resolvidos, nove em processamento e um precisava de atenção. Decisão automática também inclui alguns cancelamentos solicitados pelo cliente; os números não correspondem exclusivamente à regra T-15. “Resolvido” inclui casos sem cobrança, além de devoluções confirmadas.

Os nove em processamento se dividem em:

| Quantidade | Evidência | Tratamento recomendado |
| --- | --- | --- |
| 4 | Pagamento `PAID`, ambiente Mercado Pago nulo e nenhuma tarefa de reembolso. Todos com motivo T-15. | Conferir origem e referência de cada pagamento. O enfileirador exige ambiente identificado; não preencher `sandbox`/`production` por suposição nem presumir que já houve devolução. |
| 5 | Pagamento `CANCELLED`, tentativa de cartão `UNKNOWN`, sem ID do pagamento no provedor. Três T-15 e dois cancelamentos pelo cliente. | Recuperar a conciliação da tentativa incerta antes de concluir se houve cobrança. A falta de ID local não prova que o provedor deixou de cobrar. |

A função `v2_resumo_fila_cancelamento` já fecha os casos sem pendência financeira e sem decisão operacional pendente. Nos exemplos com devolução confirmada (`REFUNDED` e tarefa `reembolsado/confirmed`), o cancelamento estava resolvido. Não se confirmou a hipótese de que todos os casos pendentes já teriam sido reembolsados.

## Lacuna confirmada na conciliação

As definições efetivamente instaladas no staging mostram que:

1. `v2_autorizar_reembolso` muda cobranças `PENDING` para `CANCELLED`, preservando referências para conciliação tardia.
2. `reservar_tentativas_cartao_conciliacao`, na assinatura com ambiente usada pela Edge Function, seleciona tentativas `PROCESSING/UNKNOWN` somente quando o pagamento continua `PENDING`.
3. `v2_reservar_cobrancas_canceladas` exige um ID numérico do pagamento no provedor. As cinco cobranças incertas não têm esse ID.
4. O classificador mantém o cancelamento em processamento enquanto a tentativa está incerta.

Portanto, essas cinco tentativas ficam fora das duas seleções existentes. O ajuste futuro deve conciliar também tentativas incertas de cobranças canceladas, com verificação de ambiente, identidade, valor e resultado no provedor. Se houver pagamento, seguir o reembolso aprovado; se a ausência de cobrança for confirmada, concluir a tentativa/conciliação e permitir o encerramento do caso. Não basta remover `UNKNOWN` do classificador ou encerrar por tempo decorrido.

O agendador de conciliação está ativo a cada cinco minutos; cancelamentos e reembolsos têm agendamento a cada minuto. O sucesso SQL do cron confirma o disparo agendado, não o sucesso HTTP da Edge Function nem a devolução bancária.

## Caso que precisa de atenção

Corrida `775c7092-fa5d-475f-8d4f-2e9d3335b83c`, com motivo T-15 e pagamento em ambiente sandbox. A tarefa de reembolso registrou `payment_status_review` após duas solicitações recentes de reprocessamento, sem referência de devolução confirmada.

No worker `processAutomaticRefund`, esse código é produzido após consultar e validar o pagamento, quando seu status não é `approved` nem `refunded`. É uma divergência entre o estado local (`PAID`) e a resposta consultada do provedor; não é o código de indisponibilidade HTTP ou timeout. O registro atual não guarda qual foi o status externo retornado, portanto não permite afirmar se foi cancelado, rejeitado, contestado ou outra situação. Antes de nova tentativa, conferir esse pagamento no Mercado Pago sandbox e reconciliar o banco com a evidência obtida. Recomenda-se registrar o status externo normalizado nos próximos diagnósticos, sem payloads ou dados pessoais desnecessários.

## Corrida sem início registrado

Os quatro casos de sistema com motivo “Sem inicio ate o fim agendado” ainda pendentes consultados estavam em `analise`, apresentado no painel como “Aguardando decisão”. A corrida ter sido cancelada pelo relógio não prova que o atendimento deixou de acontecer.

A operação deve conferir com as duas partes e registrar as evidências no motivo da decisão. Reembolso e repasse são independentes. Serviço não prestado, serviço confirmado sem registro no aplicativo e relato inconclusivo precisam de avaliações diferentes, conforme a política da empresa. Se ambos forem aprovados, o painel já informa que a Chofair assume o custo. Registrar transferência somente após sua efetiva realização. Não iniciar/finalizar a corrida retroativamente apenas para liberar pagamento ou limpar a fila.

## Revisões de corridas

No checkout atual do ChofairApp, `reportarProblemaCorrida` existe como helper sem chamadas pelas telas/componentes pesquisados. A RPC correspondente, instalada no staging, encaminha a solicitação ao fluxo de cancelamento. Não foi encontrada uma interface atual para abrir manualmente uma revisão de corrida.

A revisão ainda existe para exceções automáticas: o trigger ativo `trg_encaminhar_reembolso_pos_inicio` chama `fn_encaminhar_reembolso_pos_inicio` quando o pagamento inicial passa a reembolsado com a corrida em andamento/finalizada/concluída, respeitando a exceção do cancelamento já autorizado. Ele abre/reabre a revisão e marca a corrida para tratamento. A fila e o histórico devem continuar disponíveis. A tabela de revisões estava vazia nesta consulta; isso não significa que o mecanismo esteja desativado.

## Próximas melhorias propostas

- Corrigir a seleção e o tratamento das tentativas incertas após cancelamento, com testes de ausência de cobrança, confirmação tardia, webhook concorrente e isolamento de ambientes.
- Investigar os quatro pagamentos sem ambiente antes de qualquer regularização de dados.
- Melhorar a indicação operacional: diferenciar “Conciliação pendente”, “Reembolso em processamento” e “Precisa de verificação”, mantendo “Aguardando decisão” para a análise humana.
- Exibir diagnóstico compreensível para `payment_status_review` e registrar o status externo necessário à investigação.

Essas mudanças financeiras são propostas a partir da análise; não foram aplicadas nesta revisão visual/de e-mail. A documentação do [Mercado Pago sobre reembolsos](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/payment-management/cancellations-and-refunds/introduction?scope=prod) distingue a solicitação de devolução de seu resultado; o painel deve continuar dependendo de confirmação conciliada.
