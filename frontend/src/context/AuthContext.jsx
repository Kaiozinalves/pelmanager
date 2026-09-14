import { createContext, useContext, useState, useCallback } from "react";
import * as usuarioApi from "../api/usuario";

const AuthContext = createContext(null);

function normalizarUsuario(resposta) {
  if (!resposta) return null;

  if (resposta.usuario) {
    return resposta.usuario;
  }

  if (resposta.data && typeof resposta.data === "object") {
    return resposta.data.usuario ?? resposta.data;
  }

  return resposta;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem("pelada_usuario");

    if (!salvo) {
      return null;
    }

    try {
      return JSON.parse(salvo);
    } catch {
      localStorage.removeItem("pelada_usuario");
      return null;
    }
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  function persistirUsuario(resposta) {
    const usuarioLogado = normalizarUsuario(resposta);
    const token = resposta?.token || localStorage.getItem("pelada_token");

    if (usuarioLogado) {
      localStorage.setItem("pelada_usuario", JSON.stringify(usuarioLogado));
      setUsuario(usuarioLogado);
    }

    if (token) {
      localStorage.setItem("pelada_token", token);
    } else {
      localStorage.removeItem("pelada_token");
    }
  }

  const entrar = useCallback(async ({ email, senha }) => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await usuarioApi.login({ email, senha });
      persistirUsuario(resposta);
      return true;
    } catch (err) {
      const mensagem =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Não foi possível entrar. Confira seu e-mail e senha.";
      setErro(mensagem);
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem("pelada_usuario");
    localStorage.removeItem("pelada_token");
    setUsuario(null);
  }, []);

  const cadastrar = useCallback(async (dadosUsuario) => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await usuarioApi.cadastrarUsuario(dadosUsuario);
      persistirUsuario(resposta);
      return true;
    } catch (err) {
      const mensagem =
        err.response?.data?.message ||
        err.response?.data?.error ||
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
