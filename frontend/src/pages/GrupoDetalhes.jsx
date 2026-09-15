import { useEffect, useState } from "react";
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

export function GrupoDetalhes() {
  const { id } = useParams();

  const [grupo, setGrupo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState(null);

  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [agendando, setAgendando] = useState(false);
  const [erroAgendar, setErroAgendar] = useState(null);
  const [sucessoAgendar, setSucessoAgendar] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    buscarDetalhesGrupo(id)
      .then((dados) => {
        if (ativo) setGrupo(dados);
      })
      .catch((err) => {
        if (ativo)
          setErroCarregar(extrairMensagemErro(err, "Não foi possível carregar essa pelada."));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  async function aoAgendarRodada(evento) {
    evento.preventDefault();
    setErroAgendar(null);
    setSucessoAgendar(false);
    setAgendando(true);
    try {
      await agendarRodada({ grupoId: Number(id), data, horario });
      setSucessoAgendar(true);
      setData("");
      setHorario("");
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
                {sucessoAgendar && (
                  <p className="mensagem-sucesso" role="status">
                    Rodada agendada!
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
