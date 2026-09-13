package com.pelmanager.service;

import com.pelmanager.dto.request.EnderecoRequestDTO;
import com.pelmanager.entity.Endereco;
import com.pelmanager.repository.EnderecoRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class EnderecoService {
    private final EnderecoRepository repository;

    public EnderecoService(EnderecoRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Endereco cadastrarEndereco(EnderecoRequestDTO dto) {
        Endereco endereco = new Endereco();
        endereco.setLogradouro(dto.logradouro());
        endereco.setNumero(dto.numero());
        endereco.setBairro(dto.bairro());
        endereco.setCidade(dto.cidade());
        endereco.setEstado(dto.estado());
        endereco.setCep(dto.cep());

        return repository.save(endereco);
    }
}
