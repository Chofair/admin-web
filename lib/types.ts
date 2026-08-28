export type TermsRole = 'user' | 'driver';
export type StatusSolicitacao =
  | 'pendente'
  | 'confirmada'
  | 'em_andamento'
  | 'finalizada'
  | 'concluida'
  | 'cancelada';
export type StatusPagamento = 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED';
export type StatusValidacaoVeiculo =
  | 'pendente_upload'
  | 'pendente_extracao'
  | 'extraido_parcial'
  | 'pendente_revisao'
  | 'aprovado'
  | 'rejeitado';

export interface Profile {
  id: string;
  name: string | null;
  cpf: string | null;
  phone: string | null;
  birthdate: string | null;
  plate: string | null;
  model: string | null;
  year: string | null;
  color: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  estado: string | null;
  cidade: string | null;
  telefone: string | null;
  foto_perfil_url: string | null;
  data_nascimento: string | null;
  push_token: string | null;
  abacatepay_customer_id: string | null;
  is_admin: boolean;
  terms_role: TermsRole | null;
  terms_version_accepted: number | null;
  terms_accepted_at: string | null;
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  created_at?: string;
}

export interface Solicitacao {
  id: string;
  usuario_id: string;
  motorista_id?: string;
  tipo_solicitacao: 'motorista' | 'motorista_carro';
  data_servico: string;
  horario_inicio: string;
  horario_fim: string;
  duracao_horas: number;
  observacoes?: string;
  status: StatusSolicitacao;
  preco_total?: number;
  preco_motorista?: number;
  taxa_por_hora?: number;
  confirmada_em?: string;
  iniciada_em?: string;
  finalizada_em?: string;
  concluida_em?: string;
  cancelado_por?: string;
  motivo_cancelamento?: string;
  cancelado_em?: string;
  created_at: string;
  profiles?: { name?: string; cpf?: string } | null;
  motorista?: { name?: string } | null;
}

export interface Veiculo {
  id: string;
  motorista_id: string;
  placa: string;
  renavam?: string | null;
  modelo: string | null;
  marca?: string | null;
  ano: number | null;
  cor: string | null;
  categoria?: string | null;
  capacidade_passageiros?: number | null;
  ar_condicionado?: boolean | null;
  accessibility_features?: Record<string, unknown> | null;
  crlv_path?: string | null;
  crlv_mime_type?: string | null;
  crlv_uploaded_at?: string | null;
  status_validacao: StatusValidacaoVeiculo;
  campos_pendentes?: string[] | null;
  dados_extraidos_crlv?: Record<string, unknown> | null;
  validado_por?: string | null;
  validado_em?: string | null;
  motivo_rejeicao?: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Pagamento {
  id: string;
  solicitacao_id: string;
  abacatepay_billing_id: string | null;
  mercadopago_payment_id: string | null;
  mercadopago_status_detail: string | null;
  mercadopago_environment: 'sandbox' | 'production' | null;
  url_pagamento: string | null;
  valor_centavos: number;
  status: StatusPagamento;
  tipo_pagamento: 'inicial' | 'excedente';
  chave_idempotencia?: string | null;
  pago_em?: string | null;
  conciliacao_verificada_em?: string | null;
  conciliacao_tentativas: number;
  conciliacao_nao_encontrado_tentativas: number;
  conciliacao_encerrada_em?: string | null;
  conciliacao_motivo?: string | null;
  created_at: string;
}

export type StatusRepasse = 'pendente' | 'pago' | 'cancelado';

export interface RepasseMotorista {
  id: string;
  solicitacao_id: string;
  motorista_id: string;
  valor: number;
  status: StatusRepasse;
  pago_em?: string;
  observacao?: string;
  created_at: string;
}

export interface DocumentoMotorista {
  id: string;
  motorista_id: string;
  tipo_documento: string;
  nome_documento: string;
  arquivo_url: string;
  status_verificacao: 'pendente' | 'aprovado' | 'rejeitado';
  observacoes?: string;
  data_upload: string;
}
