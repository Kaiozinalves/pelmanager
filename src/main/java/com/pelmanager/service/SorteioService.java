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
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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

        return new SorteioResponseDTO(rodadaId, mapearTimes(timesSorteados));
    }

    // UC05: sorteio aleatório, mas garantindo pelo menos 1 goleiro (primário ou
    // secundário) escalado em cada time antes de distribuir o resto aleatoriamente.
    @Transactional
    public SorteioResponseDTO sortearTimesAleatorio(Long rodadaId) {
        Rodada rodada = rodadaRepository.findById(rodadaId)
                .orElseThrow(() -> new RuntimeException("Rodada não encontrada."));

        List<CheckIn> confirmados = buscarJogadoresConfirmados(rodadaId);
        int numTimes = calcularNumeroDeTimes(confirmados.size());
        validarQuantidadeMinimaDeGoleiros(confirmados, numTimes);

        // Separa quem pode jogar de goleiro (posição primária ou secundária) do resto
        List<CheckIn> goleiros = new ArrayList<>(confirmados.stream()
                .filter(c -> c.getUsuario().getPosicaoPrimaria() == Posicao.GOLEIRO
                        || c.getUsuario().getPosicaoSecundaria() == Posicao.GOLEIRO)
                .toList());
        Collections.shuffle(goleiros);

        // 1 goleiro titular garantido por time (a validação acima já garante que existem
        // goleiros suficientes: validarQuantidadeMinimaDeGoleiros exige pelo menos numTimes)
        List<CheckIn> goleirosTitulares = goleiros.subList(0, numTimes);
        Set<Long> idsGoleirosTitulares = goleirosTitulares.stream()
                .map(CheckIn::getId)
                .collect(Collectors.toSet());

        // Todo o resto (jogadores de linha + goleiros excedentes) entra no sorteio aleatório
        List<CheckIn> restante = new ArrayList<>(confirmados.stream()
                .filter(c -> !idsGoleirosTitulares.contains(c.getId()))
                .toList());
        Collections.shuffle(restante);

        List<Time> times = new ArrayList<>();
        for (int i = 0; i < numTimes; i++) {
            Time time = new Time();
            time.setNome("Time " + (i + 1));
            time.setRodada(rodada);
            times.add(time);
        }

        List<List<CheckIn>> jogadoresPorTime = new ArrayList<>();
        for (int i = 0; i < numTimes; i++) {
            List<CheckIn> lista = new ArrayList<>();
            lista.add(goleirosTitulares.get(i));
            jogadoresPorTime.add(lista);
        }

        int indiceTime = 0;
        for (CheckIn jogador : restante) {
            jogadoresPorTime.get(indiceTime).add(jogador);
            indiceTime = (indiceTime + 1) % numTimes;
        }

        for (int i = 0; i < numTimes; i++) {
            Time time = times.get(i);
            List<CheckIn> jogadoresDoTime = jogadoresPorTime.get(i);
            jogadoresDoTime.forEach(checkIn -> checkIn.setTime(time));
            time.setJogadores(jogadoresDoTime);
        }

        timeRepository.saveAll(times);

        return new SorteioResponseDTO(rodadaId, mapearTimes(times));
    }

    // Busca os times já sorteados de uma rodada, sem sortear de novo.
    // Usado quando a página é recarregada e o sorteio já tinha sido feito antes.
    public SorteioResponseDTO buscarTimesDaRodada(Long rodadaId) {
        List<Time> times = timeRepository.findByRodadaId(rodadaId);
        return new SorteioResponseDTO(rodadaId, mapearTimes(times));
    }

    private List<TimeResponseDTO> mapearTimes(List<Time> times) {
        return times.stream().map(time -> {
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
