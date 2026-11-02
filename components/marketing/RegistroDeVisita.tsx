'use client';

import { useEffect } from 'react';
import { registrarOrigem } from '@/lib/registrar-origem';

// CHO-585: registra a abertura de uma pagina publica com os parametros de
// campanha da URL. Fica fora dos botoes porque uma pagina pode ter mais de um
// bloco de botao e a visita precisa ser contada uma unica vez.

let jaRegistrou = false;

export default function RegistroDeVisita() {
	useEffect(() => {
		if (jaRegistrou) return;
		jaRegistrou = true;
		registrarOrigem({ evento: 'visita' });
	}, []);

	return null;
}
