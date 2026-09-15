import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input, Select } from "../components/Input";
import { Button } from "../components/Button";
import { buscarUsuario, atualizarUsuario } from "../api/usuario";
import { POSICOES, PERNAS, extrairMensagemErro } from "../constants/enums";

export function Perfil() {
  const { usuario, atualizarUsuarioLogado } = useAuth();

  const [form, setForm] = useState(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let ativo = true;
    // Busca os dados direto do backend (em vez de só usar o que já está
    // guardado no navegador), pra sempre mostrar o estado real do usuário.
    buscarUsuario(usuario.id)
      .then((dados) => {
        if (ativo) {
          setForm({
            nome: dados.nome || "",
            apelido: dados.apelido || "",
            email: dados.email || "",
            peDominante: dados.peDominante || "",
            posicaoPrimaria: dados.posicaoPrimaria || "",
            posicaoSecundaria: dados.posicaoSecundaria || "",
          });
        }
      })
      .catch((err) => {
        if (ativo) setErro(extrairMensagemErro(err, "Não foi possível carregar seu perfil."));
      })
      .finally(() => {
        if (ativo) setCarregandoPerfil(false);
      });
    return () => {
      ativo = false;
    };
  }, [usuario.id]);

  function atualizarCampo(campo, valor) {
    setErro(null);
    setSucesso(false);
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoSalvar(evento) {
    evento.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);
    try {
      const usuarioAtualizado = await atualizarUsuario(usuario.id, {
        nome: form.nome,
        apelido: form.apelido,
        peDominante: form.peDominante,
        posicaoPrimaria: form.posicaoPrimaria,
        posicaoSecundaria: form.posicaoSecundaria || null,
      });
      atualizarUsuarioLogado(usuarioAtualizado);
      setSucesso(true);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível salvar as alterações."));
    } finally {
      setSalvando(false);
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
        <section className="painel painel--form">
          <h2 className="painel-titulo">Seu perfil</h2>

          {carregandoPerfil && <p className="texto-suave">Carregando…</p>}

          {!carregandoPerfil && form && (
            <form className="formulario" onSubmit={aoSalvar} noValidate>
              <div className="formulario-linha">
                <Input
                  id="nome"
                  label="Nome completo"
                  required
                  value={form.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                />
                <Input
                  id="apelido"
                  label="Apelido"
                  value={form.apelido}
                  onChange={(e) => atualizarCampo("apelido", e.target.value)}
                />
              </div>

              <Input id="email" label="E-mail" value={form.email} disabled />

              <div className="formulario-linha">
                <Select
                  id="posicaoPrimaria"
                  label="Posição principal"
                  required
                  value={form.posicaoPrimaria}
                  onChange={(e) => atualizarCampo("posicaoPrimaria", e.target.value)}
                >
                  {POSICOES.map((p) => (
                    <option key={p.valor} value={p.valor}>
                      {p.rotulo}
                    </option>
                  ))}
                </Select>

                <Select
                  id="posicaoSecundaria"
                  label="Posição secundária"
                  value={form.posicaoSecundaria}
                  onChange={(e) => atualizarCampo("posicaoSecundaria", e.target.value)}
                >
                  <option value="">Nenhuma</option>
                  {POSICOES.map((p) => (
                    <option key={p.valor} value={p.valor}>
                      {p.rotulo}
                    </option>
                  ))}
                </Select>
              </div>

              <Select
                id="peDominante"
                label="Perna dominante"
                required
                value={form.peDominante}
                onChange={(e) => atualizarCampo("peDominante", e.target.value)}
              >
                {PERNAS.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.rotulo}
                  </option>
                ))}
              </Select>

              {erro && (
                <p className="mensagem-erro" role="alert">
                  {erro}
                </p>
              )}
              {sucesso && (
                <p className="mensagem-sucesso" role="status">
                  Perfil atualizado.
                </p>
              )}

              <Button type="submit" carregando={salvando}>
                Salvar alterações
              </Button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
