import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync('lib/visitas-origem.ts', 'utf8'), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function('exports', code)(exports);
const {
	extrairParametrosCampanha,
	classificarDispositivo,
	normalizarRegistro,
	linkPlayComCampanha,
	linkAppStoreComCampanha,
} = exports;

test('le os parametros de campanha da URL da bio (CHO-585)', () => {
	const campanha = extrairParametrosCampanha(
		'https://www.chofair.com.br/aplicativo?utm_source=instagram&utm_medium=bio&utm_campaign=lancamento-out26&utm_content=carrossel'
	);
	assert.deepEqual(campanha, {
		utm_source: 'instagram',
		utm_medium: 'bio',
		utm_campaign: 'lancamento-out26',
		utm_content: 'carrossel',
	});
});

test('URL sem marcacao devolve campanha vazia, nao erro', () => {
	assert.deepEqual(extrairParametrosCampanha('https://www.chofair.com.br/aplicativo'), {
		utm_source: null,
		utm_medium: null,
		utm_campaign: null,
		utm_content: null,
	});
});

test('classifica o aparelho sem guardar o user agent', () => {
	assert.equal(classificarDispositivo('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'), 'mobile');
	assert.equal(classificarDispositivo('Mozilla/5.0 (Linux; Android 14; SM-A546E)'), 'mobile');
	assert.equal(classificarDispositivo('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'desktop');
	assert.equal(classificarDispositivo(''), 'outro');
	assert.equal(classificarDispositivo(undefined), 'outro');
});

test('aceita a visita e grava a campanha junto', () => {
	const registro = normalizarRegistro(
		{
			evento: 'visita',
			caminho: '/aplicativo',
			referenciador: 'https://l.instagram.com/',
			utm_source: 'instagram',
			utm_medium: 'ads',
			utm_campaign: 'lancamento-out26',
			utm_content: null,
		},
		'Mozilla/5.0 (iPhone)'
	);
	assert.equal(registro.evento, 'visita');
	assert.equal(registro.loja, null);
	assert.equal(registro.dispositivo, 'mobile');
	assert.equal(registro.utm_campaign, 'lancamento-out26');
});

test('clique na loja exige dizer qual loja foi', () => {
	assert.equal(normalizarRegistro({ evento: 'clique_loja', caminho: '/aplicativo' }), null);
	assert.equal(
		normalizarRegistro({ evento: 'clique_loja', loja: 'tienda', caminho: '/aplicativo' }),
		null
	);
	const ok = normalizarRegistro({
		evento: 'clique_loja',
		loja: 'google',
		caminho: '/aplicativo',
	});
	assert.equal(ok.loja, 'google');
});

test('recusa corpo sem evento valido ou sem caminho', () => {
	assert.equal(normalizarRegistro(null), null);
	assert.equal(normalizarRegistro({ caminho: '/aplicativo' }), null);
	assert.equal(normalizarRegistro({ evento: 'visita' }), null);
	assert.equal(normalizarRegistro({ evento: 'visita', caminho: 'aplicativo' }), null);
});

test('corta texto longo no limite da coluna, em vez de estourar o insert', () => {
	const registro = normalizarRegistro({
		evento: 'visita',
		caminho: '/aplicativo',
		utm_campaign: 'c'.repeat(400),
		referenciador: 'r'.repeat(500),
	});
	assert.equal(registro.utm_campaign.length, 150);
	assert.equal(registro.referenciador.length, 300);
});

test('link da Google Play leva a campanha no referenciador', () => {
	const url = linkPlayComCampanha('https://play.google.com/store/apps/details?id=com.chofair', {
		utm_source: 'instagram',
		utm_medium: 'bio',
		utm_campaign: 'lancamento-out26',
		utm_content: null,
	});
	const referrer = new URL(url).searchParams.get('referrer');
	assert.equal(new URL(url).searchParams.get('id'), 'com.chofair');
	assert.deepEqual(
		[...new URLSearchParams(referrer).entries()],
		[
			['utm_source', 'instagram'],
			['utm_medium', 'bio'],
			['utm_campaign', 'lancamento-out26'],
		]
	);
});

test('sem campanha, o link da loja fica exatamente como era', () => {
	const base = 'https://play.google.com/store/apps/details?id=com.chofair';
	const vazia = { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null };
	assert.equal(linkPlayComCampanha(base, vazia), base);
});

test('App Store so recebe marcacao quando existe token do provedor', () => {
	const base = 'https://apps.apple.com/br/app/chofair/id6788883015?l=en-GB';
	const campanha = {
		utm_source: 'instagram',
		utm_medium: 'bio',
		utm_campaign: 'lancamento-out26',
		utm_content: null,
	};
	assert.equal(linkAppStoreComCampanha(base, campanha, ''), base);
	assert.equal(linkAppStoreComCampanha(base, campanha, null), base);

	const marcado = new URL(linkAppStoreComCampanha(base, campanha, '123456'));
	assert.equal(marcado.searchParams.get('pt'), '123456');
	assert.equal(marcado.searchParams.get('ct'), 'lancamento-out26');
	assert.equal(marcado.searchParams.get('mt'), '8');
});
