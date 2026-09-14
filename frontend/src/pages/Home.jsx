import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { criarGrupo, entrarNoGrupo, listarMeusGrupos } from "../api/grupo";

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

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!usuario?.id) {
        setCarregandoGrupos(false);
        setListaVemDoServidor(false);
        return;
      }

      try {
        const dados = await listarMeusGrupos(usuario.id);
        if (!ativo) return;
        setGrupos(dados || []);
        setListaVemDoServidor(true);
      } catch (err) {
        if (ativo) setListaVemDoServidor(false);
      } finally {
        if (ativo) setCarregandoGrupos(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [usuario]);

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
      setGrupos((atual) => [...atual, grupoCriado]);
      setGrupoRecemCriado(grupoCriado);
      setNomeGrupo("");
      setEndereco(ENDERECO_INICIAL);
    } catch (err) {
      setErroCriar(
        err.response?.data?.message ||
          "Não foi possível criar a pelada agora. Tenta de novo em instantes."
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
    } catch (err) {
      setErroEntrar(
        err.response?.data?.message ||
          "Código inválido ou você já participa dessa pelada."
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
                <li key={grupo.id} className="item-grupo">
                  <span className="item-grupo-nome">{grupo.nome}</span>
                  <span className="item-grupo-local">
                    {grupo.endereco?.cidade
                      ? `${grupo.endereco.cidade} · ${grupo.codigoConvite}`
                      : grupo.codigoConvite}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!carregandoGrupos && !listaVemDoServidor && (
            <p className="texto-suave texto-suave--nota">
              Mostrando só o que você criou ou entrou nesta sessão — o
              backend ainda não tem um jeito de listar suas peladas salvas.
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
