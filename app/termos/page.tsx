import LandingHeader from '@/components/LandingHeader';
import Link from 'next/link';

export const metadata = {
	title: 'Termos de Uso — Chofair',
};

const sections = [
	{
		title: '1. Aceitação dos Termos',
		items: [
			'Ao se cadastrar e utilizar a CHOFAIR como Cliente/Contratante, você concorda integralmente com este Termo e com as regras e políticas operacionais disponibilizadas na Plataforma.',
			'Se você não concordar com qualquer condição, não utilize a Plataforma.',
		],
	},
	{
		title: '2. Definições',
		intro: 'Para fins deste Termo, valem as definições abaixo:',
		letters: [
			'Plataforma/CHOFAIR: aplicativo e sistemas que conectam Motoristas Parceiros e Clientes.',
			'Cliente/Contratante ("Cliente"): usuário que contrata o serviço por tempo e paga pela disponibilidade do Motorista.',
			'Motorista Parceiro ("Motorista"): pessoa cadastrada que presta o serviço de condução/apoio ao deslocamento, de forma autônoma, quando aceita uma solicitação.',
			'Serviço / Corrida: período em que o Motorista fica disponível ao Cliente para a execução do serviço contratado.',
			'Tempo Contratado: tempo definido e pago antecipadamente no momento da contratação, respeitado o mínimo de 2 (duas) horas.',
			'Tempo Excedente: tempo além do contratado, cobrado conforme o item 7.',
			'Comunicação Interna: chat dentro do aplicativo (canal oficial entre Cliente e Motorista).',
			'Modalidades: (i) Motorista dirigindo o carro do Cliente; (ii) Motorista com carro próprio transportando o Cliente; (iii) transporte em vans; (iv) transporte em veículo adaptado, quando aplicável.',
		],
	},
	{
		title: '3. Objeto e Papel da Plataforma',
		items: [
			'A CHOFAIR é uma plataforma de intermediação tecnológica, que facilita a conexão entre Clientes e Motoristas para contratação de serviços.',
			'O Cliente reconhece que o Motorista atua de forma autônoma e independente, sem vínculo empregatício com a CHOFAIR.',
			'A CHOFAIR não garante disponibilidade permanente de Motoristas, aceitação de solicitações, tempo de chegada, ou continuidade do serviço em caso de eventos fora do controle razoável.',
		],
	},
	{
		title: '4. Cadastro, Veracidade das Informações e Uso Adequado',
		items: [
			'O Cliente deve fornecer dados verdadeiros, completos e atualizados.',
			'É proibido:',
			'A CHOFAIR poderá solicitar validações adicionais para segurança e prevenção a fraudes.',
		],
		subLetters: {
			1: [
				'usar dados falsos ou de terceiros;',
				'criar conta com identidade adulterada;',
				'utilizar a Plataforma para fins ilícitos, fraudulentos ou para causar dano a terceiros.',
			],
		},
	},
	{
		title: '5. Conta, Segurança e Responsabilidade de Acesso',
		items: [
			'A conta do Cliente é pessoal e intransferível. O Cliente é responsável por proteger login e senha.',
			'É proibido compartilhar conta, ceder acesso, usar conta de terceiros ou permitir uso indevido.',
			'Em caso de suspeita de uso indevido, o Cliente deve comunicar imediatamente ao suporte.',
		],
	},
	{
		title: '6. Conduta, Comunicação, Proibições e Medidas da Plataforma.',
		items: [
			'O Cliente deve agir com respeito, boa-fé, prudência e civilidade no contato com o Motorista e no uso da Plataforma.',
			'Condutas vedadas (tolerância zero): é proibido, durante o serviço ou em contato com o Motorista:',
			'Medidas e consequências: a violação deste Termo (especialmente do item 6.2) pode resultar, conforme gravidade e recorrência, em:',
			'A CHOFAIR poderá aplicar as medidas do item 6.3 com ou sem aviso prévio, quando necessário para segurança, prevenção a fraudes, apuração de denúncias ou cumprimento de obrigação legal.',
			'Canal de contestação/recurso: quando cabível, a CHOFAIR poderá disponibilizar canal de contestação por suporte, sem obrigação de reativar a conta.',
			'Comunicação exclusiva pelo chat do app: toda comunicação operacional entre Cliente e Motorista deve ocorrer pela Comunicação Interna. Contato externo deve ser evitado e só é aceitável em situações excepcionais de emergência e segurança.',
		],
		subLetters: {
			1: [
				'assédio, discriminação, ameaças, violência, intimidação;',
				'solicitar ou oferecer valores "por fora", negociar corrida fora do app, induzir desintermediação ou burlar o fluxo oficial;',
				'exigir contato externo como condição do serviço;',
				'informar local/horário intencionalmente falsos para causar prejuízo;',
				'utilizar a Plataforma para fins ilícitos;',
				'qualquer ato que gere risco relevante ao Motorista, ao Cliente, a terceiros ou à Plataforma.',
			],
			2: [
				'advertência e orientações de uso;',
				'bloqueio temporário de acesso/solicitações;',
				'suspensão;',
				'desativação da conta;',
				'restrições operacionais e/ou retenção temporária de valores em análise, quando houver contestação, fraude ou exigência legal.',
			],
		},
	},
	{
		title: '7. Pagamento, Tempo, Excedente, Cancelamento e Regras do Serviço',
		intro:
			'Esta seção define o modelo de cobrança vigente e é parte essencial deste Termo.',
		items: [
			'Pré-pagamento e tempo mínimo:',
			'Encerramento antes do tempo contratado (sem reembolso): se o serviço terminar antes do Tempo Contratado, o valor pago não é reembolsável, pois remunera a disponibilidade do Motorista e a reserva do período.',
			'Tempo excedente: tolerância de 15 minutos e cobrança em blocos de 15 minutos:',
			'Regra operacional de ida e volta: a CHOFAIR adota como premissa operacional que o serviço é de ida e volta, isto é, o ponto final deve ser o mesmo do ponto inicial, salvo ajuste registrado no chat do app e conforme regras/políticas vigentes.',
			'Cancelamento e não comparecimento ("no-show"):',
			'Contestação de pagamento (chargeback), fraude e apuração:',
		],
		subLetters: {
			0: [
				'O serviço é pago antecipadamente no momento da contratação.',
				'O tempo mínimo contratado é de 2 (duas) horas.',
				'O pagamento garante a disponibilidade exclusiva do Motorista durante o Tempo Contratado.',
			],
			2: [
				'Se o serviço exceder o Tempo Contratado, o tempo adicional será cobrado em blocos de 15 minutos (0,25h).',
				'Existe tolerância de 15 (quinze) minutos após o término do Tempo Contratado.',
				'Ultrapassada a tolerância de 15 minutos, cobra-se 1 (um) bloco de 0,25h (15 minutos), e os demais excedentes seguem em novos blocos de 0,25h (15 minutos).',
				'O arredondamento é sempre para cima para o próximo bloco de 0,25h (15 minutos) após ultrapassar a tolerância.',
			],
			4: [
				'Se o Cliente não comparecer no local e horário combinados ("no-show"), poderá haver cobrança parcial/total conforme política vigente, considerando que houve reserva de tempo e disponibilidade do Motorista.',
				'Se o Motorista não comparecer ou cancelar sem justificativa aceita, poderá haver medidas internas e eventual estorno ao Cliente conforme análise e política vigente.',
				'Abusos, tentativas de burlar o fluxo e condutas reiteradas podem resultar em medidas conforme o item 6.',
			],
			5: [
				'Em caso de contestação de pagamento, suspeita de fraude ou determinação legal, a CHOFAIR poderá reter temporariamente valores e informações até conclusão de análise.',
				'O Cliente concorda em colaborar com evidências mínimas quando solicitado (ex.: registros no chat) para apuração.',
			],
		},
	},
	{
		title: '8. Regras Específicas — Veículo do Cliente (Modalidade 1)',
		items: [
			'Ao contratar a Modalidade 1, o Cliente declara que o veículo:',
			'O Cliente deve informar ao Motorista, antes do início, regras relevantes e lícitas de uso do veículo (ex.: local para estacionar, restrições de rota, etc.), sem colocar em risco a segurança.',
			'Responsabilidade por danos:',
		],
		subLetters: {
			0: [
				'está em condições mínimas de segurança e uso;',
				'possui documentação e licenciamento regulares;',
				'possui seguro, se desejar.',
			],
			2: [
				'O Motorista responde por danos decorrentes de conduta culposa ou dolosa (negligência, imprudência ou imperícia).',
				'O Cliente reconhece que falhas mecânicas pré-existentes, vícios ocultos e problemas estruturais do veículo não são automaticamente atribuíveis ao Motorista, salvo quando houver nexo com sua conduta.',
			],
		},
	},
	{
		title:
			'9. Regras Específicas — Transporte com Veículo do Motorista/Van/Adaptado',
		items: [
			'Nas modalidades em que o deslocamento é realizado com veículo do Motorista (ou van/adaptado), o Cliente reconhece que:',
		],
		subLetters: {
			0: [
				'a contratação ocorre por meio da Plataforma, conforme modalidade selecionada;',
				'custos e condições são apresentados antes da confirmação, conforme o modelo de precificação vigente;',
				'o Motorista deve seguir normas de segurança e trânsito.',
			],
		},
	},
	{
		title: '10. Itens Pessoais, Comportamento e Responsabilidades do Cliente',
		items: [
			'O Cliente é responsável por seus itens pessoais (documentos, celular, bagagem), recomendando-se atenção durante todo o serviço.',
			'O Cliente se compromete a não solicitar ao Motorista condutas ilegais, perigosas ou contrárias às regras da Plataforma.',
			'O Cliente pode ser responsabilizado por danos causados ao veículo do Motorista (quando aplicável) ou por prejuízos gerados por sua conduta, nos termos da lei.',
		],
	},
	{
		title: '11. Propriedade Intelectual e Licença de Uso',
		items: [
			'A Plataforma, marca, layout, códigos, funcionalidades, textos e demais ativos são de propriedade da CHOFAIR ou licenciados a ela.',
			'A CHOFAIR concede ao Cliente uma licença limitada, revogável, não exclusiva e intransferível para uso do aplicativo, apenas para fins de utilização da Plataforma conforme este Termo.',
			'É proibido copiar, modificar, realizar engenharia reversa, explorar comercialmente ou violar direitos de propriedade intelectual da CHOFAIR.',
		],
	},
	{
		title: '12. Limitação de Responsabilidade',
		items: [
			'A CHOFAIR atua como intermediadora tecnológica e não garante:',
			'Na máxima extensão permitida pela lei aplicável, a CHOFAIR não será responsável por:',
			'Esta limitação não se aplica em caso de dolo ou culpa grave da CHOFAIR, quando a lei vedar limitação, ou quando houver responsabilidade legal obrigatória.',
		],
		subLetters: {
			0: [
				'disponibilidade permanente de Motoristas;',
				'aceitação de solicitações;',
				'ausência total de falhas técnicas ou indisponibilidades.',
			],
			1: [
				'lucros cessantes, perda de chance, danos indiretos ou consequenciais;',
				'atos de terceiros, inclusive Motoristas e Clientes, salvo quando houver responsabilidade direta comprovada da CHOFAIR;',
				'incidentes fora do controle razoável da CHOFAIR (caso fortuito/força maior).',
			],
		},
	},
	{
		title: '13. Isenção Condicional',
		items: [
			'O Cliente concorda em manter a CHOFAIR, seus administradores e parceiros isentos de perdas, danos, multas e despesas (incluindo honorários advocatícios razoáveis) decorrentes de:',
		],
		subLetters: {
			0: [
				'violação deste Termo;',
				'informações falsas;',
				'conduta ilícita, culposa ou dolosa do Cliente;',
				'reclamações de terceiros causadas por atos do Cliente no contexto do serviço.',
			],
		},
	},
	{
		title: '14. Alterações dos Termos',
		items: [
			'A CHOFAIR poderá atualizar este Termo para refletir mudanças legais, operacionais ou de produto.',
			'Sempre que possível, será exibido aviso no aplicativo. O uso continuado após a vigência da nova versão implica aceitação.',
		],
	},
	{
		title: '15. Disposições Gerais',
		items: [
			'Se alguma cláusula for considerada inválida, as demais permanecem válidas.',
			'A tolerância de uma parte não implica renúncia de direitos.',
			'Eventos de força maior (fora do controle razoável) não geram responsabilidade, na forma da lei.',
		],
	},
	{
		title: '16. Legislação e Foro',
		items: [
			'Este Termo é regido pelas leis da República Federativa do Brasil.',
			'Fica eleito o foro da Comarca de Registro/SP, salvo quando a lei determinar foro diverso de forma obrigatória, inclusive regras aplicáveis de proteção ao consumidor.',
		],
	},
];

const alpha = 'abcdefghijklmnopqrstuvwxyz';

export default function TermosPage() {
	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
			<LandingHeader />

			<main className="flex-1 pt-24 pb-20">
				<div className="max-w-3xl mx-auto px-6">
					{/* Page header */}
					<div className="mb-10">
						<Link href="/" className="text-sm text-[#0058A3] hover:underline">
							← Voltar para o início
						</Link>
						<h1 className="text-4xl font-extrabold mt-6 mb-3">
							Termo de Uso do Cliente
						</h1>
						<div className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
							<p>
								Contato/Suporte:{' '}
								<a
									href="mailto:suporte@chofair.com.br"
									className="text-[#0058A3] hover:underline">
									suporte@chofair.com.br
								</a>
							</p>
							<p>
								Última atualização:{' '}
								{new Date().toLocaleDateString('pt-BR', {
									day: '2-digit',
									month: 'long',
									year: 'numeric',
								})}
							</p>
						</div>
						<p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
							A CHOFAIR é uma plataforma digital operada por{' '}
							<strong>[RAZÃO SOCIAL DA EMPRESA]</strong>, inscrita no CNPJ sob
							nº <strong>[CNPJ]</strong>, com sede em{' '}
							<strong>[ENDEREÇO COMPLETO]</strong>.
						</p>
					</div>

					{/* Sections */}
					<div className="space-y-8">
						{sections.map((section, si) => (
							<section key={section.title}>
								<h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wide">
									{section.title}
								</h2>

								{'intro' in section && section.intro && (
									<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
										{section.intro}
									</p>
								)}

								{'letters' in section && section.letters && (
									<ul className="space-y-1.5 mb-2">
										{section.letters.map((letter, li) => (
											<li
												key={li}
												className="flex gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
												<span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
													{alpha[li]})
												</span>
												<span>{letter}</span>
											</li>
										))}
									</ul>
								)}

								{'items' in section && section.items && (
									<div className="space-y-3">
										{section.items.map((item, ii) => {
											const subLetters =
												'subLetters' in section
													? (section.subLetters as Partial<
															Record<number, string[]>
														>)
													: undefined;
											const sub = subLetters?.[ii];
											const num = `${si + 1}.${ii + 1}`;
											return (
												<div key={ii}>
													<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
														<span className="font-semibold text-slate-700 dark:text-slate-300">
															{num}
														</span>{' '}
														{item}
													</p>
													{sub && (
														<ul className="mt-2 ml-6 space-y-1.5">
															{sub.map((s: string, si2: number) => (
																<li
																	key={si2}
																	className="flex gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
																	<span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0">
																		{alpha[si2]})
																	</span>
																	<span>{s}</span>
																</li>
															))}
														</ul>
													)}
												</div>
											);
										})}
									</div>
								)}

								<div className="mt-6 border-b border-slate-200 dark:border-slate-800" />
							</section>
						))}
					</div>
				</div>
			</main>

			<footer className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
				© {new Date().getFullYear()} Chofair. Todos os direitos reservados.
			</footer>
		</div>
	);
}
