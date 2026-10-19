package com.pelmanager.repository;

import com.pelmanager.entity.Pagamento;
import com.pelmanager.entity.enums.StatusPagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

    // Buscar pagamento de um usuário em uma rodada
    Optional<Pagamento> findByRodadaIdAndUsuarioId(Long rodadaId, Long usuarioId);

    // Todos os pagamentos de uma rodada
    List<Pagamento> findByRodadaId(Long rodadaId);

    // Pagamentos com status específico em uma rodada
    List<Pagamento> findByRodadaIdAndStatus(Long rodadaId, StatusPagamento status);

    // Todos os pagamentos de um usuário
    List<Pagamento> findByUsuarioId(Long usuarioId);

    // Contar pagamentos com status desejado
    Long countByRodadaIdAndStatus(Long rodadaId, StatusPagamento status);

}
