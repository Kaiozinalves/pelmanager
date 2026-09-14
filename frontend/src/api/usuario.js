import { api } from "./client";

export async function login({ email, senha }) {
  const { data } = await api.post("/usuarios/login", { email, senha });
  return data;
}

export async function cadastrarUsuario(dadosUsuario) {
  const { data } = await api.post("/usuarios", dadosUsuario);
  return data;
}
