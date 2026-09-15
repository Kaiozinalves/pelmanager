export const POSICOES = [
  { valor: "GOLEIRO", rotulo: "Goleiro" },
  { valor: "ZAGUEIRO", rotulo: "Zagueiro" },
  { valor: "LATERAL", rotulo: "Lateral" },
  { valor: "MEIO_CAMPO", rotulo: "Meio-campo" },
  { valor: "ATACANTE", rotulo: "Atacante" },
];

export const PERNAS = [
  { valor: "DESTRO", rotulo: "Destro" },
  { valor: "CANHOTO", rotulo: "Canhoto" },
  { valor: "AMBIDESTRO", rotulo: "Ambidestro" },
];

// Extrai a mensagem de erro do backend. As exceções customizadas (via
// GlobalExceptionHandler) devolvem `{ mensagem: "..." }`; erros não tratados
// caem no formato padrão do Spring, que pode vir como `message`.
export function extrairMensagemErro(err, fallback) {
  return err.response?.data?.mensagem || err.response?.data?.message || fallback;
}
