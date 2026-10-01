import { api } from "./client";

// POST /api/sorteios — sorteio balanceado (posição + nota média das avaliações). UC09.
export async function sortearBalanceado(rodadaId) {
  const { data } = await api.post("/sorteios", { rodadaId });
  return data; // SorteioResponseDTO: { rodadaId, times: [{ id, nome, jogadores }] }
}

// POST /api/sorteios/aleatorio — sorteio aleatório, com 1 goleiro garantido por time. UC05.
export async function sortearAleatorio(rodadaId) {
  const { data } = await api.post("/sorteios/aleatorio", { rodadaId });
  return data;
}

// GET /api/sorteios/rodada/{rodadaId} — busca os times já sorteados, sem sortear de novo.
export async function buscarTimesDaRodada(rodadaId) {
  const { data } = await api.get(`/sorteios/rodada/${rodadaId}`);
  return data;
}
