import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { TabelasEstatisticas } from "../components/TabelasEstatisticas";
import { BuscaFreeAgentsGrupo } from "../components/BuscaFreeAgentsGrupo";
import { useAuth } from "../context/AuthContext";
import { atualizarConfiguracaoAvaliacao, buscarDetalhesGrupo } from "../api/grupo";
import { estatisticasDoGrupo } from "../api/gol";
import { agendarRodada } from "../api/rodada";
import { extrairMensagemErro } from "../constants/enums";

const PAPEL_ROTULO = {
  ADMIN: "Admin",
  MEMBRO: "Membro",
};

const STATUS_RODADA_ROTULO = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export function GrupoDetalhes() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [grupo, setGrupo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState(null);

  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [agendando, setAgendando] = useState(false);
  const [erroAgendar, setErroAgendar] = useState(null);
  const [rodadaRecemCriada, setRodadaRecemCriada] = useState(null);

  const [estatisticas, setEstatisticas] = useState(null);
  const [configuracao, setConfiguracao] = useState(null);
  const [salvandoConfiguracao, setSalvandoConfiguracao] = useState(false);
  const [erroConfiguracao, setErroConfiguracao] = useState(null);
  const [configuracaoSalva, setConfiguracaoSalva] = useState(false);

  // Única fonte de verdade: sempre busca do backend. Chamada no carregamento
  // da página e de novo depois de agendar uma rodada, pra lista nunca ficar
  // desatualizada (mesmo padrão usado em Home.jsx pros grupos).
  const carregarGrupo = useCallback(async () => {
    try {
      const dados = await buscarDetalhesGrupo(id);
      setGrupo(dados);
    } catch (err) {
      setErroCarregar(extrairMensagemErro(err, "Não foi possível carregar essa pelada."));
    }
  }, [id]);

  useEffect(() => {
    setCarregando(true);
    carregarGrupo().finally(() => setCarregando(false));
  }, [carregarGrupo]);

  const ehAdmin =
    grupo?.participantes?.find((p) => p.usuarioId === usuario.id)?.papel === "ADMIN";

  // Estatísticas (artilharia/assistências) somando todas as rodadas do grupo.
  useEffect(() => {
    estatisticasDoGrupo(id)
      .then(setEstatisticas)
      .catch(() => setEstatisticas(null));
  }, [id]);

  // Copia a configuração salva para o formulário (prazo como string para o input).
  useEffect(() => {
    const salva = grupo?.configuracaoAvaliacao;
    if (salva) {
      setConfiguracao({ ...salva, prazoHoras: String(salva.prazoHoras) });
    }
  }, [grupo]);

  function atualizarConfiguracao(campo, valor) {
    setConfiguracaoSalva(false);
    setConfiguracao((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoSalvarConfiguracao(evento) {
    evento.preventDefault();
    setErroConfiguracao(null);
    setConfiguracaoSalva(false);

    const prazo = Number(configuracao.prazoHoras);
    if (!Number.isInteger(prazo) || prazo < 1 || prazo > 168) {
      setErroConfiguracao("Informe um prazo inteiro entre 1 e 168 horas.");
      return;
    }

    setSalvandoConfiguracao(true);
    try {
      await atualizarConfiguracaoAvaliacao(Number(id), {
        usuarioId: usuario.id,
        melhorJogadorAtiva: configuracao.melhorJogadorAtiva,
        melhorAssistenteAtiva: configuracao.melhorAssistenteAtiva,
        bagreAtiva: configuracao.bagreAtiva,
        prazoHoras: prazo,
      });
      setConfiguracaoSalva(true);
      await carregarGrupo();
    } catch (err) {
      setErroConfiguracao(extrairMensagemErro(err, "Não foi possível salvar a configuração agora."));
    } finally {
      setSalvandoConfiguracao(false);
    }
  }

  async function aoAgendarRodada(evento) {
    evento.preventDefault();
    setErroAgendar(null);
    setRodadaRecemCriada(null);
    setAgendando(true);
    try {
      const rodadaCriada = await agendarRodada({ grupoId: Number(id), data, horario });
      setRodadaRecemCriada(rodadaCriada);
      setData("");
      setHorario("");
      await carregarGrupo();
    } catch (err) {
      setErroAgendar(
        extrairMensagemErro(err, "Não foi possível agendar a rodada agora.")
      );
    } finally {
      setAgendando(false);
    }
  }

  return (
    <div className="home">
      <header className="home-header">
        <span className="marca marca--escura">Pelada</span>
        <Link className="link-simples" to="/home">
          Voltar
        </Link>
      </header>

      <main className="pagina-central">
        {carregando && <p className="texto-suave">Carregando…</p>}

        {!carregando && erroCarregar && (
          <p className="mensagem-erro" role="alert">
            {erroCarregar}
          </p>
        )}

        {!carregando && grupo && (
          <>
            <section className="painel painel--form">
              <h2 className="painel-titulo">{grupo.nome}</h2>
              <p className="texto-suave">
                Código de convite: <strong>{grupo.codigoConvite}</strong>
              </p>

              <h3 className="subtitulo-secao">Participantes</h3>
              <ul className="lista-participantes">
                {grupo.participantes.map((participante) => (
                  <li key={participante.id} className="item-participante">
                    <span>{participante.nome || participante.apelido}</span>
                    <span
                      className={`badge-papel ${
                        participante.papel === "ADMIN" ? "badge-papel--admin" : ""
                      }`}
                    >
                      {PAPEL_ROTULO[participante.papel] || participante.papel}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="painel painel--form">
              <h2 className="painel-titulo">Rodadas</h2>

              {(!grupo.rodadas || grupo.rodadas.length === 0) && (
                <p className="texto-suave">Nenhuma rodada agendada ainda.</p>
              )}

              {grupo.rodadas && grupo.rodadas.length > 0 && (
                <ul className="lista-rodadas">
                  {grupo.rodadas.map((rodada) => (
                    <li key={rodada.id}>
                      <Link to={`/grupos/${id}/rodadas/${rodada.id}`} className="item-rodada">
                        <span>
                          {rodada.data?.split("-").reverse().join("/")} · {rodada.horario}
                        </span>
                        <span className={`badge-status badge-status--${rodada.status?.toLowerCase()}`}>
                          {STATUS_RODADA_ROTULO[rodada.status] || rodada.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <BuscaFreeAgentsGrupo grupo={grupo} />

            <section className="painel painel--form">
              <h2 className="painel-titulo">Estatísticas da pelada</h2>
              {estatisticas && estatisticas.totalGols > 0 ? (
                <TabelasEstatisticas estatisticas={estatisticas} />
              ) : (
                <p className="texto-suave">
                  Nenhum gol registrado ainda. As tabelas aparecem conforme os gols são lançados nas rodadas.
                </p>
              )}
            </section>

            {ehAdmin && configuracao && (
              <section className="painel painel--form">
                <h2 className="painel-titulo">Votação de fim de rodada</h2>
                <p className="texto-suave texto-suave--nota">
                  Escolha quais categorias os jogadores votam depois que a rodada termina. A mudança vale
                  para as próximas rodadas finalizadas.
                </p>

                <form className="formulario" onSubmit={aoSalvarConfiguracao} noValidate>
                  <label className="opcao-checkbox">
                    <input
                      type="checkbox"
                      checked={configuracao.melhorJogadorAtiva}
                      onChange={(e) => atualizarConfiguracao("melhorJogadorAtiva", e.target.checked)}
                    />
                    Melhor jogador da rodada
                  </label>
                  <label className="opcao-checkbox">
                    <input
                      type="checkbox"
                      checked={configuracao.melhorAssistenteAtiva}
                      onChange={(e) => atualizarConfiguracao("melhorAssistenteAtiva", e.target.checked)}
                    />
                    Melhor assistente da rodada
                  </label>
                  <label className="opcao-checkbox">
                    <input
                      type="checkbox"
                      checked={configuracao.bagreAtiva}
                      onChange={(e) => atualizarConfiguracao("bagreAtiva", e.target.checked)}
                    />
                    Bagre da rodada
                  </label>
                  <p className="texto-suave texto-suave--nota">
                    O “bagre” é uma brincadeira que pode soar constrangedora em alguns grupos, por isso vem
                    desligado por padrão.
                  </p>

                  <Input
                    id="prazo-votacao"
                    label="Prazo da votação (horas)"
                    type="number"
                    min="1"
                    max="168"
                    value={configuracao.prazoHoras}
                    onChange={(e) => atualizarConfiguracao("prazoHoras", e.target.value)}
                  />

                  {erroConfiguracao && (
                    <p className="mensagem-erro" role="alert">
                      {erroConfiguracao}
                    </p>
                  )}
                  {configuracaoSalva && (
                    <p className="mensagem-sucesso" role="status">
                      Configuração salva.
                    </p>
                  )}

                  <Button type="submit" carregando={salvandoConfiguracao}>
                    Salvar configuração
                  </Button>
                </form>
              </section>
            )}
            <section className="painel painel--form">
              <h2 className="painel-titulo">Agendar rodada</h2>

              <form className="formulario" onSubmit={aoAgendarRodada} noValidate>
                <div className="formulario-linha">
                  <Input
                    id="data"
                    label="Data"
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                  <Input
                    id="horario"
                    label="Horário"
                    type="time"
                    required
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                  />
                </div>

                {erroAgendar && (
                  <p className="mensagem-erro" role="alert">
                    {erroAgendar}
                  </p>
                )}
                {rodadaRecemCriada && (
                  <p className="mensagem-sucesso" role="status">
                    Rodada agendada!{" "}
                    <Link to={`/grupos/${id}/rodadas/${rodadaRecemCriada.id}`}>
                      Ir pra rodada
                    </Link>
                  </p>
                )}

                <Button type="submit" carregando={agendando}>
                  Agendar
                </Button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
