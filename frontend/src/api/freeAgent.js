import { api } from "./client";
import { semVazios } from "./parametros";

// O local do free agent vem do endereço cadastrado no perfil.
export async function ativarFreeAgent(usuarioId) {
  const { data } = await api.put("/free-agents", {
    usuarioId,
  });
  return data;
}

// DELETE /api/free-agents/usuario/{id} — idempotente (204 mesmo se já não era free agent).
export async function desativarFreeAgent(usuarioId) {
  await api.delete(`/free-agents/usuario/${usuarioId}`);
}

// GET /api/free-agents/usuario/{id} — 200 com os dados se está disponível,
// 204 (sem corpo) se não está. Aqui o 204 vira `null`.
export async function buscarMeuFreeAgent(usuarioId) {
  const resposta = await api.get(`/free-agents/usuario/${usuarioId}`);
  return resposta.status === 204 ? null : resposta.data;
}

// GET /api/free-agents — UC07 (buscar free agent). Precisa de `cidade` OU `grupoId`
// (com grupoId e sem cidade, o backend usa a cidade da pelada e esconde quem já é dela).
// `posicao` casa com a posição primária ou a secundária (GOLEIRO, ZAGUEIRO, ...).
// Retorna FreeAgentResponseDTO[]:
// { usuarioId, nome, apelido, posicaoPrimaria, posicaoSecundaria, pernaDominante,
//   cidade, estado, bairro, notaMedia }  (notaMedia pode ser null)
export async function buscarFreeAgents({ grupoId, cidade, estado, bairro, posicao, limite }) {
  const { data } = await api.get("/free-agents", {
    params: semVazios({ grupoId, cidade, estado, bairro, posicao, limite }),
  });
  return data;
}
