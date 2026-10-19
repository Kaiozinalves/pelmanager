import { api } from "./client";

// Início/fim manuais da partida, endereço alternativo e encerramento antecipado da votação.

// Bate com RodadaRequestDTO: grupoId, data (yyyy-MM-dd), horario (HH:mm),
// enderecoAlternativoId (opcional), enderecoAlternativo (opcional).
// Retorna RodadaResponseDTO (id, grupoId, data, horario, status, endereco, usaEnderecoAlternativo, valorPorParticipante).
export async function agendarRodada({ grupoId, usuarioId, data, horario, enderecoAlternativo = null }) {
  const { data: rodadaCriada } = await api.post("/rodadas", {
    grupoId,
    usuarioId,
    data,
    horario,
    enderecoAlternativoId: null,
    enderecoAlternativo,
  });
  return rodadaCriada;
}

// PUT /api/rodadas/{id}/endereco — cadastra/atualiza o endereço alternativo da rodada (somente admin).
export async function atualizarEnderecoDaRodada(id, endereco, usuarioId) {
  const { data } = await api.put(`/rodadas/${id}/endereco`, endereco, {
    params: { usuarioId },
  });
  return data;
}

// DELETE /api/rodadas/{id}/endereco — volta a rodada para o endereço padrão da pelada (somente admin).
export async function removerEnderecoAlternativoDaRodada(id, usuarioId) {
  const { data } = await api.delete(`/rodadas/${id}/endereco`, {
    params: { usuarioId },
  });
  return data;
}

// PATCH /api/rodadas/{id}/iniciar — AGENDADA -> EM_ANDAMENTO (fecha o check-in e gera pagamentos).
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
