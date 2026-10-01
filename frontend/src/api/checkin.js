import { api } from "./client";

// Bate com CheckInRequestDTO: rodadaId, usuarioId.
// Retorna CheckInResponseDTO (id, rodadaId, usuarioId, usuarioNome, dataHoraCheckin, status).
export async function confirmarPresenca({ rodadaId, usuarioId }) {
  const { data } = await api.post("/checkins", { rodadaId, usuarioId });
  return data;
}

// GET /api/checkins/rodada/{rodadaId} — status de check-in (CONFIRMADO/PENDENTE)
// de cada participante do grupo dono dessa rodada.
export async function listarCheckinsDaRodada(rodadaId) {
  const { data } = await api.get(`/checkins/rodada/${rodadaId}`);
  return data;
}
