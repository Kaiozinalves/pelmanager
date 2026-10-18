import { api } from "./client";

export async function login({ email, senha }) {
  const { data } = await api.post("/usuarios/login", { email, senha });
  return data; // UsuarioResponseDTO
}

// Bate com UsuarioRequestDTO e inclui endereco com logradouro, numero, bairro,
// cidade, estado e cep. Retorna UsuarioResponseDTO (com id e endereco).
export async function cadastrarUsuario(dadosUsuario) {
  const { data } = await api.post("/usuarios", dadosUsuario);
  return data;
}

export async function buscarUsuario(id) {
  const { data } = await api.get(`/usuarios/${id}`);
  return data;
}

// Bate com UsuarioUpdateRequestDTO e atualiza também o endereço do perfil.
// E-mail e senha ainda precisam de um fluxo próprio, com confirmação.
export async function atualizarUsuario(id, dadosUsuario) {
  const { data } = await api.put(`/usuarios/${id}`, dadosUsuario);
  return data;
}
