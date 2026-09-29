package com.pelmanager.service;

import com.pelmanager.dto.AvaliacaoResponseDTO;
import com.pelmanager.dto.request.AvaliacaoRequestDTO;
import com.pelmanager.repository.AvaliacaoRepository;
import com.pelmanager.repository.RodadaRepository;
import com.pelmanager.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

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

//    @Transactional
//    public AvaliacaoResponseDTO avaliarJogador(AvaliacaoRequestDTO dto){
//
//    }
}
