import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingHeader() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
			<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
				<Link href="/" className="text-2xl font-bold text-[#0058A3]">Chofair</Link>
				<div className="flex items-center gap-4">
					<nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
						<a
							href="#como-funciona"
							className="hover:text-slate-900 dark:hover:text-white transition-colors">
							Como funciona
						</a>
						<a
							href="#vantagens"
							className="hover:text-slate-900 dark:hover:text-white transition-colors">
							Vantagens
						</a>
						<a
							href="#motoristas"
							className="hover:text-slate-900 dark:hover:text-white transition-colors">
							Motoristas
						</a>
						<a
							href="#contato"
							className="hover:text-slate-900 dark:hover:text-white transition-colors">
							Contato
						</a>
						<a
							href="/aplicativo"
							className="hover:text-slate-900 dark:hover:text-white transition-colors">
							Aplicativo
						</a>
					</nav>
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
