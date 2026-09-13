package com.pelmanager.service;

import com.pelmanager.dto.RodadaRequestDTO;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.enums.StatusRodada;
import com.pelmanager.repository.GrupoPeladaRepository;
import com.pelmanager.repository.RodadaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class RodadaService {
    private final RodadaRepository rodadaRepository;
    private final GrupoPeladaRepository grupoPeladaRepository;

    public RodadaService(RodadaRepository rodadaRepository, GrupoPeladaRepository grupoPeladaRepository) {
        this.rodadaRepository = rodadaRepository;
        this.grupoPeladaRepository = grupoPeladaRepository;
    }

    @Transactional
    public void agendarRodada(RodadaRequestDTO dto) {
        GrupoPelada grupo = grupoPeladaRepository.findById(dto.grupoId())
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado."));

        Rodada novaRodada = new Rodada();
        novaRodada.setGrupo(grupo);
        novaRodada.setDataRodada(dto.data());
        novaRodada.setHoraRodada(dto.horario());
        novaRodada.setStatusRodada(StatusRodada.AGENDADA); // Regra de negócio aplicada diretamente

        rodadaRepository.save(novaRodada);
    }
}
