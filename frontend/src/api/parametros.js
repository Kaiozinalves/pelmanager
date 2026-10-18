// Remove parâmetros vazios antes de montar a query string
// (evita mandar "?bairro=&estado=" pro backend).
export function semVazios(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, valor]) => valor !== undefined && valor !== null && String(valor).trim() !== ""
    )
  );
}
