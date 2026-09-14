import { api } from "./client";

// Bate com GrupoPeladaRequestDTO: nome, fundadorId, endereco.
// endereco segue EnderecoRequestDTO: logradouro, numero, bairro, cidade, estado, cep.
// Retorna GrupoPeladaResponseDTO: id, nome, codigoConvite, dataCriacao, endereco.
export async function criarGrupo({ nome, fundadorId, endereco }) {
  const { data } = await api.post("/grupos", { nome, fundadorId, endereco });
  return data;
}

// Bate com EntrarGrupoPeladaRequestDTO: IdUsuario, codigoConvite.
// Não retorna corpo (204/200 vazio) — só confirma que deu certo.
export async function entrarNoGrupo({ idUsuario, codigoConvite }) {
  await api.post("/grupos/entrar", {
    IdUsuario: idUsuario,
    codigoConvite,
  });
}

export async function listarMeusGrupos(usuarioId) {
  const { data } = await api.get(`/grupos/meus?usuarioId=${usuarioId}`);
  return data;
}
