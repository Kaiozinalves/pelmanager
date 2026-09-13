import { createContext, useContext, useState, useCallback } from "react";
import * as usuarioApi from "../api/usuario";

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

  // O backend ainda não tem endpoint de login — veja o README.
  const entrar = useCallback(async ({ email, senha }) => {
    setCarregando(true);
    setErro(null);
    try {
      const usuarioLogado = await usuarioApi.login({ email, senha });
      persistirUsuario(usuarioLogado);
      return true;
    } catch (err) {
      const mensagem =
        err.response?.data?.message ||
        "Não foi possível entrar. Confira seu e-mail e senha.";
      setErro(mensagem);
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
  // criado (com id), e não existe fluxo de login funcionando ainda pra
  // forçar o usuário a entrar de novo logo em seguida.
  const cadastrar = useCallback(async (dadosUsuario) => {
    setCarregando(true);
    setErro(null);
    try {
      const usuarioCriado = await usuarioApi.cadastrarUsuario(dadosUsuario);
      persistirUsuario(usuarioCriado);
      return true;
    } catch (err) {
      const mensagem =
        err.response?.data?.message ||
        "Não foi possível concluir o cadastro. Confira os dados e tente de novo.";
      setErro(mensagem);
      return false;
    } finally {
      setCarregando(false);
    }
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
