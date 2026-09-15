import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { criarGrupo, entrarNoGrupo, listarMeusGrupos } from "../api/grupo";
import { extrairMensagemErro } from "../constants/enums";

const ENDERECO_INICIAL = {
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

export function Home() {
  const { usuario, sair } = useAuth();

  const [grupos, setGrupos] = useState([]);
  const [carregandoGrupos, setCarregandoGrupos] = useState(true);
  const [listaVemDoServidor, setListaVemDoServidor] = useState(false);

  const [nomeGrupo, setNomeGrupo] = useState("");
  const [endereco, setEndereco] = useState(ENDERECO_INICIAL);
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState(null);
  const [grupoRecemCriado, setGrupoRecemCriado] = useState(null);

  const [codigoConvite, setCodigoConvite] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erroEntrar, setErroEntrar] = useState(null);
  const [entrouComSucesso, setEntrouComSucesso] = useState(false);

  // Única fonte de verdade da lista: sempre busca do backend.
  // É chamada no carregamento da página, depois de criar e depois de entrar
  // numa pelada — assim a lista nunca fica desatualizada.
  const carregarGrupos = useCallback(async () => {
    try {
      const dados = await listarMeusGrupos(usuario.id);
      setGrupos(dados);
      setListaVemDoServidor(true);
    } catch {
      // GET /grupos/meus ainda não existe no backend (ou falhou por outro
      // motivo) — mantém a lista vazia em vez de quebrar a tela.
      setListaVemDoServidor(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    setCarregandoGrupos(true);
    carregarGrupos().finally(() => setCarregandoGrupos(false));
  }, [carregarGrupos]);

  function atualizarEndereco(campo, valor) {
    setEndereco((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoCriarGrupo(evento) {
    evento.preventDefault();
    setErroCriar(null);
    setGrupoRecemCriado(null);
    setCriando(true);
    try {
      const grupoCriado = await criarGrupo({
        nome: nomeGrupo,
        fundadorId: usuario.id,
        endereco,
      });
      setGrupoRecemCriado(grupoCriado);
      setNomeGrupo("");
      setEndereco(ENDERECO_INICIAL);
      await carregarGrupos();
    } catch (err) {
      setErroCriar(
        extrairMensagemErro(err, "Não foi possível criar a pelada agora. Tenta de novo em instantes.")
      );
    } finally {
      setCriando(false);
    }
  }

  async function aoEntrarNoGrupo(evento) {
    evento.preventDefault();
    setErroEntrar(null);
    setEntrouComSucesso(false);
    setEntrando(true);
    try {
      await entrarNoGrupo({ idUsuario: usuario.id, codigoConvite });
      setEntrouComSucesso(true);
      setCodigoConvite("");
      await carregarGrupos();
    } catch (err) {
      setErroEntrar(
        extrairMensagemErro(err, "Código inválido ou você já participa dessa pelada.")
      );
    } finally {
      setEntrando(false);
    }
  }

  return (
    <div className="home">
      <header className="home-header">
        <span className="marca marca--escura">Pelada</span>
        <div className="home-header-usuario">
          <span>Olá, {usuario?.nome?.split(" ")[0] || usuario?.apelido}</span>
          <Link className="link-simples" to="/perfil">
            Editar perfil
          </Link>
          <button className="link-simples" onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      <main className="home-conteudo">
        <section className="painel painel--lista">
          <h2 className="painel-titulo">Suas peladas</h2>

          {carregandoGrupos && <p className="texto-suave">Carregando…</p>}

          {!carregandoGrupos && grupos.length === 0 && (
            <div className="estado-vazio">
              <p>Você ainda não faz parte de nenhuma pelada.</p>
              <p className="texto-suave">
                Crie a primeira ou entre com um código de convite, ali ao lado.
              </p>
            </div>
          )}

          {!carregandoGrupos && grupos.length > 0 && (
            <ul className="lista-grupos">
              {grupos.map((grupo) => (
                <li key={grupo.id}>
                  <Link to={`/grupos/${grupo.id}`} className="item-grupo">
                    <span className="item-grupo-nome">{grupo.nome}</span>
                    <span className="item-grupo-local">
                      {grupo.endereco?.cidade
                        ? `${grupo.endereco.cidade} · ${grupo.codigoConvite}`
                        : grupo.codigoConvite}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!carregandoGrupos && !listaVemDoServidor && (
            <p className="texto-suave texto-suave--nota">
              Não consegui carregar suas peladas do servidor agora — confira
              se o endpoint GET /api/grupos/meus já foi implementado e se o
              backend está rodando.
            </p>
          )}
        </section>

        <div className="painel-coluna">
          <section className="painel">
            <h2 className="painel-titulo">Criar nova pelada</h2>

            <form className="formulario" onSubmit={aoCriarGrupo} noValidate>
              <Input
                id="nomeGrupo"
                label="Nome do grupo"
                placeholder="Ex.: Pelada do Sábado"
                required
                value={nomeGrupo}
                onChange={(e) => setNomeGrupo(e.target.value)}
              />

              <div className="formulario-linha">
                <Input
                  id="logradouro"
                  label="Rua / Av."
                  required
                  value={endereco.logradouro}
                  onChange={(e) => atualizarEndereco("logradouro", e.target.value)}
                />
                <Input
                  id="numero"
                  label="Número"
                  value={endereco.numero}
                  onChange={(e) => atualizarEndereco("numero", e.target.value)}
                />
              </div>

              <div className="formulario-linha">
                <Input
                  id="bairro"
                  label="Bairro"
                  value={endereco.bairro}
                  onChange={(e) => atualizarEndereco("bairro", e.target.value)}
                />
                <Input
                  id="cidade"
                  label="Cidade"
                  required
                  value={endereco.cidade}
                  onChange={(e) => atualizarEndereco("cidade", e.target.value)}
                />
              </div>

              <div className="formulario-linha">
                <Input
                  id="estado"
                  label="UF"
                  maxLength={2}
                  value={endereco.estado}
                  onChange={(e) =>
                    atualizarEndereco("estado", e.target.value.toUpperCase())
                  }
                />
                <Input
                  id="cep"
                  label="CEP"
                  value={endereco.cep}
                  onChange={(e) => atualizarEndereco("cep", e.target.value)}
                />
              </div>

              {erroCriar && (
                <p className="mensagem-erro" role="alert">
                  {erroCriar}
                </p>
              )}
              {grupoRecemCriado && (
                <p className="mensagem-sucesso" role="status">
                  Pelada criada! Código de convite:{" "}
                  <strong>{grupoRecemCriado.codigoConvite}</strong> —
                  compartilha com o pessoal.
                </p>
              )}

              <Button type="submit" carregando={criando}>
                Criar pelada
              </Button>
            </form>
          </section>

          <section className="painel">
            <h2 className="painel-titulo">Entrar com código de convite</h2>

            <form className="formulario" onSubmit={aoEntrarNoGrupo} noValidate>
              <Input
                id="codigoConvite"
                label="Código de convite"
                placeholder="Ex.: 8F3A1C"
                required
                value={codigoConvite}
                onChange={(e) => setCodigoConvite(e.target.value.toUpperCase())}
              />

              {erroEntrar && (
                <p className="mensagem-erro" role="alert">
                  {erroEntrar}
                </p>
              )}
              {entrouComSucesso && (
                <p className="mensagem-sucesso" role="status">
                  Você entrou na pelada!
                </p>
              )}

              <Button type="submit" variante="secundario" carregando={entrando}>
                Entrar na pelada
              </Button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
