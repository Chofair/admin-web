import Link from 'next/link';
import {
	Car,
	Shield,
	Zap,
	MapPin,
	Star,
	Clock,
	ChevronRight,
	Phone,
	Mail,
} from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
			<LandingHeader />

			{/* Hero */}
			<section className="pt-32 pb-24 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-2 bg-[#0058A3]/10 border border-[#0058A3]/20 rounded-full px-4 py-1.5 mb-8">
							<span className="w-2 h-2 rounded-full bg-[#0058A3] animate-pulse" />
							<span className="text-[#0058A3] text-sm font-medium">
								Disponível 24 horas por dia
							</span>
						</div>
						<h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
							Sua corrida, <span className="text-[#0058A3]">do seu jeito.</span>
						</h1>
						<p className="text-xl text-slate-500 dark:text-slate-400 mb-10 leading-relaxed max-w-xl">
							A Chofair conecta você a motoristas verificados de forma rápida,
							segura e confortável. Solicite uma corrida em segundos.
						</p>
						<div className="flex flex-col sm:flex-row gap-4">
							<a
								href="#como-funciona"
								className="inline-flex items-center justify-center gap-2 bg-[#0058A3] hover:bg-[#0069C0] text-white font-bold px-8 py-4 rounded-full transition-colors text-base">
								Saiba mais <ChevronRight size={18} />
							</a>
							<a
								href="#motoristas"
								className="inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-900 dark:text-white font-semibold px-8 py-4 rounded-full transition-colors text-base">
								Seja motorista
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* Stats bar */}
			<section className="border-y border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 py-10 px-6">
				<div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
					{[
						{ value: '+10.000', label: 'Usuários ativos' },
						{ value: '+500', label: 'Motoristas parceiros' },
						{ value: '+50.000', label: 'Corridas realizadas' },
						{ value: '4.9★', label: 'Avaliação média' },
					].map((stat) => (
						<div key={stat.label}>
							<p className="text-3xl font-extrabold text-[#0058A3] mb-1">
								{stat.value}
							</p>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{stat.label}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Como funciona */}
			<section id="como-funciona" className="py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
							Como funciona.
						</h2>
						<p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
							Em apenas dois passos simples você já está em movimento.
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
						{[
							{
								step: '01',
								icon: MapPin,
								title: 'Informe seu destino',
								desc: 'Abra o app, insira seu ponto de partida e destino. Nossa plataforma calcula a rota mais eficiente.',
							},
							{
								step: '02',
								icon: Car,
								title: 'Escolha seu motorista',
								desc: 'Veja motoristas disponíveis próximos a você, com avaliações e tempo estimado de chegada.',
							},
							/* {
								step: '03',
								icon: Star,
								title: 'Viaje e avalie',
								desc: 'Acompanhe a corrida em tempo real e ao final avalie sua experiência para ajudar a comunidade.',
							}, */
						].map((item) => (
							<div
								key={item.step}
								className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-[#0058A3]/40 transition-colors">
								<span className="absolute top-6 right-6 text-5xl font-black text-slate-200 dark:text-slate-800">
									{item.step}
								</span>
								<div className="w-12 h-12 bg-[#0058A3]/10 rounded-xl flex items-center justify-center mb-6">
									<item.icon size={24} className="text-[#0058A3]" />
								</div>
								<h3 className="text-lg font-bold mb-3">{item.title}</h3>
								<p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
									{item.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Vantagens */}
			<section
				id="vantagens"
				className="py-24 px-6 bg-slate-100/40 dark:bg-slate-900/40">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
							Por que escolher a Chofair?
						</h2>
						<p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
							Pensamos em cada detalhe para que sua experiência seja sempre a
							melhor.
						</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
						{[
							{
								icon: Shield,
								title: 'Segurança em primeiro lugar',
								desc: 'Todos os motoristas passam por verificação de antecedentes e têm documentação validada pela nossa equipe.',
							},
							{
								icon: Zap,
								title: 'Rapidez e pontualidade',
								desc: 'Motoristas próximos a você, sempre prontos para buscar você no menor tempo possível.',
							},
							{
								icon: Clock,
								title: 'Disponível 24/7',
								desc: 'Madrugada, feriado ou horário de pico — a Chofair está sempre disponível quando você precisar.',
							},
							{
								icon: Star,
								title: 'Motoristas avaliados',
								desc: 'Sistema de avaliações bidirecional que garante qualidade para passageiros e motoristas.',
							},
							/* {
								icon: MapPin,
								title: 'Rastreamento em tempo real',
								desc: 'Acompanhe sua corrida ao vivo e compartilhe sua localização com quem quiser.',
							},
							{
								icon: Car,
								title: 'Diversas categorias',
								desc: 'Do econômico ao executivo, escolha o tipo de veículo que melhor atende à sua necessidade.',
							}, */
						].map((item) => (
							<div
								key={item.title}
								className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-[#0058A3]/30 transition-colors">
								<div className="w-10 h-10 bg-[#0058A3]/10 rounded-lg flex items-center justify-center mb-4">
									<item.icon size={20} className="text-[#0058A3]" />
								</div>
								<h3 className="font-bold mb-2">{item.title}</h3>
								<p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
									{item.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Motoristas */}
			<section id="motoristas" className="py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="bg-gradient-to-br from-[#0058A3]/10 to-[#0058A3]/5 border border-[#0058A3]/20 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
						<div className="flex-1">
							<h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
								Seja um motorista parceiro
							</h2>
							<p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
								Tenha flexibilidade de horário, ganhos competitivos e suporte
								dedicado. Cadastre-se hoje e comece a gerar renda com o seu
								veículo.
							</p>
							<ul className="space-y-3 mb-8">
								{[
									'Defina seus próprios horários',
									'Pagamentos semanais garantidos',
									'Suporte exclusivo para motoristas',
									'Programa de bonificação por desempenho',
								].map((item) => (
									<li
										key={item}
										className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
										<span className="w-5 h-5 rounded-full bg-[#0058A3]/20 flex items-center justify-center shrink-0">
											<ChevronRight size={12} className="text-[#0058A3]" />
										</span>
										{item}
									</li>
								))}
							</ul>
							<a
								href="#contato"
								className="inline-flex items-center gap-2 bg-[#0058A3] hover:bg-[#0069C0] text-white font-bold px-8 py-3.5 rounded-full transition-colors">
								Quero ser motorista <ChevronRight size={18} />
							</a>
						</div>
						<div className="w-48 h-48 md:w-64 md:h-64 bg-[#0058A3]/10 rounded-full flex items-center justify-center shrink-0">
							<Car size={80} className="text-[#0058A3]" />
						</div>
					</div>
				</div>
			</section>

			{/* Contato */}
			<section
				id="contato"
				className="py-24 px-6 bg-slate-100/40 dark:bg-slate-900/40">
				<div className="max-w-7xl mx-auto text-center">
					<h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
						Entre em contato
					</h2>
					<p className="text-slate-500 dark:text-slate-400 mb-12 max-w-lg mx-auto">
						Dúvidas, sugestões ou quer fazer parte da nossa equipe? Fale com a
						gente.
					</p>
					<div className="flex flex-col sm:flex-row gap-6 justify-center">
						<a
							href="mailto:chofairmobilidade@gmail.com"
							className="inline-flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#0058A3]/50 rounded-2xl px-8 py-5 transition-colors">
							<Mail size={20} className="text-[#0058A3]" />
							<div className="text-left">
								<p className="text-xs text-slate-500 mb-0.5">Email</p>
								<p className="font-semibold text-sm">
									chofairmobilidade@gmail.com
								</p>
							</div>
						</a>
						<a
							href="tel:+5513996567386"
							className="inline-flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#0058A3]/50 rounded-2xl px-8 py-5 transition-colors">
							<Phone size={20} className="text-[#0058A3]" />
							<div className="text-left">
								<p className="text-xs text-slate-500 mb-0.5">Telefone</p>
								<p className="font-semibold text-sm">(13) 99656-7386</p>
							</div>
						</a>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-slate-200 dark:border-slate-800 py-10 px-6">
				<div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
					<span className="text-xl font-bold text-[#0058A3]">Chofair</span>
					<p className="text-sm text-slate-500">
						© {new Date().getFullYear()} Chofair. Todos os direitos reservados.
					</p>
					<div className="flex gap-6 text-sm text-slate-500">
						<Link
							href="/termos"
							className="hover:text-slate-900 dark:hover:text-white transition-colors">
							Termos de Uso
						</Link>
						<Link
							href="/exclusao-de-conta"
							className="hover:text-slate-900 dark:hover:text-white transition-colors">
							Exclusão de Conta
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
