import { api } from "./client";

// ATENÇÃO: esse endpoint ainda NÃO existe no backend (não há
// UsuarioController.login nem Spring Security configurado). Enquanto ele
// não existir, chamar login() vai dar erro de rede/404. Veja o README
// pra um exemplo mínimo de como implementar isso no Spring.
export async function login({ email, senha }) {
  const { data } = await api.post("/usuarios/login", { email, senha });
  return data; // esperado: UsuarioResponseDTO
}

// Bate com UsuarioRequestDTO: nome, apelido, email, senha, peDominante,
// posicaoPrimaria, posicaoSecundaria. Retorna UsuarioResponseDTO (com id).
export async function cadastrarUsuario(dadosUsuario) {
  const { data } = await api.post("/usuarios", dadosUsuario);
  return data;
}
