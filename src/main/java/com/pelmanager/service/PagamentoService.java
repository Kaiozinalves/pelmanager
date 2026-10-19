package com.pelmanager.service;

import com.pelmanager.entity.CheckIn;
import com.pelmanager.entity.Pagamento;
import com.pelmanager.entity.enums.StatusCheckIn;
import com.pelmanager.entity.enums.StatusPagamento;
import com.pelmanager.repository.CheckInRepository;
import com.pelmanager.repository.PagamentoRepository;
import com.pelmanager.repository.RodadaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PagamentoService {

    private final PagamentoRepository pagamentoRepository;
    private final CheckInRepository checkInRepository;
    private final GerarQrCodeService qrCodeService;
    private final RodadaRepository rodadaRepository;

    public PagamentoService(PagamentoRepository pagamentoRepository, CheckInRepository checkInRepository, GerarQrCodeService qrCodeService, RodadaRepository rodadaRepository) {
        this.pagamentoRepository = pagamentoRepository;
        this.checkInRepository = checkInRepository;
        this.qrCodeService = qrCodeService;
        this.rodadaRepository = rodadaRepository;
    }

    @Transactional
    public void criarPagamentoAoFinalizarCheckIn(Long rodadaId){
        var rodada = rodadaRepository.findById(rodadaId);

        List<CheckIn> confirmados = checkInRepository.findByRodadaIdAndStatus(rodadaId, StatusCheckIn.valueOf("CONFIRMADO"));

        if(confirmados.isEmpty()){
            return;
        }

        BigDecimal valorPorPessoa = rodada.get().getGrupo().calcularValorPorPessoa(confirmados.size());

        //criar pagamentos
        for(CheckIn checkIn : confirmados){
            Pagamento p = new Pagamento();
            p.setRodada(rodada.get());
            p.setUsuario(checkIn.getUsuario());
            p.setValor(valorPorPessoa);
            p.setStatus(StatusPagamento.PENDENTE);
            pagamentoRepository.save(p);
        }

        rodada.get().setValorPorParticipante(valorPorPessoa);
    }

    public List<Pagamento> obterPagamentosRodada(Long rodadaId) {
        return pagamentoRepository.findByRodadaId(rodadaId);
    }

    public void marcarPago(Long pagamentoId){
        var pagamento = pagamentoRepository.findById(pagamentoId)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado"));
        pagamento.marcarComoPago();
        pagamentoRepository.save(pagamento);
    }

    public List<Pagamento> obterPendentes(Long rodadaId) {
        return pagamentoRepository.findByRodadaIdAndStatus(
                rodadaId,
                StatusPagamento.PENDENTE
        );
    }

    public Pagamento obterPagamento(Long pagamentoId) {
        return pagamentoRepository.findById(pagamentoId)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado"));
    }

    public String gerarQrCode(Long pagamentoId){
        var pagamento = obterPagamento(pagamentoId);
        String chavePixGerente = pagamento.getRodada().getGrupo().getChavePixGerente();

        if (chavePixGerente == null || chavePixGerente.isEmpty()) {
            throw new RuntimeException("Chave PIX não configurada no grupo");
        }

        return qrCodeService.gerarQrCode(chavePixGerente, pagamento.getValor());
    }

    public void CalcularPorDesistencia (Long rodadaId){
        var rodada = rodadaRepository.findById(rodadaId);

        long confirmadosAtuais = checkInRepository.contarPorRodadaEStatus(
                rodadaId,
                StatusCheckIn.CONFIRMADO
        );

        if (confirmadosAtuais <= 0) {
            List<Pagamento> todos = pagamentoRepository.findByRodadaId(rodadaId);
            for (Pagamento p : todos) {
                if (!p.foiPago()) {
                    p.setStatus(StatusPagamento.CANCELADO);
                    pagamentoRepository.save(p);
                }
            }
            return;
        }

        BigDecimal novoValor = rodada.get().getGrupo()
                .calcularValorPorPessoa((int) confirmadosAtuais);

        List<Pagamento> pendentes = obterPendentes(rodadaId);
        for (Pagamento p : pendentes) {
            p.setValor(novoValor);
            pagamentoRepository.save(p);
        }

        rodada.get().setValorPorParticipante(novoValor);
        rodadaRepository.save(rodada.get());

    }


}
