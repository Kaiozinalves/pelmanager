import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Select } from "../components/Input";
import { buscarDetalhesGrupo } from "../api/grupo";
import { finalizarRodada } from "../api/rodada";
import { confirmarPresenca, listarCheckinsDaRodada } from "../api/checkin";
import { buscarTimesDaRodada, sortearAleatorio, sortearBalanceado } from "../api/sorteio";
import { avaliarJogador, listarAvaliacoesDaRodada } from "../api/avaliacao";
import { POSICOES, extrairMensagemErro } from "../constants/enums";

const POSICAO_ROTULO = Object.fromEntries(POSICOES.map((p) => [p.valor, p.rotulo]));

const STATUS_ROTULO = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export function Rodada() {
  const { grupoId, rodadaId } = useParams();
  const { usuario } = useAuth();
  const rodadaIdNum = Number(rodadaId);

  const [grupo, setGrupo] = useState(null);
  const [carregandoGrupo, setCarregandoGrupo] = useState(true);
  const [erroGrupo, setErroGrupo] = useState(null);

  const [checkins, setCheckins] = useState([]);
  const [carregandoCheckins, setCarregandoCheckins] = useState(true);
  const [fazendoCheckin, setFazendoCheckin] = useState(false);
  const [erroCheckin, setErroCheckin] = useState(null);

  const [times, setTimes] = useState([]);
  const [carregandoTimes, setCarregandoTimes] = useState(true);
  const [sorteando, setSorteando] = useState(null); // "aleatorio" | "balanceado" | null
  const [erroSorteio, setErroSorteio] = useState(null);

  const [finalizando, setFinalizando] = useState(false);
  const [erroFinalizar, setErroFinalizar] = useState(null);

  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(true);
  const [formsAvaliacao, setFormsAvaliacao] = useState({});
  const [avaliandoId, setAvaliandoId] = useState(null);
  const [erroAvaliar, setErroAvaliar] = useState(null);

  const rodada = grupo?.rodadas?.find((r) => r.id === rodadaIdNum) || null;

  const carregarGrupo = useCallback(async () => {
    try {
      const dados = await buscarDetalhesGrupo(grupoId);
      setGrupo(dados);
    } catch (err) {
      setErroGrupo(extrairMensagemErro(err, "Não foi possível carregar essa pelada."));
    }
  }, [grupoId]);

  const carregarCheckins = useCallback(async () => {
    try {
      const dados = await listarCheckinsDaRodada(rodadaIdNum);
      setCheckins(dados);
    } catch {
      setCheckins([]);
    }
  }, [rodadaIdNum]);

  const carregarTimes = useCallback(async () => {
    try {
      const resultado = await buscarTimesDaRodada(rodadaIdNum);
      setTimes(resultado.times || []);
    } catch {
      setTimes([]);
    }
  }, [rodadaIdNum]);

  const carregarAvaliacoes = useCallback(async () => {
    try {
      const dados = await listarAvaliacoesDaRodada(rodadaIdNum);
      setAvaliacoes(dados);
    } catch {
      setAvaliacoes([]);
    }
  }, [rodadaIdNum]);

  useEffect(() => {
    setCarregandoGrupo(true);
    carregarGrupo().finally(() => setCarregandoGrupo(false));
  }, [carregarGrupo]);

  useEffect(() => {
    setCarregandoCheckins(true);
    carregarCheckins().finally(() => setCarregandoCheckins(false));
    setCarregandoTimes(true);
    carregarTimes().finally(() => setCarregandoTimes(false));
    setCarregandoAvaliacoes(true);
    carregarAvaliacoes().finally(() => setCarregandoAvaliacoes(false));
  }, [carregarCheckins, carregarTimes, carregarAvaliacoes]);

  const meuCheckin = checkins.find((c) => c.usuarioId === usuario.id);
  const jaConfirmou = meuCheckin?.statusCheckIn === "CONFIRMADO";

  async function aoConfirmarPresenca() {
    setErroCheckin(null);
    setFazendoCheckin(true);
    try {
      await confirmarPresenca({ rodadaId: rodadaIdNum, usuarioId: usuario.id });
      await carregarCheckins();
    } catch (err) {
      setErroCheckin(extrairMensagemErro(err, "Não foi possível confirmar sua presença agora."));
    } finally {
      setFazendoCheckin(false);
    }
  }

  async function aoSortear(modo) {
    setErroSorteio(null);
    setSorteando(modo);
    try {
      const resultado =
        modo === "aleatorio" ? await sortearAleatorio(rodadaIdNum) : await sortearBalanceado(rodadaIdNum);
      setTimes(resultado.times || []);
    } catch (err) {
      setErroSorteio(
        extrairMensagemErro(err, "Não foi possível sortear os times agora. Confira se há jogadores e goleiros suficientes confirmados.")
      );
    } finally {
      setSorteando(null);
    }
  }

  async function aoFinalizarRodada() {
    setErroFinalizar(null);
    setFinalizando(true);
    try {
      await finalizarRodada(rodadaIdNum);
      await carregarGrupo();
    } catch (err) {
      setErroFinalizar(extrairMensagemErro(err, "Não foi possível finalizar a rodada agora."));
    } finally {
      setFinalizando(false);
    }
  }

  function atualizarFormAvaliacao(usuarioId, campo, valor) {
    setFormsAvaliacao((atual) => ({
      ...atual,
      [usuarioId]: { nota: "5", comentario: "", ...atual[usuarioId], [campo]: valor },
    }));
  }

  async function aoAvaliar(jogadorAvaliadoId) {
    setErroAvaliar(null);
    setAvaliandoId(jogadorAvaliadoId);
    const form = formsAvaliacao[jogadorAvaliadoId] || { nota: "5", comentario: "" };
    try {
      await avaliarJogador({
        rodadaId: rodadaIdNum,
        avaliadorId: usuario.id,
        avaliadoId: jogadorAvaliadoId,
        nota: Number(form.nota),
        comentario: form.comentario || null,
      });
      await carregarAvaliacoes();
    } catch (err) {
      setErroAvaliar(extrairMensagemErro(err, "Não foi possível registrar essa avaliação agora."));
    } finally {
      setAvaliandoId(null);
    }
  }

  const idsJaAvaliados = new Set(
    avaliacoes.filter((a) => a.avaliadorId === usuario.id).map((a) => a.avaliadoId)
  );

  const jogadoresParaAvaliar = checkins.filter(
    (c) => c.statusCheckIn === "CONFIRMADO" && c.usuarioId !== usuario.id
  );

  return (
    <div className="home">
      <header className="home-header">
        <span className="marca marca--escura">Pelada</span>
        <Link className="link-simples" to={`/grupos/${grupoId}`}>
          Voltar pra pelada
        </Link>
      </header>

      <main className="pagina-central pagina-central--larga">
        {carregandoGrupo && <p className="texto-suave">Carregando…</p>}
        {!carregandoGrupo && erroGrupo && (
          <p className="mensagem-erro" role="alert">
            {erroGrupo}
          </p>
        )}

        {!carregandoGrupo && grupo && !rodada && (
          <p className="mensagem-erro" role="alert">
            Essa rodada não foi encontrada nessa pelada.
          </p>
        )}

        {!carregandoGrupo && rodada && (
          <>
            <section className="painel">
              <div className="rodada-cabecalho">
                <div>
                  <h2 className="painel-titulo">Rodada de {rodada.data?.split("-").reverse().join("/")}</h2>
                  <p className="texto-suave">{grupo.nome} · {rodada.horario}</p>
                </div>
                <span className={`badge-status badge-status--${rodada.status?.toLowerCase()}`}>
                  {STATUS_ROTULO[rodada.status] || rodada.status}
                </span>
              </div>

              {rodada.status !== "FINALIZADA" && (
                <>
                  {erroFinalizar && (
                    <p className="mensagem-erro" role="alert">
                      {erroFinalizar}
                    </p>
                  )}
                  <div className="linha-acoes">
                    <Button variante="secundario" carregando={finalizando} onClick={aoFinalizarRodada}>
                      Finalizar rodada
                    </Button>
                  </div>
                </>
              )}
            </section>

            <section className="painel">
              <h3 className="subtitulo-secao">Check-in</h3>

              {!jaConfirmou && rodada.status === "AGENDADA" && (
                <div className="linha-acoes linha-acoes--espaco">
                  {erroCheckin && (
                    <p className="mensagem-erro" role="alert">
                      {erroCheckin}
                    </p>
                  )}
                  <Button carregando={fazendoCheckin} onClick={aoConfirmarPresenca}>
                    Confirmar minha presença
                  </Button>
                </div>
              )}

              {carregandoCheckins && <p className="texto-suave">Carregando…</p>}

              {!carregandoCheckins && (
                <ul className="lista-participantes">
                  {checkins.map((c) => (
                    <li key={c.usuarioId} className="item-participante">
                      <span>
                        {c.nome || c.apelido}
                        {c.posicao && (
                          <span className="texto-suave"> · {POSICAO_ROTULO[c.posicao] || c.posicao}</span>
                        )}
                      </span>
                      <span
                        className={`badge-checkin ${
                          c.statusCheckIn === "CONFIRMADO" ? "badge-checkin--confirmado" : ""
                        }`}
                      >
                        {c.statusCheckIn === "CONFIRMADO" ? "Confirmado" : "Pendente"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="painel">
              <h3 className="subtitulo-secao">Sorteio de times</h3>

              {erroSorteio && (
                <p className="mensagem-erro" role="alert">
                  {erroSorteio}
                </p>
              )}

              <div className="linha-acoes linha-acoes--espaco">
                <Button
                  variante="secundario"
                  carregando={sorteando === "aleatorio"}
                  disabled={sorteando === "balanceado"}
                  onClick={() => aoSortear("aleatorio")}
                >
                  Sortear aleatório
                </Button>
                <Button
                  carregando={sorteando === "balanceado"}
                  disabled={sorteando === "aleatorio"}
                  onClick={() => aoSortear("balanceado")}
                >
                  Sortear balanceado
                </Button>
              </div>
              <p className="texto-suave texto-suave--nota">
                Aleatório embaralha o time, mas garante pelo menos 1 goleiro em cada lado. Balanceado
                usa a nota média das avaliações de cada jogador pra deixar os times parecidos em força.
              </p>

              {carregandoTimes && <p className="texto-suave">Carregando…</p>}

              {!carregandoTimes && times.length > 0 && (
                <div className="grid-times">
                  {times.map((time) => (
                    <div key={time.id} className="cartao-time">
                      <h4 className="cartao-time-titulo">{time.nome}</h4>
                      <ul className="lista-jogadores-time">
                        {time.jogadores.map((j) => (
                          <li key={j.usuarioId}>
                            <span>{j.nome || j.apelido}</span>
                            <span className="texto-suave">
                              {POSICAO_ROTULO[j.posicaoPrimaria] || j.posicaoPrimaria}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {!carregandoTimes && times.length === 0 && (
                <p className="texto-suave">Nenhum time sorteado ainda pra essa rodada.</p>
              )}
            </section>

            {rodada.status === "FINALIZADA" && (
              <section className="painel">
                <h3 className="subtitulo-secao">Avaliar jogadores</h3>

                {erroAvaliar && (
                  <p className="mensagem-erro" role="alert">
                    {erroAvaliar}
                  </p>
                )}

                {carregandoAvaliacoes && <p className="texto-suave">Carregando…</p>}

                {!carregandoAvaliacoes && jogadoresParaAvaliar.length === 0 && (
                  <p className="texto-suave">Ninguém pra avaliar por aqui ainda.</p>
                )}

                {!carregandoAvaliacoes && jogadoresParaAvaliar.length > 0 && (
                  <ul className="lista-avaliacao">
                    {jogadoresParaAvaliar.map((j) => {
                      const jaAvaliado = idsJaAvaliados.has(j.usuarioId);
                      const form = formsAvaliacao[j.usuarioId] || { nota: "5", comentario: "" };

                      return (
                        <li key={j.usuarioId} className="item-avaliacao">
                          <span className="item-avaliacao-nome">{j.nome || j.apelido}</span>

                          {jaAvaliado ? (
                            <span className="badge-checkin badge-checkin--confirmado">Avaliado</span>
                          ) : (
                            <div className="item-avaliacao-form">
                              <Select
                                id={`nota-${j.usuarioId}`}
                                label="Nota"
                                value={form.nota}
                                onChange={(e) =>
                                  atualizarFormAvaliacao(j.usuarioId, "nota", e.target.value)
                                }
                              >
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </Select>
                              <Button
                                variante="secundario"
                                carregando={avaliandoId === j.usuarioId}
                                onClick={() => aoAvaliar(j.usuarioId)}
                              >
                                Avaliar
                              </Button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
