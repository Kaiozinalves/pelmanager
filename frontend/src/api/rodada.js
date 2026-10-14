import { api } from "./client";

// Início/fim manuais da partida e encerramento antecipado da votação.
// Todos exigem o id do usuário logado: o backend valida que ele é ADMIN do grupo.
// Retornam RodadaStatusResponseDTO (id, status, iniciadaEm, finalizadaEm, votacaoAte).

// Bate com RodadaRequestDTO: grupoId, data (yyyy-MM-dd), horario (HH:mm),
// enderecoAlternativoId (opcional — omitimos, já que ainda não existe um
// endpoint pra criar/listar endereços alternativos escolhíveis no front).
// Retorna RodadaResponseDTO (id, grupoId, data, horario, status).
export async function agendarRodada({ grupoId, data, horario }) {
  const { data: rodadaCriada } = await api.post("/rodadas", {
    grupoId,
    data,
    horario,
    enderecoAlternativoId: null,
  });
  return rodadaCriada;
}

// PATCH /api/rodadas/{id}/iniciar — AGENDADA -> EM_ANDAMENTO (fecha o check-in).
export async function iniciarRodada(id, usuarioId) {
  const { data } = await api.patch(`/rodadas/${id}/iniciar`, null, { params: { usuarioId } });
  return data;
}

// PATCH /api/rodadas/{id}/finalizar — EM_ANDAMENTO -> FINALIZADA e abre a votação.
export async function finalizarRodada(id, usuarioId) {
  const { data } = await api.patch(`/rodadas/${id}/finalizar`, null, { params: { usuarioId } });
  return data;
}

// PATCH /api/rodadas/{id}/votacao/encerrar — fecha a votação antes do prazo.
export async function encerrarVotacao(id, usuarioId) {
  const { data } = await api.patch(`/rodadas/${id}/votacao/encerrar`, null, { params: { usuarioId } });
  return data;
}
