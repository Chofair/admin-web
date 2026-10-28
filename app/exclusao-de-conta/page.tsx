import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import BackToHome from '@/components/marketing/BackToHome';
import LegalPageLayout from '@/components/marketing/LegalPageLayout';
import SupportEmailLink from '@/components/marketing/SupportEmailLink';
import styles from '@/components/marketing/marketing.module.css';

export const metadata: Metadata = {
  title: 'Exclusão de Conta e Dados — Chofair',
  description: 'Saiba como solicitar a exclusão da sua conta Chofair, quais dados são removidos e quais registros podem ser mantidos.',
  icons: { icon: '/brand/chofair-icon.png', apple: '/brand/chofair-icon.png' },
};

const steps = [
  'Abra o aplicativo Chofair e faça login na sua conta.',
  'Toque em "Conta" no menu principal.',
  'Na seção "Preferências e ajuda", toque em "Segurança".',
  'Toque em "Excluir conta".',
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
    <LegalPageLayout
      title="Exclusão de Conta e Dados"
      description="Saiba como solicitar a exclusão da sua conta e o que acontece com seus dados."
    >
      <div className={styles.legalIntro}>
        <p>Aplicativo: <strong>Chofair</strong></p>
        <p>Você pode solicitar a exclusão diretamente pelo aplicativo ou entrar em contato com nosso suporte.</p>
      </div>

      <section className={styles.legalSection} aria-labelledby="exclusao-passos">
        <h2 id="exclusao-passos">Como solicitar a exclusão da conta</h2>
        <p>Você pode solicitar a exclusão da sua conta e dos seus dados diretamente pelo aplicativo Chofair, seguindo os passos abaixo:</p>
        <ol className={styles.legalSteps}>
          {steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className={styles.legalCallout}>
          <p>
            Caso não consiga acessar o aplicativo, você também pode solicitar a exclusão enviando um e-mail para{' '}
            <SupportEmailLink />{' '}a partir do endereço de e-mail cadastrado na conta, informando seu nome completo e CPF para fins de verificação de identidade.
          </p>
        </div>
      </section>

      <section className={styles.legalSection} aria-labelledby="exclusao-dados">
        <h2 id="exclusao-dados">Dados que serão excluídos</h2>
        <p>Ao confirmar a exclusão, os seguintes dados são removidos permanentemente da nossa base em até 30 (trinta) dias:</p>
        <ul className={styles.legalBullets}>
          {dadosExcluidos.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className={styles.legalSection} aria-labelledby="exclusao-retencao">
        <h2 id="exclusao-retencao">Dados que podem ser mantidos e prazo de retenção</h2>
        <p>Alguns dados não são excluídos imediatamente, pois seu armazenamento é exigido por lei ou necessário para o cumprimento de obrigações legais e regulatórias:</p>
        <ul className={styles.legalBullets}>
          {dadosMantidos.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>Esses registros são desvinculados dos seus dados de identificação pessoal sempre que possível e utilizados exclusivamente para os fins acima descritos, sendo excluídos ao término do prazo de retenção aplicável.</p>
      </section>

      <div className={styles.legalClosing}>
        <BackToHome />
        <Link href="/termos" className={styles.legalRelatedLink}>Consultar Termos de Uso <ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
    </LegalPageLayout>
  );
}
