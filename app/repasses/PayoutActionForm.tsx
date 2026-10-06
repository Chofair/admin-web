import { confirmarRepasse, reverterRepasse } from './actions';

export default function PayoutActionForm({
  payoutId,
  status,
}: {
  payoutId: string;
  status: string;
}) {
  if (status === 'pendente') {
    return (
      <form
        action={async () => {
          'use server';
          await confirmarRepasse(payoutId);
        }}
      >
        <button
          type="submit"
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
        >
          Confirmar pagamento
        </button>
      </form>
    );
  }

  if (status === 'pago') {
    return (
      <form
        action={async () => {
          'use server';
          await reverterRepasse(payoutId);
        }}
      >
        <button
          type="submit"
          className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
        >
          Desfazer
        </button>
      </form>
    );
  }

  return null;
}
