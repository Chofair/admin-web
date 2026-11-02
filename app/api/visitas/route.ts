import { createClient } from '@supabase/supabase-js';
import { normalizarRegistro } from '@/lib/visitas-origem';

// CHO-585: recebe o registro anonimo de visita/clique da pagina /aplicativo.
// Roda no servidor para que a tela nao precise conhecer a tabela e para que o
// aparelho seja classificado a partir do user agent sem guardar o user agent.

export const runtime = 'nodejs';

export async function POST(request: Request) {
	let corpo: unknown;
	try {
		corpo = await request.json();
	} catch {
		return Response.json({ erro: 'corpo invalido' }, { status: 400 });
	}

	const registro = normalizarRegistro(corpo, request.headers.get('user-agent'));
	if (!registro) {
		return Response.json({ erro: 'evento invalido' }, { status: 400 });
	}

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !chave) {
		return Response.json({ erro: 'supabase nao configurado' }, { status: 500 });
	}

	const supabase = createClient(url, chave, {
		auth: { persistSession: false },
	});

	const { error } = await supabase.from('visitas_origem').insert(registro);
	if (error) {
		// Medicao nunca pode atrapalhar a pagina: registra e segue.
		console.error('[visitas_origem] falha ao gravar', error.message);
		return Response.json({ ok: false }, { status: 202 });
	}

	return Response.json({ ok: true }, { status: 201 });
}
