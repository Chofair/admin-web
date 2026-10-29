# Correções de motoristas, navegação e experiência administrativa

## Problema e resultado

O painel não permitia corrigir os dados de um motorista aprovado nem substituir sua CNH vencida. A operação dependia de intervenções no banco, que também eram bloqueadas pela proteção do documento aprovado. A navegação demorava sem indicação visual, algumas fichas não acompanhavam o tema escuro e o menu horizontal dificultava encontrar as seções.

Esta PR oferece correções auditadas na ficha existente, substituição segura da CNH e correção do e-mail de acesso. Também reorganiza a navegação e apresenta os cancelamentos conforme a pendência real: decisão operacional, cobrança incerta, reembolso em andamento ou verificação necessária.

## Correção cadastral e documentos

- Reutiliza a ficha de Motoristas para editar nome, CPF, telefone, nascimento, endereço, chave Pix e treinamentos declarados.
- Envia somente os campos alterados. E-mail de contato, URL do avatar e campos de CNH não aparecem no formulário geral.
- Mantém a CNH em formulário separado, com upload de PDF, JPG ou PNG de até 10 MB, prévia, número, categoria, validade, motivo e confirmação da conferência.
- Confere o conteúdo inicial do arquivo, além da extensão/tipo declarado. O upload usa autorização temporária e armazenamento privado; documento e dados são vinculados atomicamente no backend.
- Preserva o status atual do motorista e as versões anteriores da CNH. Documentos aparecem acima de Veículos, após Correção do cadastro.
- Corrige o e-mail de acesso pelo backend administrativo do Auth e mantém o mesmo e-mail no perfil, utilizado pelo aplicativo. Preserva o ID e a senha. Contas exclusivamente Google/Apple continuam gerenciadas pelo provedor.
- Exige motivo e confirmação da identidade/titularidade para a correção do login. Esse fluxo não envia um e-mail de confirmação ao motorista.
- Recusa salvamentos feitos sobre uma ficha desatualizada e orienta recarregar os dados.
- Desabilita o envio enquanto não houver alteração real e durante o processamento. Restaurar o valor original ou mudar somente sua formatação volta a bloquear o botão.
- Mostra o histórico das últimas 20 correções em acordeões, com responsável, data, motivo e valores anteriores/novos. A auditoria completa continua no banco.
- Exibe a correção de login uma única vez no histórico, ocultando a duplicação visual do mesmo e-mail no perfil, sem remover a auditoria.

## Navegação, aparência e acessibilidade

- Substitui o menu horizontal por navegação vertical à esquerda no desktop e menu em diálogo no celular.
- Mantém no cabeçalho o logo oficial, o título com espaço para leitura, a troca de tema e a saída.
- Oferece estado ativo, indicação de navegação pendente, atalho para o conteúdo, foco visível e controles por teclado. O menu móvel fecha por Escape e devolve o foco; também fecha ao mudar para a largura de desktop.
- Adiciona carregamentos com skeleton, anúncio de processamento e telas de erro com nova tentativa nas áreas administrativas.
- Estiliza o login com logo, azul e detalhe amarelo próximo à marca, mantendo o fluxo de autenticação existente.
- Corrige fundos, bordas, textos, indicadores e tabelas das fichas para os temas claro/escuro e telas menores.
- Dá destaque aos cabeçalhos dos formulários abertos e resposta visual ao clique, além de cursor apropriado em controles habilitados/desabilitados.
- Compartilha o padrão de acordeão nos históricos de acessibilidade, cancelamentos, reembolsos, revisões concluídas, veículos, solicitações e alertas. Ações ainda pendentes continuam visíveis.
- Corrige a apresentação de datas sem horário para evitar deslocamento de nascimento/validade por fuso.

## Desempenho e segurança

- Reúne as contagens de solicitações do dashboard em uma agregação e os dados de edição/perfil do motorista em uma RPC.
- Mantém consultas independentes em paralelo, sem introduzir cache compartilhado de dados pessoais.
- Revalida a sessão administrativa nas ações do servidor e depende das autorizações e listas de campos permitidos do banco.
- Abre CNHs por rota autenticada, com links temporários e respostas sem cache. Imagens privadas não passam pelo cache compartilhado de otimização.
- Não expõe credenciais administrativas ao navegador nem permite editar privilégios, saldos, IDs ou aprovação pelo formulário cadastral.

## Cancelamentos e reembolsos

- Distingue cobrança com resultado incerto de reembolso de um pagamento já conhecido.
- Apresenta rodadas, consultas, próxima verificação, suspensão e status externo observado quando há investigação necessária.
- Permite solicitar uma verificação adicional com motivo obrigatório, intervalo de 30 minutos e limite de três solicitações por cobrança em 24 horas, sem zerar os contadores automáticos.
- Evita duplicar a ação de verificação na mesma ficha e apresenta mensagens para limite atingido.
- Mantém o reembolso integral automático no cancelamento T−15 de pagamento confirmado. O primeiro processamento usa a próxima execução do worker existente; uma devolução confirmada deixa de ser trabalho pendente.
- Preserva a análise humana nos cancelamentos por ausência de início registrado: o relógio, isoladamente, não comprova que o serviço não aconteceu.

Os exemplos de staging marcados como pagos manualmente após falhas de teste não comprovam cobrança no Mercado Pago. Esta entrega não altera esses registros nem registra devoluções fictícias.

## Editor e documentação

Registra as diretivas `@custom-variant` e `@theme` do Tailwind 4 como dados CSS do workspace do VS Code. Corrige os dois avisos de regra desconhecida sem desativar a validação CSS nem remover regras válidas.

Os guias descrevem a operação, os limites financeiros, o diagnóstico de staging e a publicação coordenada com o backend do ChofairApp.

## Validação

- Lint, TypeScript, build do painel e nove testes de validação de campos/arquivos.
- Validação CSS pelo servidor do VS Code: dois avisos reproduzidos antes da configuração e zero diagnósticos após ela.
- Testes já executados no navegador: edição, upload e histórico de CNH, correção de login, conflito entre revisões, navegação, teclado, carregamentos, login e temas.
- Layout conferido de 320 a 1440 px; testes axe das telas verificadas sem violações A/AA detectadas.
- Testes de autorização, armazenamento privado e exclusão usando contas/arquivos temporários, removidos ao final.

## Dependências e publicação

Depende das **nove migrations e quatro Edge Functions** descritas na [PR do backend](pr-chofair-app-backend.md). O painel não deve ser publicado contra um banco sem esse contrato.

Em 29/10/2026, o staging `nwyjzyfuxxhqczdtkjnd` foi conferido: todas as migrations desta entrega aplicadas, quatro funções ativas com código igual ao local e controle financeiro novo habilitado apenas para sandbox. Não há migration ou deploy de Edge Function desta entrega pendente nesse ambiente.

Produção permanece sem alterações. Os commits locais não publicam o painel hospedado; sua publicação deve acompanhar a aprovação da homologação e a atualização do backend. Não é necessária nova versão Android/iOS.
