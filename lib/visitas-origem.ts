// CHO-585: origem das visitas da pagina /aplicativo.
// Funcoes puras de leitura dos parametros de campanha, classificacao de
// dispositivo e montagem dos links de loja marcados. Ficam separadas da rota e
// da tela para poderem ser testadas sem navegador e sem banco.

export type EventoOrigem = 'visita' | 'clique_loja';
export type LojaOrigem = 'apple' | 'google';

export type ParametrosCampanha = {
	utm_source: string | null;
	utm_medium: string | null;
	utm_campaign: string | null;
	utm_content: string | null;
};

export type RegistroOrigem = ParametrosCampanha & {
	evento: EventoOrigem;
	loja: LojaOrigem | null;
	caminho: string;
	referenciador: string | null;
	dispositivo: 'mobile' | 'desktop' | 'outro';
};

const LIMITES = {
	caminho: 200,
	utm_source: 100,
	utm_medium: 100,
	utm_campaign: 150,
	utm_content: 150,
	referenciador: 300,
} as const;

function recortar(valor: unknown, limite: number): string | null {
	if (typeof valor !== 'string') return null;
	const limpo = valor.trim();
	if (!limpo) return null;
	return limpo.slice(0, limite);
}

/** Le os parametros de campanha de uma URL (ou de uma query string). */
export function extrairParametrosCampanha(
	urlOuQuery: string
): ParametrosCampanha {
	let busca = '';
	try {
		busca = new URL(urlOuQuery).search;
	} catch {
		busca = urlOuQuery.startsWith('?') ? urlOuQuery : `?${urlOuQuery}`;
	}
	const params = new URLSearchParams(busca);
	return {
		utm_source: recortar(params.get('utm_source'), LIMITES.utm_source),
		utm_medium: recortar(params.get('utm_medium'), LIMITES.utm_medium),
		utm_campaign: recortar(params.get('utm_campaign'), LIMITES.utm_campaign),
		utm_content: recortar(params.get('utm_content'), LIMITES.utm_content),
	};
}

/** Classifica o aparelho em tres faixas, sem guardar o user agent. */
export function classificarDispositivo(userAgent: unknown): RegistroOrigem['dispositivo'] {
	if (typeof userAgent !== 'string' || !userAgent.trim()) return 'outro';
	const ua = userAgent.toLowerCase();
	if (/android|iphone|ipad|ipod|mobile|windows phone/.test(ua)) return 'mobile';
	if (/windows|macintosh|mac os|linux|cros/.test(ua)) return 'desktop';
	return 'outro';
}

/**
 * Valida o que a tela enviou e devolve a linha pronta para o banco.
 * Devolve null quando o corpo nao descreve um evento valido, para a rota
 * responder 400 em vez de gravar lixo.
 */
export function normalizarRegistro(
	corpo: unknown,
	userAgent?: unknown
): RegistroOrigem | null {
	if (!corpo || typeof corpo !== 'object') return null;
	const dados = corpo as Record<string, unknown>;

	const evento = dados.evento;
	if (evento !== 'visita' && evento !== 'clique_loja') return null;

	let loja: LojaOrigem | null = null;
	if (evento === 'clique_loja') {
		if (dados.loja !== 'apple' && dados.loja !== 'google') return null;
		loja = dados.loja;
	}

	const caminho = recortar(dados.caminho, LIMITES.caminho);
	if (!caminho || !caminho.startsWith('/')) return null;

	return {
		evento,
		loja,
		caminho,
		referenciador: recortar(dados.referenciador, LIMITES.referenciador),
		dispositivo: classificarDispositivo(userAgent),
		utm_source: recortar(dados.utm_source, LIMITES.utm_source),
		utm_medium: recortar(dados.utm_medium, LIMITES.utm_medium),
		utm_campaign: recortar(dados.utm_campaign, LIMITES.utm_campaign),
		utm_content: recortar(dados.utm_content, LIMITES.utm_content),
	};
}

/**
 * Link da Google Play com o parametro de referenciador, que faz a propria Play
 * Console atribuir a instalacao a campanha.
 * https://developer.android.com/google/play/installreferrer
 */
export function linkPlayComCampanha(
	urlBase: string,
	campanha: ParametrosCampanha
): string {
	const referrer = new URLSearchParams();
	if (campanha.utm_source) referrer.set('utm_source', campanha.utm_source);
	if (campanha.utm_medium) referrer.set('utm_medium', campanha.utm_medium);
	if (campanha.utm_campaign) referrer.set('utm_campaign', campanha.utm_campaign);
	if (campanha.utm_content) referrer.set('utm_content', campanha.utm_content);
	if ([...referrer.keys()].length === 0) return urlBase;

	const url = new URL(urlBase);
	url.searchParams.set('referrer', referrer.toString());
	return url.toString();
}

/**
 * Link de campanha da App Store (pt = token do provedor, ct = campanha).
 * O token do provedor sai do App Store Connect; sem ele a Apple ignora o ct,
 * entao devolvemos a URL original para nao publicar link quebrado.
 * https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links
 */
export function linkAppStoreComCampanha(
	urlBase: string,
	campanha: ParametrosCampanha,
	tokenProvedor?: string | null
): string {
	if (!tokenProvedor || !campanha.utm_campaign) return urlBase;
	const url = new URL(urlBase);
	url.searchParams.set('pt', tokenProvedor);
	url.searchParams.set('ct', campanha.utm_campaign.slice(0, 40));
	url.searchParams.set('mt', '8');
	return url.toString();
}
