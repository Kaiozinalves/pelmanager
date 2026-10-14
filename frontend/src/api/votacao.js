import { api } from "./client";

// GET /api/rodadas/{id}/votacao?usuarioId= — situação (AGUARDANDO_RODADA | ABERTA | ENCERRADA),
// prazo, categorias (com "jaVotei" e resultado quando liberado) e candidatos.
export async function buscarVotacao(rodadaId, usuarioId) {
  const { data } = await api.get(`/rodadas/${rodadaId}/votacao`, { params: { usuarioId } });
  return data;
}

// POST /api/rodadas/{id}/votos — um voto por pessoa e categoria.
// categoria: MELHOR_JOGADOR | BAGRE | REVELACAO
export async function votar(rodadaId, { votanteId, categoria, votadoId }) {
  const { data } = await api.post(`/rodadas/${rodadaId}/votos`, { votanteId, categoria, votadoId });
  return data;
}
