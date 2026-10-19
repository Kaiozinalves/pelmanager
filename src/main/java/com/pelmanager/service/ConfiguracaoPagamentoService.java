package com.pelmanager.service;

import com.pelmanager.dto.ConfiguracaoPagamentoDTO;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.repository.GrupoPeladaRepository;
import jakarta.transaction.Transactional;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ConfiguracaoPagamentoService {
    private final GrupoPeladaRepository grupoPeladaRepository;


    public ConfiguracaoPagamentoService(GrupoPeladaRepository grupoPeladaRepository) {
        this.grupoPeladaRepository = grupoPeladaRepository;
    }

    @Transactional
    public ConfiguracaoPagamentoDTO atualizarConfiguracao(Long idGrupo, ConfiguracaoPagamentoDTO config){

        //grupo
        var grupo = grupoPeladaRepository.findById(idGrupo)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));

        //validacoes

        if (config.ativo() && config.chavePixGerente() == null){
            throw new RuntimeException("Chave Pix do gerente não pode ser nula quando a configuração está ativa");
        }

        if (config.ativo() && (config.valorTotal() == null ||
                config.valorTotal().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new IllegalArgumentException("Valor total deve ser maior que zero!");
        }

        // Validar formato da chave PIX
        validarChavePIX(config.chavePixGerente());

        //atualizar configuração
        grupo.setSistemaPagementoAtivo(config.ativo());
        grupo.setValorTotalPelada(config.valorTotal());
        grupo.setChavePixGerente(config.chavePixGerente());
        grupoPeladaRepository.save(grupo);

        return ConfiguracaoPagamentoDTO.builder()
                .ativo(grupo.isSistemaPagementoAtivo())
                .valorTotal(grupo.getValorTotalPelada())
                .chavePixGerente(grupo.getChavePixGerente())
                .mensagem("Configuração salva com sucesso!")
                .build();
    }

    @Transactional
    public ConfiguracaoPagamentoDTO obterConfiguracao(Long grupoId) {
        GrupoPelada grupo = grupoPeladaRepository.findById(grupoId)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));

        return ConfiguracaoPagamentoDTO.builder()
                .ativo(grupo.isSistemaPagementoAtivo())
                .valorTotal(grupo.getValorTotalPelada())
                .chavePixGerente(grupo.getChavePixGerente())
                .build();
    }

    private void validarChavePIX(String chave) {
        if (chave == null || chave.trim().isEmpty()) {
            throw new IllegalArgumentException("Chave PIX não pode estar vazia");
        }

        chave = chave.trim();

        if (chave.matches("\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}")) {
            return;
        }

        if (chave.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            return;
        }

        if (chave.matches("\\+55\\s\\d{2}\\s\\d{4,5}-\\d{4}")) {
            return;
        }

        throw new IllegalArgumentException(
                "Chave PIX inválida! Use: CPF (111.111.111-11), Email ou Telefone (+55 11 9999-9999)"
        );
    }
}
