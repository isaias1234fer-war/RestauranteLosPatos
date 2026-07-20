package com.los_patos.restaurant.model.analytics;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "fact_reservas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FactReserva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reserva_sk")
    private Integer reservaSk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tiempo_id")
    private DimTiempo tiempo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private DimCliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mesa_id")
    private DimMesa mesa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id")
    private DimEmpleado empleado;

    @Column(name = "num_comensales")
    private Integer numComensales;

    @Column(name = "tiempo_ocupacion_real")
    private String tiempoOcupacionReal;

    @Column(name = "es_cancelacion")
    private Boolean esCancelacion;

    @Column(name = "es_no_show")
    private Boolean esNoShow;

    @Column(name = "ingreso_estimado", precision = 12, scale = 2)
    private BigDecimal ingresoEstimado;
}
