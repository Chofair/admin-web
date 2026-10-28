# Site público Chofair

As páginas `/` e `/aplicativo` são pré-renderizadas. O conteúdo institucional não
consulta o Supabase nem acrescenta endpoints de reserva, cadastro ou pagamento.
O painel e seu proxy de autenticação não foram modificados.

## Conteúdo e navegação

`lib/site-content.ts` concentra os serviços, contatos e links das lojas. Os textos
dos serviços seguem `rideServicePresentation.ts` e `HomeServiceChoices.tsx` do
projeto ChofairApp. Ao atualizar esses textos no aplicativo, atualize essa fonte
no site também.

Os botões das lojas e os contatos funcionam sem JavaScript. O menu móvel usa
`details`/`summary` nativos; com JavaScript, também fecha ao selecionar um link,
pressionar Escape ou tocar fora dele. Os links do cabeçalho para seções usam a
raiz do site, inclusive quando acessados de páginas internas.

Os estilos públicos estão isolados em `components/marketing/marketing.module.css`,
sem modificar o tema do painel. O site tem foco visível, atalho para o conteúdo,
títulos semânticos e suporte à preferência por movimento reduzido.

## Informações legais

`/termos` e `/exclusao-de-conta` usam `LegalPageLayout`, com a mesma identidade,
cabeçalho e rodapé das páginas institucionais. O botão compartilhado `BackToHome`
também é usado na página do aplicativo; os links legais do rodapé têm contraste,
peso e sublinhado discretamente reforçados.

As cláusulas dos termos foram preservadas. A identificação da empresa existente
nos termos foi mantida; o bloco de modelo com `[RAZÃO SOCIAL DA EMPRESA]` e
`[CNPJ]` foi retirado da página de exclusão. Não é exibida uma data editorial
calculada a cada acesso ou build, pois isso não representa uma revisão dos termos.

As orientações de exclusão seguem o caminho atual do ChofairApp:
`Conta → Preferências e ajuda → Segurança → Excluir conta`. Os prazos e a
descrição dos dados excluídos ou mantidos existentes na página foram preservados.
O endereço de suporte desses documentos continua sendo `suporte@chofair.com.br`,
com abertura de composição no Gmail e destinatário preenchido.

## Download e QR Code

- Android: https://play.google.com/store/apps/details?id=com.chofair
- iPhone: https://apps.apple.com/br/app/chofair/id6788883015
- Instagram: https://www.instagram.com/chofair_brasil/
- WhatsApp: https://wa.me/5513996567386 (cabeçalho e seção de contatos).

O número na seção de contatos abre o WhatsApp, assim como o ícone do cabeçalho.
O e-mail abre a composição de uma mensagem no Gmail com o destinatário
`chofairmobilidade@gmail.com` preenchido; uma conta Google pode precisar de login.
Os links abrem em nova aba com `noopener noreferrer`, e nenhum envio é automático.

O QR Code codifica `new URL('/aplicativo', window.location.origin).href`.
Assim, usa o domínio em que o site está aberto e ignora parâmetros de consulta.
Não há serviço externo de QR Code, redirecionador ou rastreador.

A biblioteca `toqr` está fixada em `0.1.1`, sem dependências transitivas, e só é
carregada no computador, próximo da seção de download. O SVG preserva quatro
módulos de margem branca. No celular, ficam disponíveis os botões das lojas.
Se o QR não carregar, o link para `/aplicativo` continua funcionando.

Em desenvolvimento, o QR aponta para o endereço local. Para escaneá-lo em outro
dispositivo, o endereço precisa ser acessível a esse dispositivo. Publicado, ele
passa a apontar automaticamente para o domínio público, sem mudar o código.

## Imagens e identidade

- `public/brand/chofair-symbol.webp`: símbolo oficial transparente do projeto
  ChofairApp, redimensionado para 128 × 128.
- `public/brand/chofair-icon.png`: ícone oficial do mesmo projeto, em 180 × 180.
- `public/images/chofair-coastal-hero.webp`: imagem ilustrativa gerada pela
  ferramenta integrada `image_gen`, com base na arte conceitual aprovada. Não é
  uma fotografia da frota ou uma declaração sobre a área de atendimento.

Azul `#0058A3` e amarelo `#FFC845` seguem `constants/Colors.ts` do aplicativo.
A imagem principal foi convertida para WebP (1672 × 941, aproximadamente 208 KiB).
`next/image` entrega tamanhos responsivos, reserva espaço e prioriza a imagem
principal. As imagens e fontes são servidas pelo próprio site.

## Validação local

- Build de produção e TypeScript concluídos.
- Páginas públicas verificadas em larguras de 320, 360, 390, 768, 1024, 1440 e
  1920 pixels, sem rolagem horizontal.
- Auditoria axe-core de WCAG A/AA e boas práticas, em desktop e celular:
  nenhuma violação detectada nas duas páginas.
- Navegação por teclado, Escape, compensação do cabeçalho nos links para seções
  e atalho para o conteúdo verificados no navegador.
- Navegação e downloads verificados com JavaScript desativado.
- QR Code renderizado decodificado com um leitor independente: aponta para
  `/aplicativo` no mesmo domínio e ignora parâmetros externos na URL.
- Nenhuma requisição a terceiros durante a navegação pública testada.
- Acesso não autenticado a `/admin` continua redirecionando para `/login`.
- Simulação de rede limitada e CPU quatro vezes mais lenta: nenhum deslocamento
  de layout observado; a biblioteca de QR não foi baixada no celular.

### Prompt final da imagem principal

Use case: photorealistic-natural. Asset type: production website hero background photograph.
The reference is an APPROVED WEBSITE MOCKUP, used ONLY as the photographic scene and visual mood reference. Create ONLY the full-bleed PHOTOGRAPH behind its hero. Do NOT reproduce any website, text, logo, buttons, UI, frames, columns, mobile preview, panels or QR. This is a standalone wide landscape production photo, approximately 1920x1080.
Match the approved mockup's exact beautiful blue-hour Brazilian coastal urban avenue, softly glowing warm street lamps, palms, distant mountains over a bay, city buildings at the far right. A clean modern dark blue-black comfortable sedan photographed three-quarter front view on the RIGHT HALF of frame, facing slightly toward viewer and left. Car neatly parked on roadside, lights gently on, tasteful realistic family/executive sedan, not a sports car. Do not display car manufacturer emblems or readable license plates. No people.
Composition is CRITICAL for website use: left 50% is open atmospheric dark navy-blue bay and dusk sky, subtle distant city lights and road, no foreground subject, usable negative space for white page headline that WILL BE ADDED IN CODE, NOT BY YOU. Keep the whole sedan visible on right, not too close up. Car occupies approximately 45% of image width. Wide scenic view of coastal city, sophisticated and welcoming, natural photoreal photography. Keep some room above sedan for mobile cropping. Blue #0058A3 / deep navy atmosphere with natural warm amber sunset on horizon and tiny warm streetlamps. Sharp professional commercial photography, high quality detail, coherent perspective and undistorted wheels, elegant calm mood.
Absolutely no text, no watermark, no slogan, no UI, no website, no yellow graphic accents. Preserve the approved reference's photo mood.
