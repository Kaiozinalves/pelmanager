import { api } from "./client";

export async function login({ email, senha }) {
  const { data } = await api.post("/usuarios/login", { email, senha });
  return data; // UsuarioResponseDTO
}

// Bate com UsuarioRequestDTO: nome, apelido, email, senha, peDominante,
// posicaoPrimaria, posicaoSecundaria. Retorna UsuarioResponseDTO (com id).
export async function cadastrarUsuario(dadosUsuario) {
  const { data } = await api.post("/usuarios", dadosUsuario);
  return data;
}

export async function buscarUsuario(id) {
  const { data } = await api.get(`/usuarios/${id}`);
  return data;
}

// Bate com UsuarioUpdateRequestDTO: nome, apelido, peDominante,
// posicaoPrimaria, posicaoSecundaria (sem email/senha — esses precisam de
// um fluxo próprio, com confirmação, que ainda não existe).
export async function atualizarUsuario(id, dadosUsuario) {
  const { data } = await api.put(`/usuarios/${id}`, dadosUsuario);
  return data;
}
