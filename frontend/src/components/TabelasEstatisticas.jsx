// Tabelas de artilharia e assistências. Posições empatadas dividem o mesmo número
// (ex.: 1º, 1º, 3º) para a classificação refletir a regra de contagem.
function calcularPosicoes(linhas) {
  return linhas.map((linha, i) => {
    const primeiroIgual = linhas.findIndex((l) => l.quantidade === linha.quantidade);
    return { ...linha, posicao: primeiroIgual + 1, chave: `${linha.usuarioId}-${i}` };
  });
}

export function TabelaRanking({ titulo, linhas, vazio }) {
  const comPosicao = calcularPosicoes(linhas);

  return (
    <div className="cartao-time">
      <h4 className="cartao-time-titulo">{titulo}</h4>
      {comPosicao.length === 0 ? (
        <p className="texto-suave">{vazio}</p>
      ) : (
        <ol className="tabela-ranking">
          {comPosicao.map((linha) => (
            <li key={linha.chave}>
              <span className="ranking-pos">{linha.posicao}º</span>
              <span className="ranking-nome">{linha.nome || linha.apelido}</span>
              <strong>{linha.quantidade}</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function TabelasEstatisticas({ estatisticas }) {
  if (!estatisticas) {
    return null;
  }

  return (
    <div className="grid-times">
      <TabelaRanking
        titulo="Artilharia"
        linhas={estatisticas.artilharia || []}
        vazio="Nenhum gol registrado ainda."
      />
      <TabelaRanking
        titulo="Assistências"
        linhas={estatisticas.assistencias || []}
        vazio="Nenhuma assistência registrada ainda."
      />
    </div>
  );
}
