import { api } from "./client";

// GET /api/grupos/{grupoId}/pagamento
export async function obterConfiguracaoPagamento(grupoId) {
  const { data } = await api.get(`/grupos/${grupoId}/pagamento`);
  return data;
}

// PUT /api/grupos/{grupoId}/pagamento
export async function atualizarConfiguracaoPagamento(
  grupoId,
  { usuarioId, ativo, valorTotal, chavePixGerente }
) {
  const { data } = await api.put(`/grupos/${grupoId}/pagamento`, {
    usuarioId,
    ativo,
    valorTotal,
    chavePixGerente,
  });
  return data;
}

// GET /api/pagamentos/rodada/{rodadaId}
export async function listarPagamentosDaRodada(rodadaId) {
  const { data } = await api.get(`/pagamentos/rodada/${rodadaId}`);
  return data;
}

// GET /api/pagamentos/rodada/{rodadaId}/pendentes
export async function listarPagamentosPendentesDaRodada(rodadaId) {
  const { data } = await api.get(`/pagamentos/rodada/${rodadaId}/pendentes`);
  return data;
}

// GET /api/pagamentos/{id}
export async function obterPagamento(pagamentoId) {
  const { data } = await api.get(`/pagamentos/${pagamentoId}`);
  return data;
}

// GET /api/pagamentos/{id}/qr-code
export async function obterQrCodePagamento(pagamentoId) {
  const { data } = await api.get(`/pagamentos/${pagamentoId}/qr-code`);
  return data;
}

// POST /api/pagamentos/{id}/marcar-pago
export async function marcarPagamentoComoPago(pagamentoId, usuarioId) {
  const { data } = await api.post(`/pagamentos/${pagamentoId}/marcar-pago`, null, {
    params: { usuarioId },
  });
  return data;
}

// POST /api/pagamentos/rodada/{rodadaId}/gerar
export async function gerarPagamentosDaRodada(rodadaId, usuarioId) {
  const { data } = await api.post(`/pagamentos/rodada/${rodadaId}/gerar`, null, {
    params: { usuarioId },
  });
  return data;
}

// POST /api/pagamentos/rodada/{rodadaId}/desistencia/{usuarioId}
export async function registrarDesistenciaRodada(rodadaId, usuarioId, adminId) {
  const { data } = await api.post(
    `/pagamentos/rodada/${rodadaId}/desistencia/${usuarioId}`,
    null,
    { params: { adminId } }
  );
  return data;
}
