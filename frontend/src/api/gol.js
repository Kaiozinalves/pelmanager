import { api } from "./client";

// Gols e assistências de uma rodada.
// Corpo: { usuarioId (quem registra/corrige), autorId, assistenteId (opcional) }.

export async function listarGols(rodadaId) {
  const { data } = await api.get(`/rodadas/${rodadaId}/gols`);
  return data;
}

export async function registrarGol(rodadaId, { usuarioId, autorId, assistenteId }) {
  const { data } = await api.post(`/rodadas/${rodadaId}/gols`, {
    usuarioId,
    autorId,
    assistenteId: assistenteId || null,
  });
  return data;
}

// Somente admin do grupo.
export async function corrigirGol(rodadaId, golId, { usuarioId, autorId, assistenteId }) {
  const { data } = await api.put(`/rodadas/${rodadaId}/gols/${golId}`, {
    usuarioId,
    autorId,
    assistenteId: assistenteId || null,
  });
  return data;
}

// Somente admin do grupo.
export async function removerGol(rodadaId, golId, usuarioId) {
  await api.delete(`/rodadas/${rodadaId}/gols/${golId}`, { params: { usuarioId } });
}

// GET /api/rodadas/{id}/estatisticas e /api/grupos/{id}/estatisticas
// -> { totalGols, artilharia: [{usuarioId, nome, apelido, quantidade}], assistencias: [...] }
export async function estatisticasDaRodada(rodadaId) {
  const { data } = await api.get(`/rodadas/${rodadaId}/estatisticas`);
  return data;
}

export async function estatisticasDoGrupo(grupoId) {
  const { data } = await api.get(`/grupos/${grupoId}/estatisticas`);
  return data;
}

// Rankings da temporada da rodada, com posição anterior e movimento nos top 5.
export async function rankingTemporada(grupoId, rodadaId) {
  const { data } = await api.get(`/grupos/${grupoId}/temporadas/rodada/${rodadaId}`);
  return data;
}
