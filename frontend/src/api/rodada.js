import { api } from "./client";

// Bate com RodadaRequestDTO: grupoId, data (yyyy-MM-dd), horario (HH:mm),
// enderecoAlternativoId (opcional — omitimos, já que ainda não existe um
// endpoint pra criar/listar endereços alternativos escolhíveis no front).
// Não retorna corpo (201 Created vazio).
export async function agendarRodada({ grupoId, data, horario }) {
  await api.post("/rodadas", { grupoId, data, horario, enderecoAlternativoId: null });
}
