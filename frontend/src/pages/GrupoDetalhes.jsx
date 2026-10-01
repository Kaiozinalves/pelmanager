import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { buscarDetalhesGrupo } from "../api/grupo";
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

  const [grupo, setGrupo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState(null);

  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [agendando, setAgendando] = useState(false);
  const [erroAgendar, setErroAgendar] = useState(null);
  const [rodadaRecemCriada, setRodadaRecemCriada] = useState(null);

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
