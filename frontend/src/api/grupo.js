import { api } from "./client";

// Bate com GrupoPeladaRequestDTO: nome, fundadorId, endereco.
// Retorna GrupoPeladaResponseDTO: id, nome, codigoConvite, dataCriacao, endereco.
export async function criarGrupo({ nome, fundadorId, endereco }) {
  const { data } = await api.post("/grupos", { nome, fundadorId, endereco });
  return data;
}

// Bate com EntrarGrupoPeladaRequestDTO: IdUsuario, codigoConvite.
// Não retorna corpo — só confirma que deu certo.
export async function entrarNoGrupo({ idUsuario, codigoConvite }) {
  await api.post("/grupos/entrar", {
    IdUsuario: idUsuario,
    codigoConvite,
  });
}

// GET /api/grupos/meus?usuarioId=... — peladas que o usuário participa.
export async function listarMeusGrupos(usuarioId) {
  const { data } = await api.get("/grupos/meus", { params: { usuarioId } });
  return data;
}

// GET /api/grupos/{id} — detalhes + lista de participantes.
// Atenção: esse retorno (GrupoPeladaDetalhesResponseDTO) NÃO inclui
// endereço, diferente do retorno de /meus.
export async function buscarDetalhesGrupo(id) {
  const { data } = await api.get(`/grupos/${id}`);
  return data;
}
