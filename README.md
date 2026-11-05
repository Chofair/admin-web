This repository contains the Admin Web panel, a [Next.js](https://nextjs.org) application generated with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Site público

As páginas institucionais `/` e `/aplicativo` compartilham os textos dos serviços,
contatos e links das lojas em `lib/site-content.ts`. Consulte
[a documentação do site](docs/public-site.md) para detalhes do QR Code,
acessibilidade e origem dos arquivos de imagem.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase: desenvolvimento local e Vercel

`npm run dev` carrega automaticamente `../admin-staging.env`, fora do repositório.
O arquivo contém somente a URL/chave pública do staging e identificadores de ambiente.
Em outra máquina, copie o arquivo para a pasta acima do projeto ou defina
`ADMIN_STAGING_ENV_FILE` com seu caminho. Não inclua credenciais de pagamento, SMTP,
chaves secretas ou `service_role`. Node.js 20.12 ou superior é necessário.

Se o arquivo estiver ausente ou inválido, o desenvolvimento não inicia: não há
fallback para produção. A configuração externa prevalece sobre o `.env.local`
durante `npm run dev`. Não é necessário editar o arquivo de produção existente.

`npm run build` e `npm start` mantêm a configuração existente; não carregam o
arquivo externo de staging. Portanto, esses comandos locais não são um perfil de
homologação. Na Vercel, mantenha as variáveis de Supabase de produção atuais.
Nenhuma automação de deploy do Supabase foi ativada.

### Monitoramento Google Maps

`ADMIN_ENVIRONMENT=staging` identifica o banco exibido pela tela. O filtro de
telemetria usa `MAPS_MONITORING_ENVIRONMENT` (`development`, `preview` ou
`production`); sem configuração, e na Vercel, permanece `production`.
As Edge Functions atuais ainda rotulam o consumo do staging como `production`.
Por isso, o arquivo local mantém esse filtro para preservar os dados existentes:
ele consulta somente o banco de staging, não o de produção. Uma futura mudança
de classificação deve alinhar produtor, dados históricos e filtro do painel.

### Ocorrências de cadastro (CHO-587)

Acesse **Ocorrências de cadastro** no menu lateral (`/cidades/demanda`). A tela separa
cadastro concluído fora da cobertura, recusa por cidade, recusa por modalidade
e falha técnica reportada. Cadastro sem cobertura é interesse, não erro.
Filtros por período, cidade/UF, categoria, papel e modalidade; até 30 cidades
no resumo e 50 ocorrências por página. Os horários usam Brasília.

Depende da migration `20261104140000_coverage_demand_monitoring.sql` no projeto
ChofairApp e da versão do aplicativo com as RPCs monitoradas. Implantar o banco
antes de publicar a tela e o app. A migration urgente anterior de liberação do
cadastro é independente e já foi aplicada em staging e produção.

A leitura exige administrador no servidor e no banco. O histórico grava cidade,
UF, papel, momento, modalidade, código limitado e ID da conta; não copia e-mail,
CPF, telefone ou mensagem bruta de erro. A exclusão da conta remove seu vínculo.
Retenção de 30 dias com limpeza automática diária, consulta dos últimos 30 dias,
paginação por data/ID e limite de
100 registros diários por conta. Repetir a conclusão do cadastro não duplica
interesse na mesma cidade. Não há polling, push nem envio de e-mail.

Os registros começam nos fluxos monitorados do app atualizado; recusas antigas,
falhas sem sessão e eventos que não chegam ao servidor não são reconstruídos.
Os contadores refletem esse histórico limitado, não um censo de todas as falhas.

Validação: `npm run test:demand` usa TypeScript e o runner nativo do Node, sem
dependência nova. Execute também `npm run lint` e `npm run build`. As regressões
SQL/RLS ficam em `supabase/tests/coverage_demand_monitoring_test.sql` no ChofairApp
e rodam no banco descartável da CI, nunca nos bancos de clientes.

### Feedback de navegação e saída do painel

O menu lateral oferece acesso direto a **Ocorrências de cadastro**. Apenas a rota
mais específica fica marcada como atual, sem selecionar Cidades ao mesmo tempo.
Cidades e Ocorrências são abas independentes: não há atalhos entre as páginas.
A rota técnica foi mantida para preservar os filtros e links existentes.
Foi preservado o feedback de navegação do menu.

O botão Sair usa o estado real de envio do formulário (useFormStatus, já incluído
no React DOM): mostra carregamento, impede cliques repetidos e anuncia o estado
ao leitor de tela. Em telas menores mantém apenas o ícone para evitar apertar o
cabeçalho. A ação de logout e a remoção dos cookies não foram alteradas.
Validação manual: testar hover/clique nos dois temas, abrir o histórico pelo
menu e observar o indicador ao sair, inclusive com rede lenta.
