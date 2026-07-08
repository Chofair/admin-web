import LandingHeader from '@/components/LandingHeader';
import Link from 'next/link';

export const metadata = {
  title: 'Exclusão de Conta e Dados — Chofair',
};

const steps = [
  'Abra o aplicativo Chofair e faça login na sua conta.',
  'Toque em "Perfil" no menu principal.',
  'Toque em "Configurações".',
  'Toque em "Excluir Conta".',
  'Confirme a solicitação quando solicitado pelo aplicativo.',
];

const dadosExcluidos = [
  'Nome completo, CPF e data de nascimento.',
  'Telefone e endereço (CEP, logradouro, número, complemento, bairro, cidade e estado).',
  'Foto de perfil.',
  'Token de notificações push do dispositivo.',
  'Dados de veículo cadastrados (placa, modelo, ano e cor), no caso de contas de Motorista Parceiro.',
  'Documentos enviados para verificação de cadastro (ex.: CNH, CRLV e demais comprovantes).',
  'Credenciais de acesso à conta.',
];

const dadosMantidos = [
  'Registros de solicitações/corridas realizadas (datas, horários, status e valores), pelo prazo de até 5 (cinco) anos, conforme o Código de Defesa do Consumidor e a legislação fiscal e tributária aplicável.',
  'Registros de pagamentos e cobranças associados à conta, pelo mesmo prazo, para fins de comprovação fiscal, contábil e prevenção a fraudes.',
  'Registros necessários ao cumprimento de obrigação legal, regulatória ou de ordem judicial, pelo prazo exigido pela norma aplicável.',
];

export default function ExclusaoDeContaPage() {
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
            <h1 className="text-4xl font-extrabold mt-6 mb-3">Exclusão de Conta e Dados</h1>
            <div className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
              <p>Aplicativo: <strong>Chofair</strong></p>
              <p>Desenvolvedor: <strong>[RAZÃO SOCIAL DA EMPRESA]</strong> (CNPJ <strong>[CNPJ]</strong>)</p>
              <p>Contato/Suporte: <a href="mailto:suporte@chofair.com.br" className="text-[#0058A3] hover:underline">suporte@chofair.com.br</a></p>
              <p>Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Steps */}
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wide">
                Como solicitar a exclusão da conta
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Você pode solicitar a exclusão da sua conta e dos seus dados diretamente pelo aplicativo Chofair, seguindo os passos abaixo:
              </p>
              <ol className="space-y-1.5 mb-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Caso não consiga acessar o aplicativo, você também pode solicitar a exclusão enviando um e-mail para{' '}
                <a href="mailto:suporte@chofair.com.br" className="text-[#0058A3] hover:underline">suporte@chofair.com.br</a>{' '}
                a partir do endereço de e-mail cadastrado na conta, informando seu nome completo e CPF para fins de verificação de identidade.
              </p>
            </section>

            <div className="border-b border-slate-200 dark:border-slate-800" />

            {/* Dados excluídos */}
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wide">
                Dados que serão excluídos
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                Ao confirmar a exclusão, os seguintes dados são removidos permanentemente da nossa base em até 30 (trinta) dias:
              </p>
              <ul className="space-y-1.5">
                {dadosExcluidos.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="text-slate-400 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="border-b border-slate-200 dark:border-slate-800" />

            {/* Dados mantidos */}
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wide">
                Dados que podem ser mantidos e prazo de retenção
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                Alguns dados não são excluídos imediatamente, pois seu armazenamento é exigido por lei ou necessário para o cumprimento de obrigações legais e regulatórias:
              </p>
              <ul className="space-y-1.5">
                {dadosMantidos.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="text-slate-400 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
                Esses registros são desvinculados dos seus dados de identificação pessoal sempre que possível e utilizados exclusivamente para os fins acima descritos, sendo excluídos ao término do prazo de retenção aplicável.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Chofair. Todos os direitos reservados.
      </footer>
    </div>
  );
}
