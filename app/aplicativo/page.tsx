import Image, { type StaticImageData } from 'next/image';
import {
	Accessibility,
	CalendarClock,
	CarFront,
	CreditCard,
	MapPin,
	ShieldCheck,
	UserRound,
} from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import homeScreenshot from '@/public/aplicativo/home.jpg';
import solicitacaoScreenshot from '@/public/aplicativo/nova-solicitacao.jpg';

const APP_STORE_URL =
	'https://apps.apple.com/br/app/chofair/id6788883015?l=en-GB';
const PLAY_STORE_URL =
	'https://play.google.com/store/apps/details?id=com.chofair';

const STEPS = [
	{
		icon: CarFront,
		title: 'Escolha o serviço',
		description:
			'Só o motorista para dirigir o seu carro, ou motorista com veículo.',
	},
	{
		icon: CalendarClock,
		title: 'Agende o horário',
		description: 'Informe a data, o horário de início e de fim do serviço.',
	},
	{
		icon: MapPin,
		title: 'Defina o trajeto',
		description: 'Indique o local de partida e o destino da corrida.',
	},
	{
		icon: CreditCard,
		title: 'Pague pelo app',
		description: 'Cadastre seu cartão e pague com segurança, sem dinheiro.',
	},
];

const SERVICES = [
	{
		icon: UserRound,
		title: 'Só Motorista',
		description:
			'Um motorista profissional dirige o seu próprio veículo. Ideal para eventos, viagens ou quando você não quer dirigir.',
	},
	{
		icon: CarFront,
		title: 'Motorista + Carro',
		description:
			'O motorista leva o veículo até você. Conforto do início ao fim, sem se preocupar com nada.',
	},
	{
		icon: Accessibility,
		title: 'Acessibilidade',
		description:
			'Veículos adaptados para quem precisa, com preço por trecho em vez de por hora.',
	},
];

function StoreButtons({ variant }: { variant: 'onBrand' | 'onDark' }) {
	const appStoreClass =
		variant === 'onBrand'
			? 'bg-white text-slate-900 hover:bg-slate-100'
			: 'bg-white text-slate-900 hover:bg-slate-200';
	const playStoreClass =
		variant === 'onBrand'
			? 'bg-slate-950 text-white hover:bg-slate-800'
			: 'bg-[#0058A3] text-white hover:bg-[#0069C0]';

	return (
		<div className="flex flex-col sm:flex-row gap-3">
			<a
				href={APP_STORE_URL}
				target="_blank"
				rel="noopener noreferrer"
				className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl transition-colors ${appStoreClass}`}>
				<svg
					viewBox="0 0 24 24"
					className="w-7 h-7 shrink-0 fill-current"
					xmlns="http://www.w3.org/2000/svg">
					<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
				</svg>
				<div className="text-left">
					<p className="text-[10px] font-normal opacity-70 leading-none mb-1 uppercase tracking-wide">
						Baixar na
					</p>
					<p className="text-base font-semibold leading-none">App Store</p>
				</div>
			</a>

			<a
				href={PLAY_STORE_URL}
				target="_blank"
				rel="noopener noreferrer"
				className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl transition-colors ${playStoreClass}`}>
				<svg
					viewBox="0 0 24 24"
					className="w-7 h-7 shrink-0 fill-current"
					xmlns="http://www.w3.org/2000/svg">
					<path d="M3.18 23.76c.35.19.74.24 1.14.12L14.9 12.24 11.1 8.4 3.18 23.76zm17.26-11.1L17.6 11.1l-3.14 1.82 3.17 3.17 2.82-1.64c.8-.47.8-1.31-.01-1.79zM3 1.13c-.09.29-.09.63 0 1.02v20.52c.01.13.03.26.06.37L14.37 12 3 1.13zM14.9 11.76L4.32.24C3.92.12 3.53.17 3.18.4L14.9 11.76z" />
				</svg>
				<div className="text-left">
					<p className="text-[10px] font-normal opacity-70 leading-none mb-1 uppercase tracking-wide">
						Disponível no
					</p>
					<p className="text-base font-semibold leading-none">Google Play</p>
				</div>
			</a>
		</div>
	);
}

function PhoneMockup({
	src,
	alt,
	className = '',
	preload = false,
}: {
	src: StaticImageData;
	alt: string;
	className?: string;
	preload?: boolean;
}) {
	return (
		<div
			className={`rounded-[2.75rem] bg-slate-900 p-2.5 shadow-2xl shadow-slate-900/30 ${className}`}>
			<div className="relative overflow-hidden rounded-[2.25rem] bg-slate-800">
				<Image
					src={src}
					alt={alt}
					placeholder="blur"
					preload={preload}
					sizes="(min-width: 1024px) 288px, 240px"
					className="block h-auto w-full"
				/>
				{/* Dynamic Island */}
				<div className="absolute top-1.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
			</div>
		</div>
	);
}

export default function AplicativoPage() {
	return (
		<div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
			<LandingHeader />

			<main className="flex-1 pt-20">
				{/* Hero: bloco de cor + bloco com o app */}
				<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4">
					<div className="rounded-4xl bg-[#0058A3] text-white px-8 py-12 sm:px-12 sm:py-16 lg:py-20 flex flex-col justify-center">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70 mb-5">
							Motorista particular
						</p>
						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
							Seu motorista, na hora que você precisar
						</h1>
						<p className="text-lg text-white/80 leading-relaxed mb-10 max-w-lg">
							Agende um motorista profissional para dirigir o seu carro ou
							para buscar você. Rápido, seguro e confortável, direto do
							celular.
						</p>
						<StoreButtons variant="onBrand" />
					</div>

					<div className="relative overflow-hidden rounded-4xl bg-[#DBEDFF] dark:bg-slate-900 min-h-104 sm:min-h-128 flex justify-center">
						<div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/50 dark:bg-[#0058A3]/20" />
						<PhoneMockup
							src={homeScreenshot}
							alt="Tela inicial do app Chofair"
							preload
							className="absolute top-14 sm:top-16 w-60 sm:w-72"
						/>
					</div>
				</section>

				{/* Selos */}
				<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
					<div className="rounded-4xl border border-slate-200 dark:border-slate-800 px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 text-sm font-medium text-slate-600 dark:text-slate-300">
						<div className="flex items-center gap-2">
							<ShieldCheck className="w-5 h-5 text-[#0058A3] dark:text-sky-400" />
							Motoristas verificados
						</div>
						<div className="flex items-center gap-2">
							<CreditCard className="w-5 h-5 text-[#0058A3] dark:text-sky-400" />
							Pagamento pelo app
						</div>
						<div className="flex items-center gap-2">
							<CalendarClock className="w-5 h-5 text-[#0058A3] dark:text-sky-400" />
							Agendamento antecipado
						</div>
					</div>
				</section>

				{/* Como funciona */}
				<section className="max-w-6xl mx-auto w-full px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
					<div className="order-2 lg:order-1 relative overflow-hidden rounded-4xl bg-slate-100 dark:bg-slate-900 h-120 sm:h-136 flex justify-center">
						<PhoneMockup
							src={solicitacaoScreenshot}
							alt="Tela de nova solicitação do app Chofair"
							className="absolute top-12 w-60 sm:w-72"
						/>
					</div>

					<div className="order-1 lg:order-2">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0058A3] dark:text-sky-400 mb-4">
							Como funciona
						</p>
						<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
							Peça seu Chofair em poucos passos
						</h2>
						<ol className="space-y-7">
							{STEPS.map(({ icon: Icon, title, description }, index) => (
								<li key={title} className="flex gap-5">
									<div className="relative shrink-0">
										<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0058A3]/10 text-[#0058A3] dark:text-sky-400">
											<Icon className="h-5 w-5" />
										</div>
										<span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#0058A3] text-[10px] font-bold text-white">
											{index + 1}
										</span>
									</div>
									<div>
										<h3 className="font-semibold text-lg mb-1">{title}</h3>
										<p className="text-slate-600 dark:text-slate-400 leading-relaxed">
											{description}
										</p>
									</div>
								</li>
							))}
						</ol>
					</div>
				</section>

				{/* Serviços */}
				<section className="bg-slate-50 dark:bg-slate-900/50 py-24">
					<div className="max-w-6xl mx-auto w-full px-6">
						<div className="max-w-2xl mb-12">
							<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0058A3] dark:text-sky-400 mb-4">
								Serviços
							</p>
							<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
								Do jeito que você precisa
							</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{SERVICES.map(({ icon: Icon, title, description }) => (
								<div
									key={title}
									className="rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
									<div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0058A3] text-white">
										<Icon className="h-6 w-6" />
									</div>
									<h3 className="text-xl font-bold mb-2">{title}</h3>
									<p className="text-slate-600 dark:text-slate-400 leading-relaxed">
										{description}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* CTA final */}
				<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-16">
					<div className="rounded-4xl bg-slate-950 dark:bg-slate-900 text-white px-8 py-14 sm:px-16 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
						<div>
							<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
								Baixe o Chofair
							</h2>
							<p className="text-white/70 text-lg">
								Comece a usar em minutos. É grátis para baixar.
							</p>
						</div>
						<StoreButtons variant="onDark" />
					</div>
				</section>
			</main>

			<footer className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
				© {new Date().getFullYear()} Chofair. Todos os direitos reservados.
			</footer>
		</div>
	);
}
