package com.pelmanager.repository;

import com.pelmanager.entity.Pagamento;
import com.pelmanager.entity.enums.StatusPagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

    // Buscar pagamento de um usuário em uma rodada
    @Query("SELECT p FROM Pagamento p WHERE p.rodada.id = :rodadaId AND p.usuario.id = :usuarioId")
    Optional<Pagamento> findByRodadaIdAndUsuarioId(@Param("rodadaId") Long rodadaId, @Param("usuarioId") Long usuarioId);

    // Todos os pagamentos de uma rodada
    @Query("SELECT p FROM Pagamento p WHERE p.rodada.id = :rodadaId")
    List<Pagamento> findByRodadaId(@Param("rodadaId") Long rodadaId);

    // Pagamentos com status específico em uma rodada
    @Query("SELECT p FROM Pagamento p WHERE p.rodada.id = :rodadaId AND p.status = :status")
    List<Pagamento> findByRodadaIdAndStatus(@Param("rodadaId") Long rodadaId, @Param("status") StatusPagamento status);

    // Todos os pagamentos de um usuário
    @Query("SELECT p FROM Pagamento p WHERE p.usuario.id = :usuarioId")
    List<Pagamento> findByUsuarioId(@Param("usuarioId") Long usuarioId);

    // Contar pagamentos com status desejado
    @Query("SELECT COUNT(p) FROM Pagamento p WHERE p.rodada.id = :rodadaId AND p.status = :status")
    Long countByRodadaIdAndStatus(@Param("rodadaId") Long rodadaId, @Param("status") StatusPagamento status);

}
