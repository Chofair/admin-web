import NavBar from '@/components/NavBar';

export default function GoogleMapsLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar>
      <main
        aria-busy="true"
        aria-label="Carregando monitoramento Google Maps"
        className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 sm:py-10"
      >
        <div className="h-8 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-8 h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-80 rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
        <div className="mt-10 h-72 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </main>
    </NavBar></div>
  );
}
