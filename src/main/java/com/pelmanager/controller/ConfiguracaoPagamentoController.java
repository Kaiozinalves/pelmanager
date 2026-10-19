package com.pelmanager.controller;

import com.pelmanager.dto.ConfiguracaoPagamentoDTO;
import com.pelmanager.service.ConfiguracaoPagamentoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/grupos/{grupoId}/pagamento")
public class ConfiguracaoPagamentoController {

    private final ConfiguracaoPagamentoService configuracaoService;

    public ConfiguracaoPagamentoController(ConfiguracaoPagamentoService configuracaoService) {
        this.configuracaoService = configuracaoService;
    }

    @GetMapping
    public ResponseEntity<ConfiguracaoPagamentoDTO> obterconfiguracaoPagamento(@PathVariable Long grupoId){
            return ResponseEntity.ok(configuracaoService.obterConfiguracao(grupoId));
    }

    @PutMapping
    public ResponseEntity<ConfiguracaoPagamentoDTO> atualizarConfiguracao(@PathVariable Long grupoId,
                                                                          @RequestBody ConfiguracaoPagamentoDTO config){
        try{
            ConfiguracaoPagamentoDTO resultado = configuracaoService.atualizarConfiguracao(grupoId, config);
            return ResponseEntity.ok(resultado);
        }catch (IllegalArgumentException e){
            return ResponseEntity.badRequest()
                    .body(ConfiguracaoPagamentoDTO.builder()
                            .mensagem("Erro: " + e.getMessage())
                            .build());
        }
    }
}
