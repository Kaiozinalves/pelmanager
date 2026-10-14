import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";
import { Select } from "./Input";
import { buscarVotacao, votar } from "../api/votacao";
import { encerrarVotacao } from "../api/rodada";
import { extrairMensagemErro } from "../constants/enums";

const nomeDe = (jogador) => jogador?.nome || jogador?.apelido || "";

function formatarPrazo(prazo) {
  if (!prazo) return "";
  return new Date(prazo).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function ResultadoCategoria({ resultado }) {
  if (resultado.totalVotos === 0) {
    return <p className="texto-suave">Ninguém votou nesta categoria.</p>;
  }

  return (
    <div className="resultado-categoria">
      <p>
        {resultado.empate ? "Empate — dividem a vitória: " : "Vencedor: "}
        <strong>{resultado.vencedores.map((v) => nomeDe(v)).join(", ")}</strong>
      </p>
      <ul className="tabela-ranking">
        {resultado.ranking.map((linha) => (
          <li key={linha.usuarioId}>
            <span className="ranking-nome">{nomeDe(linha)}</span>
            <strong>
              {linha.votos} {linha.votos === 1 ? "voto" : "votos"}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Votação de fim de rodada (melhor, bagre, revelação — conforme a config do grupo).
// Um voto por pessoa e categoria, sem votar em si mesmo, só entre confirmados.
// O resultado é anônimo e só aparece quando a votação encerra (prazo ou admin) ou
// quando todos já votaram naquela categoria.
export function VotacaoRodada({ rodadaId, usuarioId, ehAdmin }) {
  const [votacao, setVotacao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [escolhas, setEscolhas] = useState({});
  const [votandoCategoria, setVotandoCategoria] = useState(null);
  const [encerrando, setEncerrando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const dados = await buscarVotacao(rodadaId, usuarioId);
      setVotacao(dados);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível carregar a votação."));
    }
  }, [rodadaId, usuarioId]);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  async function aoVotar(categoria) {
    const votadoId = escolhas[categoria];
    if (!votadoId) {
      setErro("Escolha um jogador antes de votar.");
      return;
    }
    setErro(null);
    setVotandoCategoria(categoria);
    try {
      await votar(rodadaId, { votanteId: usuarioId, categoria, votadoId: Number(votadoId) });
      await carregar();
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível registrar seu voto agora."));
      await carregar();
    } finally {
      setVotandoCategoria(null);
    }
  }

  async function aoEncerrar() {
    setErro(null);
    setEncerrando(true);
    try {
      await encerrarVotacao(rodadaId, usuarioId);
      await carregar();
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível encerrar a votação agora."));
    } finally {
      setEncerrando(false);
    }
  }

  const aberta = votacao?.situacao === "ABERTA";
  const categorias = votacao?.categorias || [];
  const pendentes = categorias.filter((c) => !c.jaVotei);

  return (
    <section className="painel">
      <div className="rodada-cabecalho">
        <h3 className="subtitulo-secao">Votação da rodada</h3>
        <Button variante="secundario" onClick={carregar}>
          Atualizar
        </Button>
      </div>

      {erro && (
        <p className="mensagem-erro" role="alert">
          {erro}
        </p>
      )}

      {carregando && <p className="texto-suave">Carregando…</p>}

      {!carregando && votacao && (
        <>
          <p className="texto-suave">
            {aberta
              ? `Votação aberta até ${formatarPrazo(votacao.prazo)}.`
              : `Votação encerrada${votacao.prazo ? ` em ${formatarPrazo(votacao.prazo)}` : ""}.`}{" "}
            Seu voto é secreto: o resultado mostra só os totais.
          </p>

          {categorias.length === 0 && (
            <p className="texto-suave">
              Nenhuma categoria de votação estava ativa quando essa rodada terminou. Um admin pode
              ativar categorias na página da pelada (vale para as próximas rodadas).
            </p>
          )}

          {aberta && categorias.length > 0 && !votacao.elegivel && (
            <p className="texto-suave">
              Só quem confirmou presença nessa rodada pode votar.
            </p>
          )}

          {aberta && votacao.elegivel && (
            <p className={pendentes.length > 0 ? "aviso-pendente" : "mensagem-sucesso"}>
              {pendentes.length > 0
                ? `Falta você votar em: ${pendentes.map((c) => c.rotulo).join(", ")}.`
                : "Você já votou em todas as categorias. Obrigado!"}
            </p>
          )}

          <ul className="lista-avaliacao">
            {categorias.map((categoria) => (
              <li key={categoria.categoria} className="item-votacao">
                <div className="item-votacao-cabecalho">
                  <span className="item-avaliacao-nome">{categoria.rotulo}</span>
                  <span className="texto-suave texto-suave--nota">
                    {categoria.votosRecebidos} de {categoria.totalEleitores} votos
                  </span>
                </div>

                {aberta && votacao.elegivel && (
                  <>
                    {categoria.jaVotei ? (
                      <span className="badge-checkin badge-checkin--confirmado">Voto registrado</span>
                    ) : (
                      <div className="item-avaliacao-form">
                        <Select
                          id={`voto-${categoria.categoria}`}
                          label="Seu voto"
                          value={escolhas[categoria.categoria] || ""}
                          onChange={(e) =>
                            setEscolhas((atual) => ({ ...atual, [categoria.categoria]: e.target.value }))
                          }
                        >
                          <option value="">Selecione…</option>
                          {votacao.candidatos.map((c) => (
                            <option key={c.usuarioId} value={c.usuarioId}>
                              {nomeDe(c)}
                            </option>
                          ))}
                        </Select>
                        <Button
                          carregando={votandoCategoria === categoria.categoria}
                          onClick={() => aoVotar(categoria.categoria)}
                        >
                          Votar
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {categoria.resultado ? (
                  <ResultadoCategoria resultado={categoria.resultado} />
                ) : (
                  <p className="texto-suave texto-suave--nota">
                    O resultado aparece quando a votação encerrar ou quando todos votarem.
                  </p>
                )}
              </li>
            ))}
          </ul>

          {ehAdmin && aberta && (
            <div className="linha-acoes linha-acoes--espaco">
              <Button variante="secundario" carregando={encerrando} onClick={aoEncerrar}>
                Encerrar votação agora
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
