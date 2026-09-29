package com.pelmanager.service;

import com.pelmanager.dto.AvaliacaoResponseDTO;
import com.pelmanager.dto.request.AvaliacaoRequestDTO;
import com.pelmanager.entity.Avaliacao;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.Usuario;
import com.pelmanager.entity.enums.StatusRodada;
import com.pelmanager.exception.RodadaNaoEncontradaException;
import com.pelmanager.repository.AvaliacaoRepository;
import com.pelmanager.repository.RodadaRepository;
import com.pelmanager.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AvaliacaoService {
    private final AvaliacaoRepository avaliacaoRepository;
    private final RodadaRepository rodadaRepository;
    private final UsuarioRepository usuarioRepository;

    public AvaliacaoService(AvaliacaoRepository avaliacaoRepository,
                            RodadaRepository rodadaRepository,
                            UsuarioRepository usuarioRepository) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.rodadaRepository = rodadaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public AvaliacaoResponseDTO avaliarJogador(AvaliacaoRequestDTO dto){

        Rodada rodada = rodadaRepository.findById(dto.rodadaId())
                .orElseThrow(() -> new RodadaNaoEncontradaException(dto.rodadaId()));

        if (rodada.getStatusRodada() != StatusRodada.FINALIZADA) {
            throw new RuntimeException("As avaliações só são permitidas após o fim da rodada.");
        }

        Usuario avaliador = usuarioRepository.findById(dto.avaliadorId())
                .orElseThrow(() -> new RuntimeException("Avaliador não encontrado."));

        Usuario avaliado = usuarioRepository.findById(dto.avaliadoId())
                .orElseThrow(() -> new RuntimeException("Jogador avaliado não encontrado."));

        if (avaliacaoRepository.existsByRodadaIdAndAvaliadorIdAndAvaliadoId(rodada.getId(), avaliador.getId(), avaliado.getId())) {
            throw new RuntimeException("Você já avaliou este jogador nesta rodada.");
        }

        Avaliacao avaliacao = new Avaliacao();
        avaliacao.setRodada(rodada);
        avaliacao.setAvaliador(avaliador);
        avaliacao.setAvaliado(avaliado);
        avaliacao.setNota(dto.nota());
        avaliacao.setComentario(dto.comentario());
        avaliacao.setDataAvaliacao(LocalDateTime.now());

        Avaliacao salva = avaliacaoRepository.save(avaliacao);

        return new AvaliacaoResponseDTO(salva.getId(),
                rodada.getId(),
                avaliador.getId(),
                avaliado.getId(),
                avaliado.getNome(),
                salva.getNota(),
                salva.getComentario(),
                salva.getDataAvaliacao());

    }

    public List<AvaliacaoResponseDTO> listarPorRodada(Long rodadaId) {
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByRodadaId(rodadaId);

        return avaliacoes.stream()
                .map(av -> new AvaliacaoResponseDTO(
                        av.getId(),
                        av.getRodada().getId(),
                        av.getAvaliador().getId(),
                        av.getAvaliado().getId(),
                        av.getAvaliado().getNome(),
                        av.getNota(),
                        av.getComentario(),
                        av.getDataAvaliacao()
                ))
                .toList();
    }

}
