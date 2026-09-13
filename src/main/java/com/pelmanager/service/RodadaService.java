package com.pelmanager.service;

import com.pelmanager.dto.request.RodadaRequestDTO;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.enums.StatusRodada;
import com.pelmanager.repository.EnderecoRepository;
import com.pelmanager.repository.GrupoPeladaRepository;
import com.pelmanager.repository.RodadaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class RodadaService {
    private final RodadaRepository rodadaRepository;
    private final GrupoPeladaRepository grupoPeladaRepository;
    private final EnderecoRepository enderecoRepository;

    public RodadaService(RodadaRepository rodadaRepository, GrupoPeladaRepository grupoPeladaRepository, EnderecoRepository enderecoRepository) {
        this.rodadaRepository = rodadaRepository;
        this.grupoPeladaRepository = grupoPeladaRepository;
        this.enderecoRepository = enderecoRepository;
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

        if (dto.enderecoAlternativoId() != null) {
            novaRodada.setEnderecoAlternativo(enderecoRepository.findById(dto.enderecoAlternativoId())
                    .orElseThrow(() -> new RuntimeException("Endereço alternativo não encontrado.")));
        }

        rodadaRepository.save(novaRodada);
    }
}
