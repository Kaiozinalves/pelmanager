package com.pelmanager.entity;

import com.pelmanager.entity.enums.StatusPagamento;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "pagamentos")
public class Pagamento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Qual rodada
    @ManyToOne
    @JoinColumn(name = "rodada_id", nullable = false)
    private Rodada rodada;

    // Qual usuário deve pagar
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    private BigDecimal valor;

    private StatusPagamento status = StatusPagamento.PENDENTE;

    private LocalDateTime criadoEm;
    private LocalDateTime pagoEm;



    public boolean foiPago() {
        return status == StatusPagamento.PAGO;
    }

    //quando o gerente confirmar que recebeu o pagamento
    public void marcarComoPago() {
        this.status = StatusPagamento.PAGO;
        this.pagoEm = LocalDateTime.now();
    }

    public String getNomeRodada() {
        return rodada != null ? "Rodada " + rodada.getId() : "Rodada desconhecida";
    }
}
