import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { ativarFreeAgent, buscarMeuFreeAgent, desativarFreeAgent } from "../api/freeAgent";
import { extrairMensagemErro } from "../constants/enums";

function descreverLocal({ bairro, cidade, estado }) {
  const cidadeUf = estado ? `${cidade}/${estado}` : cidade;
  return bairro ? `${bairro}, ${cidadeUf}` : cidadeUf;
}

export function FreeAgents() {
  const { usuario } = useAuth();
  const [meu, setMeu] = useState(null);
  const [endereco, setEndereco] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [desativando, setDesativando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    let ativo = true;
    buscarMeuFreeAgent(usuario.id)
      .then((disponibilidade) => {
        if (!ativo) return;
        setMeu(disponibilidade);
        setEndereco(usuario.endereco || null);
      })
      .catch((err) => {
        if (ativo) setErro(extrairMensagemErro(err, "Não foi possível carregar sua disponibilidade."));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [usuario.id]);

  async function aoFicarDisponivel() {
    setErro(null);
    setMensagem(null);
    if (!endereco?.cidade) {
      setErro("Cadastre sua cidade no perfil antes de ficar disponível.");
      return;
    }

    const jaEraFreeAgent = !!meu;
    setSalvando(true);
    try {
      const disponibilidade = await ativarFreeAgent(usuario.id);
      setMeu(disponibilidade);
      setMensagem(
        jaEraFreeAgent
          ? "Sua disponibilidade foi atualizada com o endereço do perfil."
          : "Pronto! Os grupos da sua região podem encontrar você."
      );
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível salvar sua disponibilidade agora."));
    } finally {
      setSalvando(false);
    }
  }

  async function aoDeixarDeSerFreeAgent() {
    setErro(null);
    setMensagem(null);
    setDesativando(true);
    try {
      await desativarFreeAgent(usuario.id);
      setMeu(null);
      setMensagem("Você não aparece mais na busca de free agents.");
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível desativar agora. Tenta de novo."));
    } finally {
      setDesativando(false);
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

      <main className="pagina-central pagina-central--larga">
        <section className="painel">
          <h2 className="painel-titulo">Minha disponibilidade</h2>
          <p className="texto-suave">
            Free agent é quem quer jogar mas ainda não tem uma pelada fixa. Se ficar disponível, os
            grupos podem encontrar você e enviar um convite.
          </p>
          <p className="texto-suave">
            Usamos cidade, UF e bairro do endereço cadastrado no seu perfil: {" "}
            <Link to="/perfil">Editar endereço</Link>.
          </p>

          {carregando && <p className="texto-suave">Carregando…</p>}

          {!carregando && meu && (
            <p className="status-free-agent">
              <span className="badge-checkin badge-checkin--confirmado">Disponível</span>
              <span>{descreverLocal(meu)}</span>
            </p>
          )}

          {erro && (
            <p className="mensagem-erro" role="alert">
              {erro}
            </p>
          )}
          {mensagem && (
            <p className="mensagem-sucesso" role="status">
              {mensagem}
            </p>
          )}

          {!carregando && (
            <div className="linha-acoes">
              {!meu && (
                <Button type="button" carregando={salvando} onClick={aoFicarDisponivel}>
                  Ficar disponível
                </Button>
              )}
              {meu && (
                <Button
                  type="button"
                  variante="secundario"
                  carregando={desativando}
                  onClick={aoDeixarDeSerFreeAgent}
                >
                  Deixar de ser free agent
                </Button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
