// Alíquota estimada sobre a receita bruta da Chofair, igual para todas as verticais.
export const CHOFAIR_ESTIMATED_TAX_RATE = 0.155;

export type RequestFinancialInput = {
  preco_total: number | null;
  preco_final: number | null;
  preco_motorista: number | null;
  preco_motorista_final: number | null;
};

export type RequestFinancialSplit = {
  clientTotal: number;
  driverTotal: number;
  chofairGross: number;
  chofairTax: number;
  chofairNet: number;
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// A Chofair fica com a diferença entre o que o cliente paga e o que o motorista recebe,
// incluindo a participação no excedente e no percurso adicional. Os campos
// preco_chofair_* gravados na solicitação refletem só a cotação inicial.
export function requestFinancialSplit(
  request: RequestFinancialInput,
): RequestFinancialSplit | null {
  const clientTotal = request.preco_final ?? request.preco_total;
  const driverTotal = request.preco_motorista_final ?? request.preco_motorista;
  if (clientTotal == null || driverTotal == null) return null;

  const chofairGross = roundCurrency(clientTotal - driverTotal);
  const chofairTax = roundCurrency(chofairGross * CHOFAIR_ESTIMATED_TAX_RATE);

  return {
    clientTotal: roundCurrency(clientTotal),
    driverTotal: roundCurrency(driverTotal),
    chofairGross,
    chofairTax,
    chofairNet: roundCurrency(chofairGross - chofairTax),
  };
}
