// CHO-585: envio do registro de origem a partir do navegador.
//
// Separado da biblioteca de regras porque depende de API de navegador.
// O clique no botao da loja acontece junto com a saida da pagina, e uma
// requisicao comum pode ser cancelada no meio do caminho. sendBeacon existe
// exatamente para esse caso: o proprio navegador se encarrega de entregar
// depois, mesmo que a pagina seja descarregada. O fetch fica como reserva para
// navegador que nao tenha sendBeacon.

import { extrairParametrosCampanha, type EventoOrigem, type LojaOrigem } from './visitas-origem';

const ROTA = '/api/visitas';

type DadosEvento = {
	evento: EventoOrigem;
	loja?: LojaOrigem | null;
};

export function registrarOrigem({ evento, loja = null }: DadosEvento) {
	if (typeof window === 'undefined') return;

	const corpo = JSON.stringify({
		evento,
		loja,
		caminho: window.location.pathname,
		referenciador: document.referrer || null,
		...extrairParametrosCampanha(window.location.href),
	});

	if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
		const entregue = navigator.sendBeacon(
			ROTA,
			new Blob([corpo], { type: 'application/json' })
		);
		if (entregue) return;
	}

	void fetch(ROTA, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: corpo,
		keepalive: true,
	}).catch(() => {
		// medicao nunca pode quebrar a pagina nem bloquear o clique
	});
}
