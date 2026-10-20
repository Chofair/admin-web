import Image, { type StaticImageData } from 'next/image';
import {
	Accessibility,
	CalendarClock,
	CarFront,
	CreditCard,
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

const FEATURES = [
	{
		icon: UserRound,
		title: 'Só Motorista',
		description: 'Um motorista profissional dirigindo o seu próprio veículo.',
	},
	{
		icon: CarFront,
		title: 'Motorista + Carro',
		description: 'O motorista leva o veículo até você.',
	},
	{
		icon: CalendarClock,
		title: 'Agende com antecedência',
		description: 'Escolha data, horário de início e fim do serviço.',
	},
	{
		icon: Accessibility,
		title: 'Acessibilidade',
		description: 'Veículos adaptados com preço por trecho.',
	},
];

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
			className={`rounded-[2.75rem] bg-slate-900 p-2.5 shadow-2xl shadow-slate-900/30 ring-1 ring-slate-900/10 dark:ring-white/10 ${className}`}>
			<div className="relative overflow-hidden rounded-[2.25rem] bg-slate-800">
				<Image
					src={src}
					alt={alt}
					placeholder="blur"
					preload={preload}
					sizes="(min-width: 1024px) 288px, 240px"
					className="block h-auto w-full"
				/>
			</div>
			{/* Dynamic Island */}
			<div className="absolute top-4 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
		</div>
	);
}

export default function AplicativoPage() {
	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
			<LandingHeader />

			<main className="relative flex-1 overflow-hidden pt-20">
				{/* Background */}
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute -top-40 right-[-10%] h-144 w-144 rounded-full bg-[#0058A3]/15 blur-3xl dark:bg-[#0058A3]/25" />
					<div className="absolute -bottom-48 left-[-10%] h-112 w-112 rounded-full bg-sky-400/10 blur-3xl" />
				</div>

				<section className="relative max-w-6xl mx-auto w-full px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-16 items-center">
					{/* Left: text + buttons */}
					<div className="text-center lg:text-left">
						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
							Chofair no seu{' '}
							<span className="bg-linear-to-r from-[#0058A3] to-sky-500 bg-clip-text text-transparent">
								bolso
							</span>
						</h1>

						<p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
							Solicite um motorista particular de forma rápida, segura e
							confortável. Baixe agora e comece a usar em minutos.
						</p>

						<div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
							{/* App Store */}
							<a
								href={APP_STORE_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 hover:shadow-xl transition-all">
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
									<p className="text-base font-semibold leading-none">
										App Store
									</p>
								</div>
							</a>

							{/* Google Play */}
							<a
								href={PLAY_STORE_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-[#0058A3] text-white shadow-lg shadow-[#0058A3]/25 hover:bg-[#0069C0] hover:-translate-y-0.5 hover:shadow-xl transition-all">
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
									<p className="text-base font-semibold leading-none">
										Google Play
									</p>
								</div>
							</a>
						</div>

						<div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-600 dark:text-slate-400">
							<div className="flex items-center gap-2">
								<ShieldCheck className="w-5 h-5 text-[#0058A3] dark:text-sky-400" />
								Motoristas verificados
							</div>
							<div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
							<div className="flex items-center gap-2">
								<CreditCard className="w-5 h-5 text-[#0058A3] dark:text-sky-400" />
								Pagamento pelo app
							</div>
						</div>
					</div>

					{/* Right: app screenshots */}
					<div className="relative mx-auto flex w-full max-w-md items-start justify-center lg:max-w-none">
						<PhoneMockup
							src={solicitacaoScreenshot}
							alt="Tela de nova solicitação do app Chofair"
							className="hidden sm:block absolute left-0 top-12 w-56 lg:w-60 -rotate-6 opacity-90"
						/>
						<PhoneMockup
							src={homeScreenshot}
							alt="Tela inicial do app Chofair"
							preload
							className="relative z-10 w-60 lg:w-72 sm:translate-x-16 lg:translate-x-20"
						/>
					</div>
				</section>

				{/* Features */}
				<section className="relative max-w-6xl mx-auto w-full px-6 pb-20">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{FEATURES.map(({ icon: Icon, title, description }) => (
							<div
								key={title}
								className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-5">
								<div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0058A3]/10 text-[#0058A3] dark:text-sky-400">
									<Icon className="h-5 w-5" />
								</div>
								<h3 className="font-semibold mb-1">{title}</h3>
								<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
									{description}
								</p>
							</div>
						))}
					</div>
				</section>
			</main>

			<footer className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
				© {new Date().getFullYear()} Chofair. Todos os direitos reservados.
			</footer>
		</div>
	);
}
