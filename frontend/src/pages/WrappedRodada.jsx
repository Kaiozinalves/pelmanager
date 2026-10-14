import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { buscarDetalhesGrupo } from "../api/grupo";
import { listarCheckinsDaRodada } from "../api/checkin";
import { estatisticasDaRodada, rankingTemporada } from "../api/gol";
import { listarAvaliacoesDaRodada, avaliarJogador } from "../api/avaliacao";
import { buscarVotacao, votar } from "../api/votacao";
import { extrairMensagemErro } from "../constants/enums";

const CATEGORIAS_ORDEM = ["MELHOR_JOGADOR", "MELHOR_ASSISTENTE", "BAGRE"];

const ROTULOS = {
  MELHOR_JOGADOR: "Melhor jogador da rodada",
  MELHOR_ASSISTENTE: "Melhor assistente da rodada",
  BAGRE: "Bagre da rodada",
};

const NOMES_STORIES = ["Notas da rodada", "Prêmios", "Destaques da rodada", "Temporada"];

const nomeDe = (jogador) => jogador?.nome || jogador?.apelido || "Jogador";

function PremioIcone({ categoria }) {
  if (categoria === "MELHOR_JOGADOR") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="ouro-bola" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#fff2a6" />
            <stop offset="1" stopColor="#d39818" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="25" fill="url(#ouro-bola)" stroke="#936511" strokeWidth="2" />
        <path d="m32 20 8 6-3 10h-10l-3-10 8-6Zm-8 6-9-2m2 16 10-4m16-10 9-2m-2 16-10-4M32 36v17m-8-27-5-9m22 9 5-9m-23 23-8 6m27-6 8 6" fill="none" stroke="#946b19" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (categoria === "MELHOR_ASSISTENTE") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="ouro-chuteira" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#fff2a6" />
            <stop offset="1" stopColor="#c68a13" />
          </linearGradient>
        </defs>
        <path d="M11 41c8-1 12-5 15-16l9 3c2 9 8 13 17 15l5 4v7H11v-9l4-4-4 0Z" fill="url(#ouro-chuteira)" stroke="#936511" strokeWidth="2" strokeLinejoin="round" />
        <path d="m29 29 11 7m-15-1 11 7m-25 7h45" fill="none" stroke="#946b19" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="ouro-bagre" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff2a6" />
          <stop offset="1" stopColor="#bd7e12" />
        </linearGradient>
      </defs>
      <path d="M14 32c8-13 26-16 37-5l8-8v26l-8-8c-11 11-29 8-37-5Z" fill="url(#ouro-bagre)" stroke="#936511" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="42" cy="29" r="2" fill="#493811" />
      <path d="M28 22c-1-7-6-9-9-8m12 8c1-7 6-9 9-8m-22 16-9-4m9 10-9 4" fill="none" stroke="#936511" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TabelaStory({ titulo, linhas, unidade, ranking = false }) {
  const posicaoPorJogador = useMemo(
    () => new Map((linhas || []).map((linha) => [linha.usuarioId, linha.posicao])),
    [linhas]
  );

  return (
    <section className="wrapped-tabela">
      <h3>{titulo}</h3>
      {!linhas?.length ? (
        <p className="wrapped-vazio">Ainda não há dados para este ranking.</p>
      ) : (
        <ol>
          {linhas.slice(0, 5).map((linha, indice) => {
            const posicao = linha.posicao ?? posicaoPorJogador.get(linha.usuarioId) ?? indice + 1;
            const tendencia = {
              SUBIU: ["↑", "Subiu"],
              DESCEU: ["↓", "Desceu"],
              MANTEVE: ["↔", "Manteve"],
              NOVO: ["✦", "Estreou no ranking"],
            }[linha.movimento];

            return (
              <li key={linha.usuarioId}>
                <span className="wrapped-posicao">{posicao}º</span>
                <span className="wrapped-jogador">{nomeDe(linha)}</span>
                {ranking && tendencia && (
                  <span className={`wrapped-tendencia wrapped-tendencia--${linha.movimento.toLowerCase()}`} aria-label={tendencia[1]} title={tendencia[1]}>
                    {tendencia[0]}
                  </span>
                )}
                <strong>{linha.quantidade} {unidade}</strong>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function WrappedRodada() {
  const { grupoId, rodadaId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const rodadaIdNum = Number(rodadaId);
  const grupoIdNum = Number(grupoId);

  const [story, setStory] = useState(0);
  const [grupo, setGrupo] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [votacao, setVotacao] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [temporada, setTemporada] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [jogadorIndex, setJogadorIndex] = useState(0);
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [salvandoNota, setSalvandoNota] = useState(false);
  const [escolhas, setEscolhas] = useState({});
  const [salvandoVotos, setSalvandoVotos] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const [dadosGrupo, dadosCheckins, dadosAvaliacoes, dadosVotacao, dadosEstatisticas, dadosTemporada] = await Promise.all([
        buscarDetalhesGrupo(grupoIdNum),
        listarCheckinsDaRodada(rodadaIdNum),
        listarAvaliacoesDaRodada(rodadaIdNum),
        buscarVotacao(rodadaIdNum, usuario.id),
        estatisticasDaRodada(rodadaIdNum),
        rankingTemporada(grupoIdNum, rodadaIdNum),
      ]);
      setGrupo(dadosGrupo);
      setCheckins(dadosCheckins);
      setAvaliacoes(dadosAvaliacoes);
      setVotacao(dadosVotacao);
      setEstatisticas(dadosEstatisticas);
      setTemporada(dadosTemporada);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível montar o Wrapped desta rodada."));
    } finally {
      setCarregando(false);
    }
  }, [grupoIdNum, rodadaIdNum, usuario.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const rodada = grupo?.rodadas?.find((item) => item.id === rodadaIdNum);
  const confirmados = useMemo(
    () => checkins.filter((checkin) => checkin.statusCheckIn === "CONFIRMADO"),
    [checkins]
  );
  const podeVotar = votacao?.elegivel === true;
  const jogadoresParaAvaliar = useMemo(
    () => confirmados.filter((jogador) => jogador.usuarioId !== usuario.id),
    [confirmados, usuario.id]
  );
  const minhasAvaliacoes = useMemo(
    () => new Map(
      avaliacoes
        .filter((avaliacao) => avaliacao.avaliadorId === usuario.id)
        .map((avaliacao) => [avaliacao.avaliadoId, avaliacao])
    ),
    [avaliacoes, usuario.id]
  );
  const jogadorAtual = jogadoresParaAvaliar[jogadorIndex] || null;
  const avaliacaoAtual = jogadorAtual ? minhasAvaliacoes.get(jogadorAtual.usuarioId) : null;
  const avaliados = jogadoresParaAvaliar.filter((jogador) => minhasAvaliacoes.has(jogador.usuarioId)).length;
  const categorias = useMemo(() => {
    const disponiveis = votacao?.categorias || [];
    return CATEGORIAS_ORDEM
      .map((categoria) => disponiveis.find((item) => item.categoria === categoria))
      .filter(Boolean);
  }, [votacao]);
  const pendentes = categorias.filter((categoria) => !categoria.jaVotei);
  const votacaoAberta = votacao?.situacao === "ABERTA";
  const rodadaAvaliada = !podeVotar || jogadoresParaAvaliar.length === 0 || avaliados === jogadoresParaAvaliar.length;
  const votosRegistrados = !podeVotar || !votacaoAberta || pendentes.every((categoria) => escolhas[categoria.categoria]);

  useEffect(() => {
    setNotaSelecionada(avaliacaoAtual?.nota ?? null);
  }, [avaliacaoAtual?.nota, jogadorAtual?.usuarioId]);

  async function salvarNota() {
    if (!jogadorAtual || !notaSelecionada) return;
    setErro(null);
    setSalvandoNota(true);
    try {
      const novaAvaliacao = await avaliarJogador({
        rodadaId: rodadaIdNum,
        avaliadorId: usuario.id,
        avaliadoId: jogadorAtual.usuarioId,
        nota: Number(notaSelecionada),
        comentario: null,
      });
      setAvaliacoes((atuais) => [...atuais, novaAvaliacao]);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível salvar sua nota."));
      await carregar();
    } finally {
      setSalvandoNota(false);
    }
  }

  async function salvarVotos() {
    const semEscolha = pendentes.find((categoria) => !escolhas[categoria.categoria]);
    if (semEscolha) {
      setErro(`Escolha alguém para ${semEscolha.rotulo.toLowerCase()}.`);
      return;
    }
    setErro(null);
    setSalvandoVotos(true);
    try {
      for (const categoria of pendentes) {
        await votar(rodadaIdNum, {
          votanteId: usuario.id,
          categoria: categoria.categoria,
          votadoId: Number(escolhas[categoria.categoria]),
        });
      }
      await carregar();
    } catch (err) {
      setErro(extrairMensagemErro(err, "Alguns votos podem ter sido salvos. Atualizei seu estado para você continuar."));
      await carregar();
    } finally {
      setSalvandoVotos(false);
    }
  }

  function proximaStory() {
    if (story === 0 && !rodadaAvaliada) {
      setErro("Dê uma nota a todos os jogadores confirmados antes de continuar.");
      return;
    }
    if (story === 1 && !votosRegistrados) {
      setErro("Registre seu voto em cada categoria ativa antes de continuar.");
      return;
    }
    setErro(null);
    setStory((atual) => Math.min(atual + 1, NOMES_STORIES.length - 1));
  }

  function jogadorSeguinte() {
    setJogadorIndex((atual) => Math.min(atual + 1, jogadoresParaAvaliar.length - 1));
  }

  function jogadorAnterior() {
    setJogadorIndex((atual) => Math.max(0, atual - 1));
  }

  const resultadosVotacao = votacao?.categorias || [];
  const resultadoDe = (categoria) => resultadosVotacao.find((item) => item.categoria === categoria);

  if (carregando) {
    return <main className="wrapped-carregando">Preparando o Wrapped…</main>;
  }

  if (erro && !grupo) {
    return (
      <main className="wrapped-carregando">
        <p className="mensagem-erro" role="alert">{erro}</p>
        <Button variante="secundario" onClick={() => navigate(`/grupos/${grupoId}/rodadas/${rodadaId}`)}>
          Voltar à rodada
        </Button>
      </main>
    );
  }

  if (!rodada || rodada.status !== "FINALIZADA") {
    return (
      <main className="wrapped-carregando">
        <p>O Wrapped estará disponível quando a rodada for finalizada.</p>
        <Button variante="secundario" onClick={() => navigate(`/grupos/${grupoId}/rodadas/${rodadaId}`)}>
          Voltar à rodada
        </Button>
      </main>
    );
  }

  return (
    <main className="wrapped-pagina">
      <header className="wrapped-cabecalho">
        <Link to={`/grupos/${grupoId}/rodadas/${rodadaId}`} aria-label="Fechar Wrapped">×</Link>
        <div className="wrapped-progresso" aria-label={`Story ${story + 1} de ${NOMES_STORIES.length}`}>
          {NOMES_STORIES.map((nome, indice) => (
            <span key={nome} className={indice <= story ? "wrapped-progresso-etapa wrapped-progresso-etapa--ativa" : "wrapped-progresso-etapa"} />
          ))}
        </div>
        <span>{story + 1}/{NOMES_STORIES.length}</span>
      </header>

      <article className="wrapped-story" key={story}>
        <p className="wrapped-eyebrow">{grupo.nome} · Rodada de {rodada.data?.split("-").reverse().join("/")}</p>

        {story === 0 && (
          <section className="wrapped-conteudo wrapped-animacao" aria-labelledby="story-notas">
            <div className="wrapped-kicker">Story 1 · avaliação da rodada</div>
            <h1 id="story-notas">Como foi o jogo?</h1>
            <p className="wrapped-intro">Dê uma nota de 1 a 5 para cada jogador confirmado. Suas notas são privadas.</p>

            {!podeVotar ? (
              <div className="wrapped-aviso">Só quem confirmou presença nesta rodada pode avaliar os jogadores.</div>
            ) : jogadoresParaAvaliar.length === 0 ? (
              <div className="wrapped-aviso">Não há outros jogadores para avaliar nesta rodada.</div>
            ) : (
              <>
                <div className="wrapped-nota-progresso">{avaliados} de {jogadoresParaAvaliar.length} avaliados</div>
                <div className="wrapped-jogador-card">
                  <span className="wrapped-avatar">{nomeDe(jogadorAtual).slice(0, 1).toUpperCase()}</span>
                  <span className="wrapped-jogador-posicao">Jogador {jogadorIndex + 1} de {jogadoresParaAvaliar.length}</span>
                  <h2>{nomeDe(jogadorAtual)}</h2>
                  <div className="wrapped-notas" role="group" aria-label={`Nota para ${nomeDe(jogadorAtual)}`}>
                    {[1, 2, 3, 4, 5].map((nota) => (
                      <button
                        key={nota}
                        type="button"
                        className={Number(notaSelecionada) === nota ? "wrapped-nota wrapped-nota--selecionada" : "wrapped-nota"}
                        onClick={() => !avaliacaoAtual && setNotaSelecionada(nota)}
                        disabled={Boolean(avaliacaoAtual)}
                        aria-pressed={Number(notaSelecionada) === nota}
                      >
                        {nota}
                      </button>
                    ))}
                  </div>
                  {avaliacaoAtual ? (
                    <p className="wrapped-ja-votou">Sua nota: {avaliacaoAtual.nota}/5</p>
                  ) : (
                    <Button carregando={salvandoNota} disabled={!notaSelecionada} onClick={salvarNota}>
                      Salvar nota
                    </Button>
                  )}
                </div>
                <div className="wrapped-nav-jogadores">
                  <Button variante="secundario" disabled={jogadorIndex === 0} onClick={jogadorAnterior}>Anterior</Button>
                  <Button variante="secundario" disabled={jogadorIndex >= jogadoresParaAvaliar.length - 1} onClick={jogadorSeguinte}>Próximo jogador</Button>
                </div>
              </>
            )}
          </section>
        )}

        {story === 1 && (
          <section className="wrapped-conteudo wrapped-animacao" aria-labelledby="story-premios">
            <div className="wrapped-kicker">Story 2 · escolha os destaques</div>
            <h1 id="story-premios">Quem merece o prêmio?</h1>
            <p className="wrapped-intro">Escolha um jogador em cada categoria ativa. Os votos são secretos.</p>

            {!podeVotar ? (
              <div className="wrapped-aviso">Só quem confirmou presença pode votar nesta rodada.</div>
            ) : !votacaoAberta ? (
              <div className="wrapped-aviso">A votação está encerrada. Avance para ver os resultados.</div>
            ) : categorias.length === 0 ? (
              <div className="wrapped-aviso">Nenhuma categoria estava ativa quando esta rodada foi finalizada.</div>
            ) : (
              <>
                <div className="wrapped-premios-lista">
                  {categorias.map((categoria) => (
                    <section className="wrapped-premio" key={categoria.categoria}>
                      <div className="wrapped-premio-titulo">
                        <span className="wrapped-premio-icone"><PremioIcone categoria={categoria.categoria} /></span>
                        <div>
                          <h2>{ROTULOS[categoria.categoria] || categoria.rotulo}</h2>
                          <span>{categoria.jaVotei ? "Voto registrado" : "Escolha um jogador"}</span>
                        </div>
                      </div>
                      {categoria.jaVotei ? (
                        <span className="wrapped-ja-votou">Voto secreto registrado ✓</span>
                      ) : (
                        <div className="wrapped-escolhas">
                          {votacao.candidatos.map((candidato) => (
                            <button
                              type="button"
                              key={candidato.usuarioId}
                              className={String(escolhas[categoria.categoria]) === String(candidato.usuarioId) ? "wrapped-escolha wrapped-escolha--ativa" : "wrapped-escolha"}
                              onClick={() => setEscolhas((atual) => ({ ...atual, [categoria.categoria]: candidato.usuarioId }))}
                              aria-pressed={String(escolhas[categoria.categoria]) === String(candidato.usuarioId)}
                            >
                              {nomeDe(candidato)}
                            </button>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
                {pendentes.length > 0 && (
                  <Button carregando={salvandoVotos} disabled={pendentes.some((categoria) => !escolhas[categoria.categoria])} onClick={salvarVotos}>
                    Registrar meus votos
                  </Button>
                )}
              </>
            )}
          </section>
        )}

        {story === 2 && (
          <section className="wrapped-conteudo wrapped-animacao" aria-labelledby="story-rodada">
            <div className="wrapped-kicker">Story 3 · placar da noite</div>
            <h1 id="story-rodada">Destaques da rodada</h1>
            <div className="wrapped-premiados-grid">
              {CATEGORIAS_ORDEM.map((categoria) => {
                const categoriaVoto = resultadoDe(categoria);
                if (!categoriaVoto) return null;
                return (
                  <section className={`wrapped-premiado-card wrapped-premiado-card--${categoria.toLowerCase()}`} key={categoria}>
                    <span className="wrapped-premiado-icone"><PremioIcone categoria={categoria} /></span>
                    <span>{ROTULOS[categoria]}</span>
                    {categoriaVoto.resultado ? (
                      categoriaVoto.resultado.totalVotos === 0 ? <strong>Sem votos</strong> : (
                        <strong>{categoriaVoto.resultado.vencedores.map(nomeDe).join(", ")}</strong>
                      )
                    ) : (
                      <small>Resultado liberado ao final da votação</small>
                    )}
                  </section>
                );
              })}
            </div>
            <div className="wrapped-stats-grid">
              <TabelaStory titulo="Artilharia" linhas={estatisticas?.artilharia} unidade="gols" />
              <TabelaStory titulo="Assistências" linhas={estatisticas?.assistencias} unidade="AST" />
            </div>
          </section>
        )}

        {story === 3 && (
          <section className="wrapped-conteudo wrapped-animacao" aria-labelledby="story-temporada">
            <div className="wrapped-kicker">Story 4 · corrida do ano</div>
            <h1 id="story-temporada">Temporada {temporada?.ano || rodada.data?.slice(0, 4)}</h1>
            <p className="wrapped-intro">Top 5 acumulado até esta rodada. As setas mostram a mudança desde a rodada anterior.</p>
            <div className="wrapped-stats-grid">
              <TabelaStory titulo="Melhor jogador" linhas={temporada?.melhorJogador} unidade="votos" ranking />
              <TabelaStory titulo="Artilharia" linhas={temporada?.artilharia} unidade="gols" ranking />
              <TabelaStory titulo="Assistências" linhas={temporada?.assistencias} unidade="AST" ranking />
            </div>
            <p className="wrapped-legenda-tendencia">↑ subiu · ↓ desceu · ↔ permaneceu · ✦ estreou</p>
          </section>
        )}

        {erro && <p className="wrapped-erro" role="alert">{erro}</p>}
      </article>

      <footer className="wrapped-rodape">
        <Button variante="secundario" disabled={story === 0} onClick={() => { setErro(null); setStory((atual) => Math.max(0, atual - 1)); }}>
          Voltar
        </Button>
        {story < NOMES_STORIES.length - 1 ? (
          <Button onClick={proximaStory}>Próximo story</Button>
        ) : (
          <Button onClick={() => navigate(`/grupos/${grupoId}/rodadas/${rodadaId}`)}>Voltar à rodada</Button>
        )}
      </footer>
    </main>
  );
}
