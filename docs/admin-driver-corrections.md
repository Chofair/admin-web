# Correções de motoristas — CHO-584

## Operação no painel

Na ficha já existente em **Motoristas → motorista**, use **Editar dados do motorista** para corrigir nome, CPF, telefone, nascimento, endereço, Pix e treinamentos declarados. Somente os campos alterados são enviados. Motivo e confirmação são obrigatórios. E-mail de contato e URL da foto não fazem parte desse formulário; número, validade e categoria da CNH ficam exclusivamente no formulário **Substituir CNH**, junto do arquivo.

Os dois formulários têm validações separadas no painel, inclusive nas Server Actions, para impedir que dados exclusivos da CNH sejam enviados pela correção cadastral. A simplificação dos formulários e os acordeões do histórico não exigiram novas migrations.

Os cabeçalhos de edição cadastral, e-mail de acesso e substituição de CNH mantêm uma cor de destaque enquanto abertos, com resposta ao clique e foco visível por teclado nos temas claro e escuro.

Os botões de salvar cadastro e corrigir e-mail começam desabilitados e só habilitam quando o respectivo dado muda. Alterar apenas motivo/confirmação não habilita o envio. Voltar ao valor anterior, ou apenas mudar a formatação de CPF/telefone/CEP e maiúsculas de UF/e-mail, volta a bloquear o botão. Durante o envio, os controles também permanecem desabilitados.

**Substituir CNH** recebe PDF, JPG ou PNG de até 10 MB. Confira a prévia e informe número, categoria e validade do novo documento. Arquivo e dados são vinculados em uma única transação; uma falha mantém a versão anterior. Aprovação, suspensão e revisão dos veículos continuam nas ações próprias. A substituição não altera automaticamente o status do motorista.

O histórico apresenta as últimas 20 correções em acordeões fechados inicialmente, com responsável, horário e motivo visíveis no cabeçalho. Clique ou use Enter/Espaço para abrir os valores anteriores/novos de cada evento. Versões anteriores de CNH continuam arquivadas e podem ser abertas pelos links dentro do evento. O banco mantém também os eventos anteriores aos 20 apresentados, inclusive os rótulos de campos que deixaram de aparecer no formulário.

A ficha apresenta Correção do cadastro → Documentos → Veículos. O mesmo componente de acordeão é usado nos registros de acessibilidade, cancelamentos, processamento de reembolsos, decisões concluídas de revisão, auditoria do veículo, detalhes da linha do tempo e histórico de alertas. Ações operacionais pendentes continuam visíveis. Eventos sem informação adicional não recebem um controle vazio de expansão.

**E-mail de acesso** tem uma confirmação separada de identidade e titularidade do endereço. A correção usa o Auth Admin API e registra a auditoria dentro da mesma transação do Auth. O e-mail do perfil passa a ser o mesmo endereço do login corrigido, inclusive se antes era diferente. O histórico mostra uma única alteração de e-mail de acesso, preservando a auditoria completa no banco e os eventos antigos que só alteravam o e-mail cadastral. A operação exige uma identidade de e-mail existente; contas exclusivamente Google/Apple continuam gerenciadas pelo provedor. O motorista passa a entrar e recuperar senha pelo novo endereço. O fluxo não envia e-mail de confirmação: a conferência explícita é responsabilidade da operação.

Se outra pessoa alterar a ficha durante uma edição, o salvamento é recusado. Recarregue a ficha e confira os dados antes de tentar novamente. Uma correção de login em andamento bloqueia outra por até dois minutos.

## Segurança e compatibilidade

- Todas as ações revalidam a sessão administrativa no servidor; as RPCs repetem a autorização no banco.
- Campos permitidos são explícitos. O formulário não altera privilégios, IDs, aprovação, saldos ou histórico financeiro.
- A proteção da CNH aprovada permanece para o aplicativo. Correções administrativas passam pelas RPCs auditadas.
- Novos documentos ficam no bucket privado `cnh-documentos`, com nomes únicos e sem sobrescrita. O motorista acessa seus próprios arquivos e a operação acessa os necessários ao atendimento.
- Links de leitura expiram; a rota autenticada do painel gera um link novo ao abrir o documento e responde com `no-store`. Imagens privadas não passam pelo cache compartilhado do otimizador.
- O bucket legado `documentos` permanece compatível. Este trabalho não converte os arquivos antigos já públicos em arquivos privados.
- Na exclusão da conta, os novos dados de auditoria e as referências pessoais são removidos junto da anonimização existente. A função `excluir-conta` remove também os arquivos privados, incluindo versões anteriores.
- O aplicativo mantém a interface e o comportamento anteriores. O complemento de leitura de CNH que havia sido preparado foi removido; esta entrega não exige uma versão móvel nova.

## Navegação, tema e desempenho

As áreas administrativas receberam skeletons, anúncio de carregamento e telas de erro com nova tentativa. O menu indica o link em navegação e mantém o estado ativo associado à rota efetivamente aberta. Aprovar, rejeitar, suspender e reativar mostram processamento e desabilitam novo envio enquanto aguardam.

O cabeçalho usa o ícone oficial ao lado de “Chofair Admin” e “Painel de controle”, com tema e saída no topo. No desktop, o menu fica à esquerda, com o conteúdo ao lado. No celular, um botão abre o menu vertical em um diálogo com fechamento por Escape, retorno do foco e bloqueio da rolagem do fundo. Ao voltar para a largura de desktop, o diálogo fecha. A mesma estrutura atende às páginas, aos carregamentos e aos erros. O layout foi conferido em 320, 390, 768, 1024 e 1440 px nos dois temas, sem transbordamento da página.

A tela de login recebeu o mesmo ícone, fundo azul em degradê, formulário claro e um detalhe amarelo junto à marca. Os campos têm rótulos associados, preenchimento automático e foco visível. O processamento bloqueia os campos e o botão, e os erros são anunciados por uma região de alerta. O fluxo de autenticação e a verificação administrativa existentes foram preservados. A verificação no navegador cobriu larguras de 320 a 1440 px, teclado, estados de erro/carregamento com resposta Auth simulada e WCAG A/AA sem violações detectadas na tela testada.

As fichas de motorista e usuário receberam fundos, bordas e textos para ambos os temas, contraste maior nos estados vazios e contenção horizontal das tabelas. A ficha de motorista também acomoda as ações em telas pequenas. Datas sem horário, como nascimento e validade da CNH, não perdem um dia por conversão de fuso.

O dashboard substitui três consultas de contagem por uma agregação. A ficha de motorista reúne perfil e dados de edição em uma RPC. As consultas independentes continuam em paralelo; não foi introduzido cache compartilhado de dados pessoais. Essas mudanças reduzem consultas e dão resposta visual durante a espera; o tempo total continua dependendo de rede, banco e ambiente de hospedagem.

## Banco e implantação

As migrations estão no projeto irmão **ChofairApp**, em ordem:

1. `20261028120000_admin_driver_editing.sql`
2. `20261028130000_admin_driver_correction_integrity.sql`
3. `20261028140000_private_cnh_reference_guards.sql`
4. `20261028150000_defer_driver_auth_email_audit.sql`
5. `20261028160000_driver_edit_conflict_http_status.sql`
6. `20261028170000_preserve_untouched_driver_profile_fields.sql`
7. `20261029120000_admin_driver_canonical_email.sql`

Elas foram aplicadas inicialmente no staging `nwyjzyfuxxhqczdtkjnd` e promovidas, com autorização, à produção `jzxnzrtefgqhbopbcdxy` em 29/10/2026. As funções `admin-corrigir-email-motorista` e `excluir-conta` estão publicadas nos dois ambientes. A promoção incluiu também as duas migrations e duas funções financeiras, totalizando nove migrations e quatro funções. O [registro de produção](production-promotion-2026-10-29.md) descreve a comparação e as validações.

Para uma promoção posterior, conferir o projeto alvo e o dry-run, aplicar as migrations em ordem, publicar as duas Edge Functions e então publicar o painel. Não disponibilizar o novo painel contra um banco sem estas migrations. A função de correção valida o JWT internamente e exige permissão administrativa; sua configuração usa `verify_jwt = false`.

A operação pelo painel não exige nova versão Android/iOS. O complemento móvel foi desfeito. A explicação de cada migration e das funções de login/exclusão está no [guia do backend no ChofairApp](chofair-app-publication.md).

O staging já tinha uma divergência de histórico: versão `20261023190000` aplicada remotamente e ausente no checkout local. Também havia a migration não relacionada `20261025120000_split_customer_city_availability_by_vertical.sql` pendente. A aplicação desta tarefa usou um diretório CLI isolado para reconhecer o histórico existente e aplicar apenas as sete migrations acima. Nenhuma versão foi marcada como aplicada artificialmente, nenhuma migration de cidade foi executada e o vínculo original do projeto não foi trocado. Antes de uma implantação geral do app, reconciliar esse histórico com a equipe responsável.

## Validação

No painel:

```powershell
npm run test:driver-edit
npx tsc --noEmit
npm run lint
npm run build
```

No ChofairApp:

```powershell
npm run test:edge-types
npx tsc --noEmit
npm run test:encoding
```

`supabase/tests/admin_driver_editing_test.sql` usa fixtures sintéticas e rollback integral. Cobre autorização, campos proibidos, CNH vencida, salvamento atômico, conflitos, auditoria, Auth em duas gravações, exclusão e isolamento dos arquivos. Executar somente em ambiente de teste com as migrations aplicadas.

A validação final passou em build, lint, tipos do painel/app/Edge Functions e testes de campos, arquivos e banco. No navegador, contas temporárias de staging cobriram edição, envio real de PDF, login corrigido, navegação, temas e largura de 390 px, sem transbordamento da página e sem violações WCAG A/AA detectadas pelo axe na ficha testada. Testes de API confirmaram que outro usuário não assina o documento, o arquivo não abre pela URL pública, versões históricas não podem ser removidas/sobrescritas pela operação e a exclusão da conta limpa as duas versões e a auditoria pessoal. Todas as contas e os arquivos de teste foram removidos.

A extensão do acordeão compartilhado foi conferida também por navegação de leitura no staging: cancelamentos (52 registros), reembolsos (9), auditoria de veículo (1) e detalhes da linha do tempo de uma solicitação (1), com abertura por Enter e fechamento por Espaço. As páginas de revisões resolvidas, alertas e a aplicação de acessibilidade consultada não tinham eventos disponíveis nessa amostra; seus estados vazios foram conferidos. Nenhuma decisão financeira foi executada nessa verificação.

O comportamento de múltiplas gravações dentro da transação do Auth foi conferido no [código oficial do Supabase Auth](https://github.com/supabase/auth/blob/master/internal/api/admin.go). A API administrativa está documentada em [updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid).

Conflitos de revisão usam `PT409` (HTTP 409), sem repetição automática. O código reservado `40001` é destinado a falhas transitórias e pode provocar [repetições de transação no PostgREST](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions). O teste real confirmou a resposta HTTP 409 em cerca de 126 ms no staging; esse valor é uma medição pontual, não uma garantia de latência.

A conciliação limitada de cancelamentos é uma entrega adicional, descrita em [cancellation-reconciliation-plan.md](cancellation-reconciliation-plan.md), com duas migrations e duas funções financeiras próprias, aplicadas apenas no staging.

O editor reconhece `@custom-variant` e `@theme` por meio de `.vscode/tailwindcss-data.json`, registrado em `.vscode/settings.json`. São diretivas do Tailwind 4 usadas em `app/globals.css`. Como o registro não eliminou os alertas na janela utilizada, o workspace também configura `css.lint.unknownAtRules` como `ignore`, desativando especificamente os avisos de regras desconhecidas, inclusive outras diretivas personalizadas. `css.validate` permanece ativo: erros de sintaxe e os demais diagnósticos CSS continuam sendo verificados. Não é necessário alterar as diretivas nem o CSS gerado da aplicação.
