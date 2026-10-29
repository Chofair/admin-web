# Conciliação limitada após cancelamento

Status: implementado e ativado no staging `nwyjzyfuxxhqczdtkjnd` para pagamentos sandbox e promovido com autorização à produção `jzxnzrtefgqhbopbcdxy` em 29/10/2026, apenas para pagamentos production. A mudança está no backend do ChofairApp e no painel; não requer versão nova Android/iOS. A comparação dos ambientes e as validações estão no [registro de produção](production-promotion-2026-10-29.md).

## Objetivo e regra

Corrigir as tentativas de cartão com resultado desconhecido que deixam de ser conciliadas após o cancelamento, evitando consultas indefinidas ao Mercado Pago. Reutilizar a fila, o worker, o webhook e a auditoria existentes. O diagnóstico está em [cancellation-staging-diagnosis.md](cancellation-staging-diagnosis.md).

- Ausência de cobrança confirmada, sem outra cobrança ou decisão operacional pendente: resolver automaticamente.
- Pagamento confirmado: seguir a decisão de reembolso existente e aguardar confirmação da devolução.
- Resultado ainda desconhecido: verificar dentro de um orçamento finito; ao esgotar, suspender consultas automáticas e sinalizar verificação necessária.
- Esgotar tentativas, receber timeout, HTTP 404 isolado ou uma busca sem resultados não prova que não houve cobrança. Não registrar devolução ou resolução financeira por essas razões.

**Pagamento `PAID` cancelado sem aceite no T−15 tem reembolso integral automático.** Ele entra como tarefa de reembolso na próxima execução do worker já existente, sem a espera inicial de cinco minutos das cobranças incertas. O executor consulta o provedor para evitar devolução duplicada e confirmar o resultado; confirmado o reembolso, o caso sai do trabalho pendente e não volta a ser consultado por envelhecimento dos controles.

Não foi criado cron para acompanhar o painel. A implantação inicial reutilizou os agendamentos existentes e preservou suas frequências. Posteriormente, a migration `20261029150000_deduplicate_payment_reconciliation_schedule.sql` passou a conciliação de pagamentos pendentes para dez minutos e removeu o cron redundante de seis horas em produção; esse ajuste já está aplicado nos dois ambientes.

A migration seguinte, `20261029160000_schedule_automatic_refunds_every_five_minutes.sql`, prepara o processamento de reembolsos a cada cinco minutos. Ela foi testada com rollback e permanece pendente de publicação; até sua aplicação, o cron de reembolsos continua a cada minuto. O cancelamento de corridas expiradas mantém seu agendamento separado a cada minuto.

O executor de cancelamentos e reembolsos seleciona até três tarefas elegíveis por execução. O intervalo do cron define quando procura trabalho; cada tarefa também respeita seu próximo horário, suas reservas e seu orçamento. A passagem de um para cinco minutos reduz os disparos previstos de 1.440 para 288 por dia, sem representar uma redução proporcional garantida do consumo total do banco ou do provedor. Em fila maior, a capacidade por rodada pode aumentar a espera e deve ser acompanhada.

Os novos controles acrescentam operações de reserva/limitação por tentativa. Quando não há trabalho elegível, o executor retorna após a verificação de pendências, sem percorrer a manutenção das reservas nem consultar o provedor. A prioridade atende reembolsos de pagamentos confirmados antes da investigação de cobranças incertas, sem restringi-la ao motivo T−15. As regras de aprovação, suspensão, confirmação pelo provedor e idempotência permanecem as mesmas.

## 1. Uma política compartilhada de consultas

Adicionar à cobrança/tarefa os dados de controle necessários: próxima consulta, início da janela, rodadas, chamadas HTTP realizadas, último resultado normalizado e motivo de suspensão. Reaproveitar contadores existentes quando mantiverem o mesmo significado; hoje há contadores diferentes entre pagamento e tentativa, portanto não somá-los como se fossem a mesma coisa sem revisar as funções.

O orçamento pertence à cobrança e à sua investigação, não à execução do cron. Reservar atomicamente a cobrança com prazo de reserva e impedir que os workers de conciliação e cancelamento consultem o mesmo caso simultaneamente. Relacionar tarefas já existentes sem criar uma segunda fila.

Agenda de referência para resultado desconhecido ou novas tentativas após resposta inconclusiva. O primeiro processamento de um reembolso já autorizado não aguarda cinco minutos:

| Rodada | Momento aproximado |
| --- | --- |
| 1 | 5 minutos |
| 2 | 15 minutos |
| 3 | 1 hora |
| 4 | 3 horas |
| 5 | 12 horas |
| 6 | 24 horas |

Esses valores são parâmetros internos, não uma exigência ou prazo de liquidação do Mercado Pago. A janela tem tolerância de cinco minutos para o cron e a pequena variação dos horários. Encerrar a janela também suspende as consultas, mesmo antes do limite numérico. O cron continua com a frequência atual, selecionando apenas tarefas vencidas; tarefa não vencida não gera chamada ao provedor. Depois de indisponibilidade prolongada, não são executadas todas as rodadas vencidas de uma vez.

Limite inicial: seis rodadas automáticas por investigação e até duas consultas HTTP por rodada, com teto de 12 consultas automáticas de conciliação por cobrança. Com ID conhecido, consultar diretamente o pagamento. Sem ID, pesquisar pela referência e, somente se houver correspondência segura, consultar os detalhes necessários. Interromper assim que houver resultado suficiente. Registrar e descontar cada requisição, inclusive timeout/erro HTTP, sem tentativas ocultas no cliente HTTP. Não tratar a falha de uma execução SQL sem HTTP enviado como uma chamada ao provedor.

O limite de consultas não constitui autorização para novas cobranças, cancelamentos ou reembolsos. Operações financeiras de escrita continuam com elegibilidade, reserva e chave de idempotência próprias. Uma consulta incerta nunca deve gerar uma chave nova de reembolso para repetir uma operação cujo resultado se desconhece.

## 2. Proteção contra indisponibilidade geral

Além do limite por cobrança, a proposta inicial é um teto compartilhado de 20 consultas por minuto e concorrência máxima de três consultas por ambiente para esses workers. São limites internos propostos, não cotas oficiais do Mercado Pago; conferir o volume e a capacidade efetiva no staging. Após cinco falhas consecutivas de HTTP 429, 5xx ou timeout, pausar o lote daquele ambiente por 15 minutos e testar a retomada com uma única tarefa elegível, descontando essa chamada de seu orçamento. Respeitar um `Retry-After` maior quando fornecido. Essa pausa precisa ser compartilhada entre execuções; várias instâncias não podem iniciar uma consulta de prova cada uma.

Suspender automaticamente consultas por falhas permanentes de configuração/autorização ou divergência de identidade, ambiente ou valor; elas exigem verificação e não devem consumir seis rodadas idênticas. Nenhuma falha externa deve ser convertida em “sem cobrança”.

## 3. Encerramento e apresentação no painel

| Resultado | Comportamento |
| --- | --- |
| Cobrança não chegou a ser enviada e isso é demonstrável pelo estado da operação | Encerrar sem devolução, se não houver outra pendência. |
| Provedor confirma cancelamento/rejeição sem cobrança, com identidade e ambiente válidos | Concluir a conciliação e deixar o classificador encerrar o caso, se não houver outra pendência. |
| Provedor confirma pagamento | Vincular a evidência e encaminhar ao fluxo de reembolso já aprovado. |
| Provedor confirma devolução | Atualizar pagamento/tarefa e encerrar quando as demais pendências estiverem concluídas. |
| Resultado desconhecido dentro da janela | Exibir “Conciliação pendente”, próxima verificação e progresso das tentativas. |
| Limite atingido ou divergência permanente | Exibir “Precisa de verificação”, motivo e última consulta; parar consultas automáticas desse caso. |

O estado de verificação continua como pendência financeira, mas não aparece como processamento ativo interminável. A operação pode registrar uma conclusão baseada em evidência ou solicitar uma rodada adicional auditada. Proposta inicial: no máximo uma rodada manual por cobrança a cada 30 minutos e três em 24 horas, cada uma com até duas consultas HTTP e motivo obrigatório. Não zerar o histórico nem reabrir automaticamente o ciclo de seis rodadas. Validar esses limites com o time no staging; todas as chamadas manuais entram nas métricas e no limite global.

## 4. Webhooks continuam aceitando confirmações tardias

A suspensão do polling não desativa o webhook. Reaproveitar a validação de assinatura e a consulta do recurso existentes, com controle de duplicidade e validação de ID, valor, moeda e ambiente. Uma confirmação válida tardia pode concluir a conciliação ou encaminhar um pagamento confirmado ao reembolso aprovado, mesmo depois do limite de consultas.

Eventos duplicados ou fora de ordem não devem reabrir ciclos, desfazer estados confirmados ou duplicar devoluções. O orçamento descrito acima limita o polling; notificações válidas são eventos externos e precisam de deduplicação e controle de volume próprios. Não prometer um teto total de chamadas incluindo qualquer quantidade de eventos externos ou consultas manuais.

O Mercado Pago documenta [webhooks com validação de autenticidade](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks). A proposta mantém esse mecanismo e usa a conciliação agendada como recuperação limitada.

## 5. Registros de teste e implantação

Os dados antigos de teste devem ser tratados separadamente: gerar um relatório dos casos, conferir a evidência de cada grupo e só então executar eventual regularização auditada em sandbox/staging. Não preencher o ambiente de pagamentos legados por suposição, apagar a trilha ou marcar reembolso fictício. Essa regularização não deve fazer parte da migration de estrutura nem disparar o worker financeiro durante a implantação.

Implementar com migrations incrementais no ChofairApp, funções e apresentação do painel compatíveis entre si, com possibilidade de manter o processamento novo desabilitado até os testes. Conferir o dry-run e aplicar exclusivamente no staging. Preservar o histórico de migrations anterior e as regras de análise humana para corridas sem início registrado.

## 6. Validação antes de produção

- Testes com provedor simulado: desconhecido persistente, resposta vazia, timeout, 429, 5xx, falha permanente e correspondência ambígua; conferir número exato de chamadas e suspensão no teto.
- Testes de banco: seleção de tentativas após cancelamento, orçamento compartilhado entre workers, reserva concorrente, reserva expirada e ausência de chamadas antes do próximo horário.
- Testes de negócio: ausência de cobrança confirmada resolve; pagamento tardio segue o reembolso aprovado; devolução só resolve após confirmação; pendência operacional independente permanece.
- Webhook válido após suspensão, assinatura inválida, duplicidade e chegada fora de ordem; nenhuma nova chave ou devolução duplicada.
- Operação manual com motivo, intervalo, limite e auditoria; nenhum reset silencioso do orçamento.
- Medir no staging chamadas por cobrança, tarefas suspensas, idade das pendências e conclusões. Validar com o time antes da promoção para produção.

## Publicação e detalhes implementados

- Migration `ChofairApp/supabase/migrations/20261029130000_bounded_cancellation_reconciliation.sql`, aplicada ao staging e à produção. Os controles ficam desativados por padrão; a ativação foi feita separadamente para sandbox no staging e para production em produção. O outro ambiente permanece desativado em cada projeto.
- Correção incremental `20261029140000_prioritize_paid_cancellation_refunds.sql`, aplicada nos dois projetos: reembolsos de pagamentos conhecidos são elegíveis imediatamente e têm prioridade sobre consultas incertas. Casos concluídos não entram na rotina de expiração dos controles. A tela apresenta tarefas normais de devolução como reembolso, sem cartão adicional de cobrança incerta.
- Funções atualizadas nos dois projetos: `processar-reembolsos-automaticos` e `mercadopago-webhook`. A conciliação e a tarefa de reembolso existente compartilham a reserva e o orçamento da cobrança. A seleção antiga de tentativas não disputa esses cancelamentos com o novo processamento.
- O acompanhamento fica nas próprias cobranças, nas colunas `cc_*`. As tabelas auxiliares guardam limites por ambiente, reservas HTTP e recibos de notificações; não criam outra fila financeira. RLS, privilégios e trigger impedem clientes de alterar contadores ou forjar resultados.
- Uma rodada só é debitada quando a primeira requisição vai ser enviada. Uma recusa do limitador antes do HTTP não consome consultas; uma autorização adicional sem nenhuma requisição enviada é preservada após falha do worker.
- Cada rodada autoriza até dois GETs e uma escrita financeira já elegível. O reembolso mantém a chave de idempotência original. Os contadores da cobrança e da tarefa não são zerados por uma solicitação administrativa nesse fluxo.
- Uma evidência nova e conclusiva de pagamento permite uma única continuação para processar a devolução, inclusive na última rodada. A mesma regra permite verificar uma devolução confirmada tardiamente. Essas consultas adicionais são contadas separadamente, sem reabrir seis rodadas. Repetir a mesma notificação não concede outro ciclo.
- A deduplicação usa o hash do envelope autenticado: ID do recurso, request ID e assinatura. O mesmo envelope concluído dispensa nova consulta; uma entrega ainda em processamento recebe resposta para nova tentativa. Não se promete eliminar consultas de envelopes diferentes emitidos pelo provedor. Recibos têm retenção de sete dias; a trilha financeira permanece nos eventos existentes.
- O painel mostra rodadas, consultas, próxima verificação, suspensão e status externo observado. Pagamentos legados sem ambiente exigem conferência; o ambiente não foi inferido e os testes antigos não foram marcados artificialmente como reembolsados.

Os testes com respostas simuladas e SQL com rollback cobriram limites, reservas, janela, pausa por falhas gerais, notificações tardias/repetidas e permissões. As 28 asserções anteriores de classificação também passaram antes da ativação, com o controle desativado. Testes negativos contra as funções publicadas e RPCs do staging receberam HTTP 401. Não foram feitas chamadas financeiras a produção nem disparado manualmente o worker para testes.

O resultado é um teto verificável de consultas automáticas e uma fila que diferencia espera ativa de investigação suspensa, sem tratar incerteza como ausência de cobrança.
