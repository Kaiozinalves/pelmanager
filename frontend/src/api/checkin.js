import { api } from "./client";

// Bate com CheckInRequestDTO: rodadaId, usuarioId.
// Retorna CheckInResponseDTO (id, rodadaId, usuarioId, usuarioNome, dataHoraCheckin, status).
export async function confirmarPresenca({ rodadaId, usuarioId }) {
  const { data } = await api.post("/checkins", { rodadaId, usuarioId });
  return data;
}

// DELETE /api/checkins/rodada/{rodadaId}/usuario/{usuarioId} — cancela presença (desistência).
export async function cancelarPresenca({ rodadaId, usuarioId }) {
  const { data } = await api.delete(`/checkins/rodada/${rodadaId}/usuario/${usuarioId}`);
  return data;
}

// GET /api/checkins/rodada/{rodadaId} — status de check-in (CONFIRMADO/PENDENTE/CANCELADO)
// de cada participante do grupo dono dessa rodada.
export async function listarCheckinsDaRodada(rodadaId) {
  const { data } = await api.get(`/checkins/rodada/${rodadaId}`);
  return data;
}

// POST /api/checkins/rodada/{rodadaId}/confirmar-todos?usuarioId=... — ação de admin.
export async function confirmarTodos({ rodadaId, usuarioId }) {
  const { data } = await api.post(`/checkins/rodada/${rodadaId}/confirmar-todos`, null, {
    params: { usuarioId },
  });
  return data;
}
