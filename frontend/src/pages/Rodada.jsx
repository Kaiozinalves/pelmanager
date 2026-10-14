import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { GolsRodada } from "../components/GolsRodada";
import { buscarDetalhesGrupo } from "../api/grupo";
import { finalizarRodada, iniciarRodada } from "../api/rodada";
import { confirmarPresenca, confirmarTodos, listarCheckinsDaRodada } from "../api/checkin";
import { buscarTimesDaRodada, sortearAleatorio, sortearBalanceado } from "../api/sorteio";
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
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const rodadaIdNum = Number(rodadaId);

  const [grupo, setGrupo] = useState(null);
  const [carregandoGrupo, setCarregandoGrupo] = useState(true);
  const [erroGrupo, setErroGrupo] = useState(null);

  const [checkins, setCheckins] = useState([]);
  const [carregandoCheckins, setCarregandoCheckins] = useState(true);
  const [fazendoCheckin, setFazendoCheckin] = useState(false);
  const [confirmandoTodos, setConfirmandoTodos] = useState(false);
  const [erroCheckin, setErroCheckin] = useState(null);

  const [times, setTimes] = useState([]);
  const [carregandoTimes, setCarregandoTimes] = useState(true);
  const [sorteando, setSorteando] = useState(null); // "aleatorio" | "balanceado" | null
  const [erroSorteio, setErroSorteio] = useState(null);

  const [iniciando, setIniciando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [erroTransicao, setErroTransicao] = useState(null);


  const rodada = grupo?.rodadas?.find((r) => r.id === rodadaIdNum) || null;
  const ehAdmin =
    grupo?.participantes?.find((p) => p.usuarioId === usuario.id)?.papel === "ADMIN";
  const jogadoresConfirmados = checkins.filter((c) => c.statusCheckIn === "CONFIRMADO");

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

  useEffect(() => {
    setCarregandoGrupo(true);
    carregarGrupo().finally(() => setCarregandoGrupo(false));
  }, [carregarGrupo]);

  useEffect(() => {
    setCarregandoCheckins(true);
    carregarCheckins().finally(() => setCarregandoCheckins(false));
    setCarregandoTimes(true);
    carregarTimes().finally(() => setCarregandoTimes(false));
  }, [carregarCheckins, carregarTimes]);

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

  async function aoConfirmarTodos() {
    setErroCheckin(null);
    setConfirmandoTodos(true);
    try {
      await confirmarTodos({ rodadaId: rodadaIdNum, usuarioId: usuario.id });
      await carregarCheckins();
    } catch (err) {
      setErroCheckin(extrairMensagemErro(err, "Não foi possível confirmar todos os membros agora."));
    } finally {
      setConfirmandoTodos(false);
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

  async function aoIniciarRodada() {
    setErroTransicao(null);
    setIniciando(true);
    try {
      await iniciarRodada(rodadaIdNum, usuario.id);
      await carregarGrupo();
    } catch (err) {
      setErroTransicao(extrairMensagemErro(err, "Não foi possível iniciar a rodada agora."));
    } finally {
      setIniciando(false);
    }
  }

  async function aoFinalizarRodada() {
    setErroTransicao(null);
    setFinalizando(true);
    try {
      await finalizarRodada(rodadaIdNum, usuario.id);
      navigate(`/grupos/${grupoId}/rodadas/${rodadaIdNum}/wrapped`);
    } catch (err) {
      setErroTransicao(extrairMensagemErro(err, "Não foi possível finalizar a rodada agora."));
    } finally {
      setFinalizando(false);
    }
  }

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

              {rodada.status === "FINALIZADA" && (
                <Button onClick={() => navigate(`/grupos/${grupoId}/rodadas/${rodadaIdNum}/wrapped`)}>
                  Abrir votação e Wrapped
                </Button>
              )}

              {rodada.status !== "FINALIZADA" && rodada.status !== "CANCELADA" && (
                <>
                  {erroTransicao && (
                    <p className="mensagem-erro" role="alert">
                      {erroTransicao}
                    </p>
                  )}
                  {ehAdmin ? (
                    <div className="linha-acoes">
                      {rodada.status === "AGENDADA" && (
                        <Button carregando={iniciando} onClick={aoIniciarRodada}>
                          Iniciar rodada
                        </Button>
                      )}
                      {rodada.status === "EM_ANDAMENTO" && (
                        <Button variante="secundario" carregando={finalizando} onClick={aoFinalizarRodada}>
                          Finalizar rodada
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="texto-suave texto-suave--nota">
                      Só um admin da pelada pode iniciar e finalizar a rodada.
                    </p>
                  )}
                  {rodada.status === "AGENDADA" && ehAdmin && (
                    <p className="texto-suave texto-suave--nota">
                      Iniciar a rodada fecha o check-in. Ao finalizar, a votação é aberta.
                    </p>
                  )}
                </>
              )}
            </section>

            <section className="painel">
              <h3 className="subtitulo-secao">Check-in</h3>

              {rodada.status === "AGENDADA" && ehAdmin &&
                checkins.some((c) => c.statusCheckIn !== "CONFIRMADO") && (
                  <div className="linha-acoes linha-acoes--espaco">
                    {erroCheckin && (
                      <p className="mensagem-erro" role="alert">
                        {erroCheckin}
                      </p>
                    )}
                    <Button carregando={confirmandoTodos} onClick={aoConfirmarTodos}>
                      Confirmar todos
                    </Button>
                  </div>
                )}

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

            {(rodada.status === "EM_ANDAMENTO" || rodada.status === "FINALIZADA") && (
              <GolsRodada
                rodadaId={rodadaIdNum}
                status={rodada.status}
                usuarioId={usuario.id}
                ehAdmin={ehAdmin}
                jogadores={jogadoresConfirmados}
                times={times}
              />
            )}

          </>
        )}
      </main>
    </div>
  );
}
