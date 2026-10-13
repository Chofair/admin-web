import Image from 'next/image';
import LandingHeader from '@/components/LandingHeader';

const APP_STORE_URL =
	'https://apps.apple.com/br/app/chofair/id6788883015?l=en-GB';
const PLAY_STORE_URL = '';

export default function AplicativoPage() {
	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
			<LandingHeader />

			{/* Hero */}
			<main className="flex-1 flex items-center pt-20">
				<div className="max-w-6xl mx-auto w-full px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
					{/* Left: text + buttons */}
					<div>
						<div className="inline-flex items-center gap-2 bg-[#0058A3]/10 border border-[#0058A3]/20 rounded-full px-4 py-1.5 mb-6">
							<span className="w-2 h-2 rounded-full bg-[#0058A3] animate-pulse" />
							<span className="text-[#0058A3] text-sm font-medium">
								Disponível para iOS e Android
							</span>
						</div>

						<h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
							Chofair no seu <span className="text-[#0058A3]">bolso</span>
						</h1>

						<p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-10 max-w-md">
							Solicite um motorista particular de forma rápida, segura e
							confortável. Baixe agora e comece a usar em minutos.
						</p>

						<div className="flex flex-col sm:flex-row gap-3 max-w-sm">
							{/* App Store */}
							<a
								href={APP_STORE_URL || '#'}
								target="_blank"
								rel="noopener noreferrer"
								className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white transition-colors ${!APP_STORE_URL ? 'opacity-40 pointer-events-none' : ''}`}>
								<svg
									viewBox="0 0 24 24"
									className="w-7 h-7 shrink-0 fill-current"
									xmlns="http://www.w3.org/2000/svg">
									<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
								</svg>
								<div>
									<p className="text-[10px] font-normal opacity-60 leading-none mb-0.5 uppercase tracking-wide">
										Disponível na
									</p>
									<p className="text-sm font-bold leading-none">App Store</p>
								</div>
							</a>

							{/* Google Play */}
							<a
								href={PLAY_STORE_URL || '#'}
								target="_blank"
								rel="noopener noreferrer"
								className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0058A3] hover:bg-[#0069C0] text-white transition-colors ${!PLAY_STORE_URL ? 'opacity-40 pointer-events-none' : ''}`}>
								<svg
									viewBox="0 0 24 24"
									className="w-7 h-7 shrink-0 fill-current"
									xmlns="http://www.w3.org/2000/svg">
									<path d="M3.18 23.76c.35.19.74.24 1.14.12L14.9 12.24 11.1 8.4 3.18 23.76zm17.26-11.1L17.6 11.1l-3.14 1.82 3.17 3.17 2.82-1.64c.8-.47.8-1.31-.01-1.79zM3 1.13c-.09.29-.09.63 0 1.02v20.52c.01.13.03.26.06.37L14.37 12 3 1.13zM14.9 11.76L4.32.24C3.92.12 3.53.17 3.18.4L14.9 11.76z" />
								</svg>
								<div>
									<p className="text-[10px] font-normal opacity-60 leading-none mb-0.5 uppercase tracking-wide">
										Disponível no
									</p>
									<p className="text-sm font-bold leading-none">Google Play.</p>
								</div>
							</a>
						</div>

						<div className="mt-10 flex items-center gap-6">
							{/* <div className="text-center">
								<p className="text-2xl font-extrabold text-[#0058A3]">4.9★</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									Avaliação
								</p>
							</div>
							<div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
							<div className="text-center">
								<p className="text-2xl font-extrabold text-[#0058A3]">+10k</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									Downloads
								</p>
							</div> */}
							<div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
							<div className="text-center">
								<p className="text-2xl font-extrabold text-[#0058A3]">24/7</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									Disponível
								</p>
							</div>
						</div>
					</div>

					{/* Right: app screenshot */}
					<div className="flex justify-center lg:justify-end">
						<div className="relative">
							{/* Glow behind phone */}
							<div className="absolute inset-0 bg-[#0058A3]/20 rounded-[3rem] blur-3xl scale-90" />

							{/* Phone frame */}
							<div className="relative w-64 sm:w-72 bg-slate-900 rounded-[3rem] p-3 shadow-2xl ring-1 ring-white/10">
								<div className="w-full aspect-9/19.5 rounded-[2.5rem] overflow-hidden bg-slate-800 flex items-center justify-center">
									{/* Substitua /app-screenshot.png pela sua imagem em /public */}
									<Image
										src="/app-screenshot.png"
										alt="Chofair app"
										width={280}
										height={607}
										className="w-full h-full object-cover"
									/>
								</div>
								{/* Notch */}
								<div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full" />
							</div>
						</div>
					</div>
				</div>
			</main>

			<footer className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
				© {new Date().getFullYear()} Chofair. Todos os direitos reservados.
			</footer>
		</div>
	);
}
