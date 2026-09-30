package com.pelmanager.service;

import com.pelmanager.dto.JogadorSorteioDTO;
import com.pelmanager.dto.JogadorTimeResponseDTO;
import com.pelmanager.dto.SorteioResponseDTO;
import com.pelmanager.dto.TimeResponseDTO;
import com.pelmanager.entity.CheckIn;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.Time;
import com.pelmanager.entity.Usuario;
import com.pelmanager.entity.enums.Posicao;
import com.pelmanager.entity.enums.StatusCheckIn;
import com.pelmanager.repository.AvaliacaoRepository;
import com.pelmanager.repository.CheckInRepository;
import com.pelmanager.repository.RodadaRepository;
import com.pelmanager.repository.TimeRepository;
import com.pelmanager.sorteio.BalanceadorDeTimes;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class SorteioService {
    private final CheckInRepository checkInRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final RodadaRepository rodadaRepository;
    private final TimeRepository timeRepository;

    public SorteioService(CheckInRepository checkInRepository, AvaliacaoRepository avaliacaoRepository,
                          RodadaRepository rodadaRepository, TimeRepository timeRepository) {
        this.checkInRepository = checkInRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.rodadaRepository = rodadaRepository;
        this.timeRepository = timeRepository;
    }

    @Transactional
    public SorteioResponseDTO sortearTimes(Long rodadaId) {
        Rodada rodada = rodadaRepository.findById(rodadaId)
                .orElseThrow(() -> new RuntimeException("Rodada não encontrada."));

        List<CheckIn> confirmados = buscarJogadoresConfirmados(rodadaId);
        int numTimes = calcularNumeroDeTimes(confirmados.size());
        validarQuantidadeMinimaDeGoleiros(confirmados, numTimes);

        List<JogadorSorteioDTO> ranqueados = calcularOverallDosJogadores(confirmados);
        List<BalanceadorDeTimes.Jogador> jogadores = ranqueados.stream()
                .map(jog -> new BalanceadorDeTimes.Jogador(
                        jog.checkIn().getUsuario().getId(),
                        jog.overall(),
                        jog.posicaoPrimaria(),
                        jog.posicaoSecundaria()))
                .toList();

        BalanceadorDeTimes balanceador = new BalanceadorDeTimes();
        BalanceadorDeTimes.Resultado resultado = balanceador.sortear(jogadores, 5);

        Map<Long, CheckIn> checkInPorUsuarioId = confirmados.stream()
                .collect(Collectors.toMap(
                        checkIn -> checkIn.getUsuario().getId(),
                        checkIn -> checkIn));

        List<Time> timesSorteados = new ArrayList<>();
        int index = 1;
        for (BalanceadorDeTimes.TimeMontado timeMontado : resultado.times()) {
            Time time = new Time();
            time.setNome("Time " + index++);
            time.setRodada(rodada);

            List<CheckIn> jogadoresDoTime = timeMontado.escalacoes().stream()
                    .map(escalacao -> checkInPorUsuarioId.get(escalacao.jogador().id()))
                    .filter(Objects::nonNull)
                    .toList();

            jogadoresDoTime.forEach(checkIn -> checkIn.setTime(time));
            time.setJogadores(jogadoresDoTime);
            timesSorteados.add(time);
        }

        timeRepository.saveAll(timesSorteados);

        List<TimeResponseDTO> timesDTO = timesSorteados.stream().map(time -> {
            List<JogadorTimeResponseDTO> jogadoresDTO = time.getJogadores().stream()
                    .map(c -> new JogadorTimeResponseDTO(
                            c.getUsuario().getId(),
                            c.getUsuario().getNome(),
                            c.getUsuario().getApelido(),
                            c.getUsuario().getPosicaoPrimaria()
                    ))
                    .toList();

            return new TimeResponseDTO(time.getId(), time.getNome(), jogadoresDTO);
        }).toList();

        return new SorteioResponseDTO(rodadaId, timesDTO);
    }

    private List<CheckIn> buscarJogadoresConfirmados(Long rodadaId) {
        return checkInRepository.findAll().stream()
                .filter(c -> c.getRodada().getId().equals(rodadaId) && c.getStatus() == StatusCheckIn.CONFIRMADO)
                .toList();
    }

    private int calcularNumeroDeTimes(int totalConfirmados) {
        if (totalConfirmados < 10) {
            throw new RuntimeException("Mínimo de 10 jogadores confirmados para formar 2 times.");
        }
        return totalConfirmados / 5;
    }

    private void validarQuantidadeMinimaDeGoleiros(List<CheckIn> confirmados, int numTimes) {
        int goleirosMinimos = Math.max(2, numTimes);
        long goleirosDisponiveis = confirmados.stream()
                .map(CheckIn::getUsuario)
                .filter(Objects::nonNull)
                .filter(usuario -> usuario.getPosicaoPrimaria() == Posicao.GOLEIRO
                        || usuario.getPosicaoSecundaria() == Posicao.GOLEIRO)
                .count();

        if (goleirosDisponiveis < goleirosMinimos) {
            throw new IllegalStateException(
                    "Para sortear os times, é necessário pelo menos " + goleirosMinimos
                            + " jogadores com posição primária ou secundária de GOLEIRO."
            );
        }
    }

    private List<JogadorSorteioDTO> calcularOverallDosJogadores(List<CheckIn> confirmados) {
        return confirmados.stream().map(c -> {
            Usuario u = c.getUsuario();
            Double media = avaliacaoRepository.calcularMediaDoJogador(u.getId());
            double overallFinal = (media != null) ? media : 5.0;
            return new JogadorSorteioDTO(c, u.getPosicaoPrimaria(), u.getPosicaoSecundaria(), overallFinal);
        }).toList();
    }
}
