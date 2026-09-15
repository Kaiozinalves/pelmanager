import { createContext, useContext, useState, useCallback } from "react";
import * as usuarioApi from "../api/usuario";
import { extrairMensagemErro } from "../constants/enums";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem("pelada_usuario");
    return salvo ? JSON.parse(salvo) : null;
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  function persistirUsuario(usuarioLogado) {
    localStorage.setItem("pelada_usuario", JSON.stringify(usuarioLogado));
    setUsuario(usuarioLogado);
  }

  const entrar = useCallback(async ({ email, senha }) => {
    setCarregando(true);
    setErro(null);
    try {
      const usuarioLogado = await usuarioApi.login({ email, senha });
      persistirUsuario(usuarioLogado);
      return true;
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível entrar. Confira seu e-mail e senha."));
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem("pelada_usuario");
    setUsuario(null);
  }, []);

  // Após cadastrar, já loga automaticamente: o backend devolve o usuário
  // criado (com id), então não precisa forçar login logo em seguida.
  const cadastrar = useCallback(async (dadosUsuario) => {
    setCarregando(true);
    setErro(null);
    try {
      const usuarioCriado = await usuarioApi.cadastrarUsuario(dadosUsuario);
      persistirUsuario(usuarioCriado);
      return true;
    } catch (err) {
      setErro(
        extrairMensagemErro(
          err,
          "Não foi possível concluir o cadastro. Confira os dados e tente de novo."
        )
      );
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  // Chamado depois de um PUT /usuarios/{id} bem-sucedido, pra manter o
  // nome/apelido exibido no cabeçalho da Home sempre atualizado.
  const atualizarUsuarioLogado = useCallback((usuarioAtualizado) => {
    persistirUsuario(usuarioAtualizado);
  }, []);

  const valor = {
    usuario,
    estaLogado: !!usuario,
    carregando,
    erro,
    limparErro: () => setErro(null),
    entrar,
    sair,
    cadastrar,
    atualizarUsuarioLogado,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return contexto;
}
