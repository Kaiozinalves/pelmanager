package com.pelmanager.service;

import com.pelmanager.dto.PeladaProximaResponseDTO;
import com.pelmanager.entity.Endereco;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.enums.StatusCheckIn;
import com.pelmanager.entity.enums.StatusRodada;
import com.pelmanager.exception.RequisicaoInvalidaException;
import com.pelmanager.repository.ParticipanteRepository;
import com.pelmanager.repository.RodadaBuscaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PeladaProximaService {

    private static final int LIMITE_PADRAO = 20;
    private static final int LIMITE_MAXIMO = 50;

    private final RodadaBuscaRepository rodadaBuscaRepository;
    private final ParticipanteRepository participanteRepository;

    public PeladaProximaService(RodadaBuscaRepository rodadaBuscaRepository,
                                ParticipanteRepository participanteRepository) {
        this.rodadaBuscaRepository = rodadaBuscaRepository;
        this.participanteRepository = participanteRepository;
    }


    public List<PeladaProximaResponseDTO> buscar(String cidade, String estado, String bairro,
                                                 Long usuarioId, Integer limite) {
        if (cidade == null || cidade.isBlank()) {
            throw new RequisicaoInvalidaException("Informe a cidade pra buscar peladas próximas.");
        }

        int limiteFinal = (limite == null || limite < 1) ? LIMITE_PADRAO : Math.min(limite, LIMITE_MAXIMO);
        boolean filtraBairro = bairro != null && !bairro.isBlank();
        LocalDateTime agora = LocalDateTime.now();

        List<Rodada> candidatas = rodadaBuscaRepository
                .buscarNaCidade(StatusRodada.AGENDADA, agora.toLocalDate(), cidade.trim())
                .stream()
                // a query traz o dia de hoje inteiro; aqui tira o que já passou do horário
                .filter(r -> !LocalDateTime.of(r.getDataRodada(), r.getHoraRodada()).isBefore(agora))
                .filter(r -> estado == null || estado.isBlank()
                        || iguais(estado, r.getEnderecoResolvido().getEstado()))
                // quem já está no grupo não precisa "descobrir" a própria pelada
                .filter(r -> usuarioId == null
                        || !Boolean.TRUE.equals(
                        participanteRepository.existsByUsuarioIdAndGrupoId(usuarioId, r.getGrupo().getId())))
                .sorted(Comparator
                        .comparingInt((Rodada r) ->
                                filtraBairro && iguais(bairro, r.getEnderecoResolvido().getBairro()) ? 0 : 1)
                        .thenComparing(Rodada::getDataRodada)
                        .thenComparing(Rodada::getHoraRodada))
                .limit(limiteFinal)
                .toList();

        if (candidatas.isEmpty()) {
            return List.of();
        }

        List<Long> rodadaIds = candidatas.stream().map(Rodada::getId).toList();
        List<Long> grupoIds = candidatas.stream().map(r -> r.getGrupo().getId()).distinct().toList();

        Map<Long, Long> confirmadosPorRodada =
                paraMapa(rodadaBuscaRepository.contarCheckinsPorRodada(rodadaIds, StatusCheckIn.CONFIRMADO));
        Map<Long, Long> participantesPorGrupo =
                paraMapa(rodadaBuscaRepository.contarParticipantesPorGrupo(grupoIds));

        return candidatas.stream().map(r -> {
            Endereco endereco = r.getEnderecoResolvido();
            return new PeladaProximaResponseDTO(
                    r.getGrupo().getId(),
                    r.getGrupo().getNome(),
                    r.getGrupo().getCodigoConvite(),
                    r.getId(),
                    r.getDataRodada(),
                    r.getHoraRodada(),
                    formatarEndereco(endereco),
                    endereco.getBairro(),
                    endereco.getCidade(),
                    endereco.getEstado(),
                    filtraBairro && iguais(bairro, endereco.getBairro()),
                    participantesPorGrupo.getOrDefault(r.getGrupo().getId(), 0L),
                    confirmadosPorRodada.getOrDefault(r.getId(), 0L)
            );
        }).toList();
    }

    private Map<Long, Long> paraMapa(List<Object[]> linhas) {
        Map<Long, Long> mapa = new HashMap<>();
        for (Object[] linha : linhas) {
            mapa.put((Long) linha[0], (Long) linha[1]);
        }
        return mapa;
    }

    private boolean iguais(String a, String b) {
        return a != null && b != null && a.trim().equalsIgnoreCase(b.trim());
    }

    private String formatarEndereco(Endereco e) {
        StringBuilder sb = new StringBuilder(e.getLogradouro());
        if (e.getNumero() != null && !e.getNumero().isBlank()) {
            sb.append(", ").append(e.getNumero());
        }
        if (e.getBairro() != null && !e.getBairro().isBlank()) {
            sb.append(" - ").append(e.getBairro());
        }
        sb.append(", ").append(e.getCidade());
        if (e.getEstado() != null && !e.getEstado().isBlank()) {
            sb.append("/").append(e.getEstado());
        }
        return sb.toString();
    }
}
