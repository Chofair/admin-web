// CHO-585: atalho curto para a bio do Instagram.
// A bio mostra apenas chofair.com.br/ig; o redirecionamento acrescenta a
// marcacao de origem e manda para a pagina do aplicativo, para a medicao nao
// custar um endereco comprido no perfil.
//
// Parametros opcionais, uteis em anuncio (onde o link nao fica a vista):
//   ?c=<campanha>  -> utm_campaign (nome da peca)
//   ?m=<meio>      -> utm_medium (padrao "bio"; em anuncio, "ads")

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
	const entrada = new URL(request.url);
	const destino = new URL('/aplicativo', entrada.origin);

	destino.searchParams.set('utm_source', 'instagram');
	destino.searchParams.set(
		'utm_medium',
		entrada.searchParams.get('m')?.trim() || 'bio'
	);

	const campanha = entrada.searchParams.get('c')?.trim();
	if (campanha) destino.searchParams.set('utm_campaign', campanha);

	const conteudo = entrada.searchParams.get('p')?.trim();
	if (conteudo) destino.searchParams.set('utm_content', conteudo);

	// Temporario de proposito: redirecionamento permanente ficaria preso no
	// navegador de quem ja clicou, e o destino pode mudar.
	return Response.redirect(destino.toString(), 307);
}
