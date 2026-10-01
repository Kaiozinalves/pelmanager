import { api } from "./client";

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

// PATCH /api/rodadas/{id}/finalizar — encerra a rodada e libera as avaliações.
export async function finalizarRodada(id) {
  const { data } = await api.patch(`/rodadas/${id}/finalizar`);
  return data;
}
