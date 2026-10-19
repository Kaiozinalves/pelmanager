package com.pelmanager.service;

import com.pelmanager.dto.ConfiguracaoPagamentoDTO;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.repository.GrupoPeladaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ConfiguracaoPagamentoService {
    private final GrupoPeladaRepository grupoPeladaRepository;
    private final PermissaoService permissaoService;

    public ConfiguracaoPagamentoService(GrupoPeladaRepository grupoPeladaRepository,
                                        PermissaoService permissaoService) {
        this.grupoPeladaRepository = grupoPeladaRepository;
        this.permissaoService = permissaoService;
    }

    @Transactional
    public ConfiguracaoPagamentoDTO atualizarConfiguracao(Long idGrupo, ConfiguracaoPagamentoDTO config) {
        var grupo = grupoPeladaRepository.findById(idGrupo)
                .orElseThrow(() -> new IllegalArgumentException("Grupo não encontrado"));

        permissaoService.exigirAdmin(config.usuarioId(), grupo);

        boolean ativo = Boolean.TRUE.equals(config.ativo());
        String chavePix = config.chavePixGerente() != null ? config.chavePixGerente().trim() : null;

        if (ativo) {
            if (chavePix == null || chavePix.isEmpty()) {
                throw new IllegalArgumentException("Chave PIX do gerente não pode estar vazia quando o pagamento está ativo.");
            }

            if (config.valorTotal() == null || config.valorTotal().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Valor total deve ser maior que zero!");
            }

            validarChavePIX(chavePix);
        } else if (chavePix != null && !chavePix.isEmpty()) {
            validarChavePIX(chavePix);
        }

        grupo.setSistemaPagementoAtivo(ativo);
        if (config.valorTotal() != null) {
            grupo.setValorTotalPelada(config.valorTotal());
        } else if (!ativo) {
            grupo.setValorTotalPelada(null);
        }
        grupo.setChavePixGerente(chavePix != null && !chavePix.isEmpty() ? chavePix : null);
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
                .orElseThrow(() -> new IllegalArgumentException("Grupo não encontrado"));

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

        // CPF (com ou sem pontuação)
        if (chave.matches("\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}") || chave.matches("\\d{11}")) {
            return;
        }

        // CNPJ (com ou sem pontuação)
        if (chave.matches("\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}") || chave.matches("\\d{14}")) {
            return;
        }

        // E-mail
        if (chave.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            return;
        }

        // Telefone (+55 11 99999-9999, (11) 99999-9999, +5511999999999, etc.)
        if (chave.matches("(\\+55\\s?)?(\\(?\\d{2}\\)?\\s?)?\\d{4,5}-?\\d{4}")) {
            return;
        }

        // Chave aleatória (UUID)
        if (chave.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
            return;
        }

        throw new IllegalArgumentException(
                "Chave PIX inválida! Use CPF (111.111.111-11), E-mail, Telefone (+55 11 99999-9999) ou Chave aleatória."
        );
    }
}
