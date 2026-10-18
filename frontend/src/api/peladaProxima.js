import { api } from "./client";
import { semVazios } from "./parametros";

// GET /api/peladas/proximas — UC08 (buscar pelada próxima).
// Só `cidade` é obrigatória. `usuarioId` esconde as peladas em que o usuário já está.
// Retorna uma lista de PeladaProximaResponseDTO:
// { grupoId, grupoNome, codigoConvite, rodadaId, data, horario, endereco,
//   bairro, cidade, estado, mesmoBairro, totalParticipantes, totalConfirmados }
export async function buscarPeladasProximas({ cidade, estado, bairro, usuarioId, limite }) {
  const { data } = await api.get("/peladas/proximas", {
    params: semVazios({ cidade, estado, bairro, usuarioId, limite }),
  });
  return data;
}
