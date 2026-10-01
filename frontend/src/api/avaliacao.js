import { api } from "./client";

// Bate com AvaliacaoRequestDTO: rodadaId, avaliadorId, avaliadoId, nota (1-5), comentario.
// O backend só aceita depois que a rodada foi finalizada.
export async function avaliarJogador({ rodadaId, avaliadorId, avaliadoId, nota, comentario }) {
  const { data } = await api.post("/avaliacoes", {
    rodadaId,
    avaliadorId,
    avaliadoId,
    nota,
    comentario,
  });
  return data;
}

// GET /api/avaliacoes/rodada/{rodadaId} — todas as avaliações já feitas nessa rodada.
export async function listarAvaliacoesDaRodada(rodadaId) {
  const { data } = await api.get(`/avaliacoes/rodada/${rodadaId}`);
  return data;
}
